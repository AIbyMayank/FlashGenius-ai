import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const pdfStudyPackSchema = z.object({
  title: z.string(),
  summary: z.string(),
  flashcards: z.array(z.object({ front: z.string(), back: z.string() })),
  quiz: z.array(
    z.object({
      difficulty: z.enum(["easy", "medium", "hard"]),
      prompt: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
    }),
  ),
  importantQuestions: z.array(z.object({ question: z.string(), answer: z.string() })),
  formulas: z.array(z.object({ name: z.string(), formula: z.string(), meaning: z.string() })),
  definitions: z.array(z.object({ term: z.string(), definition: z.string() })),
  examNotes: z.array(z.string()),
});

export type PdfStudyPack = z.infer<typeof pdfStudyPackSchema>;

const SCHEMA_TEXT = `{
  "title": string,
  "summary": string,
  "flashcards": [{ "front": string, "back": string }],
  "quiz": [{
    "difficulty": "easy" | "medium" | "hard",
    "prompt": string,
    "options": [string, string, string, string],
    "correctIndex": 0 | 1 | 2 | 3,
    "explanation": string
  }],
  "importantQuestions": [{ "question": string, "answer": string }],
  "formulas": [{ "name": string, "formula": string, "meaning": string }],
  "definitions": [{ "term": string, "definition": string }],
  "examNotes": [string]
}`;

const SYSTEM_PROMPT = `You are a study-content generator. You turn a student's document into a complete study pack.

Rules:
- Base everything STRICTLY on the provided document text. Do not introduce outside facts.
- Output ONLY valid JSON matching the schema below. No markdown, no code fences, no commentary.
- "title": short topic name (max 6 words).
- "summary": a smart summary of 120-250 words, plain text.
- Exactly 10 flashcards, answers 1-3 sentences.
- Exactly 5 MCQs for EACH difficulty (easy, medium, hard) = 15 total, 4 options each, one correct.
  "easy" = direct recall; "medium" = connect two facts; "hard" = apply or infer.
- 6-10 "importantQuestions" (likely exam questions) with concise answers.
- "formulas": every key formula found; empty array if the document has none. Never invent formulas.
- 8-12 "definitions" of important terms.
- 6-10 "examNotes": short, actionable revision bullet points.
- Keep quiz explanations 1-2 sentences.

Return JSON matching this exact schema:
${SCHEMA_TEXT}`;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

const MAX_CHARS = 120_000;

export async function generateStudyPackFromText(text: string): Promise<PdfStudyPack> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const { text: raw } = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system: SYSTEM_PROMPT,
    prompt: `Document text:\n\n${text.slice(0, MAX_CHARS)}`,
  });

  const parsed = pdfStudyPackSchema.parse(extractJson(raw));
  return {
    ...parsed,
    flashcards: parsed.flashcards.slice(0, 10),
    quiz: parsed.quiz.filter((q) => q.options.length === 4),
  };
}
