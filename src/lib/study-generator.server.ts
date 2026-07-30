import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import type { Difficulty, StudySet } from "./study-data";

export const studySetSchema = z.object({
  title: z.string(),
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
});

const SCHEMA_TEXT = `{
  "title": string,
  "flashcards": [{ "front": string, "back": string }],
  "quiz": [{
    "difficulty": "easy" | "medium" | "hard",
    "prompt": string,
    "options": [string, string, string, string],
    "correctIndex": 0 | 1 | 2 | 3,
    "explanation": string
  }]
}`;

const SYSTEM_PROMPT = `You are a study-content generator. You turn a student's notes into flashcards and a multiple-choice quiz.

Rules:
- Base every question and answer STRICTLY on the provided notes. Do not introduce outside facts.
- If the notes are too short or vague to produce something, make reasonable inferences but stay grounded in the text.
- Output ONLY valid JSON matching the schema below. No markdown, no code fences, no commentary, no text before or after the JSON.
- Generate exactly 10 flashcards.
- Generate exactly 5 MCQ questions for EACH of 3 difficulty levels (easy, medium, hard) — 15 questions total.
- Each MCQ must have exactly 4 options, only one correct.
- "easy" = direct recall of explicitly stated facts.
- "medium" = requires connecting two related facts from the notes.
- "hard" = requires applying or inferring beyond a single stated fact.
- Keep flashcard answers concise (1-3 sentences).
- Keep quiz explanations concise (1-2 sentences).
- "title" is a short topic name (max 6 words) for the notes.

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

export async function generateStudySetFromNotes(notes: string): Promise<StudySet> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const { text } = await generateText({
    model: gateway("google/gemini-3.6-flash"),
    system: SYSTEM_PROMPT,
    prompt: `Notes:\n\n${notes}`,
  });

  const parsed = studySetSchema.parse(extractJson(text));

  return {
    title: parsed.title,
    flashcards: parsed.flashcards.slice(0, 10).map((c, i) => ({ id: i + 1, ...c })),
    quiz: parsed.quiz
      .filter((q) => q.options.length === 4)
      .map((q, i) => ({
        id: i + 1,
        difficulty: q.difficulty as Difficulty,
        prompt: q.prompt,
        options: q.options,
        answerIndex: Math.min(3, Math.max(0, q.correctIndex)),
        explanation: q.explanation,
      })),
  };
}
