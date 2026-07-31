import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Difficulty, StudySet } from "./study-data";

export type DocumentSummary = {
  id: string;
  fileName: string;
  storagePath: string;
  uploadedAt: string;
  status: string;
  title: string | null;
  error: string | null;
  flashcardCount: number;
  quizCount: number;
};

export type DocumentDetail = {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: string;
  title: string | null;
  summary: string | null;
  flashcards: { front: string; back: string }[];
  quiz: {
    difficulty: Difficulty;
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  importantQuestions: { question: string; answer: string }[];
  formulas: { name: string; formula: string; meaning: string }[];
  definitions: { term: string; definition: string }[];
  examNotes: string[];
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const createDocumentRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ fileName: z.string().min(1), storagePath: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        user_id: context.userId,
        file_name: data.fileName,
        storage_path: data.storagePath,
        status: "extracting",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const setDocumentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().min(1),
        error: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("documents")
      .update({ status: data.status, error: data.error ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const processDocumentText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), text: z.string().min(50).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { generateStudyPackFromText } = await import("./pdf-study.server");

    let text = data.text;
    if (!text) {
      const { data: row, error } = await context.supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", data.id)
        .single();
      if (error) throw new Error(error.message);
      text = (row.extracted_text as string | null) ?? "";
      if (text.length < 50) throw new Error("No extracted text stored for this document.");
    }

    await context.supabase
      .from("documents")
      .update({ status: "generating", extracted_text: text, error: null })
      .eq("id", data.id);

    try {
      const pack = await generateStudyPackFromText(text);
      const { error } = await context.supabase
        .from("documents")
        .update({
          status: "completed",
          title: pack.title,
          summary: pack.summary,
          flashcards: pack.flashcards,
          quiz: pack.quiz,
          important_questions: pack.importantQuestions,
          formulas: pack.formulas,
          definitions: pack.definitions,
          exam_notes: pack.examNotes,
          error: null,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);

      await context.supabase.from("study_sets").insert({
        user_id: context.userId,
        title: pack.title,
        notes: text.slice(0, 20_000),
        flashcards: pack.flashcards,
        quiz: pack.quiz,
      });

      return { ok: true, title: pack.title };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await context.supabase
        .from("documents")
        .update({ status: "failed", error: message })
        .eq("id", data.id);
      throw new Error(message);
    }
  });

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DocumentSummary[]> => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, file_name, storage_path, uploaded_at, status, title, error, flashcards, quiz")
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      fileName: row.file_name as string,
      storagePath: row.storage_path as string,
      uploadedAt: row.uploaded_at as string,
      status: row.status as string,
      title: (row.title as string | null) ?? null,
      error: (row.error as string | null) ?? null,
      flashcardCount: asArray(row.flashcards).length,
      quizCount: asArray(row.quiz).length,
    }));
  });

export const getMyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<DocumentDetail> => {
    const { data: row, error } = await context.supabase
      .from("documents")
      .select(
        "id, file_name, uploaded_at, status, title, summary, flashcards, quiz, important_questions, formulas, definitions, exam_notes",
      )
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id as string,
      fileName: row.file_name as string,
      uploadedAt: row.uploaded_at as string,
      status: row.status as string,
      title: (row.title as string | null) ?? null,
      summary: (row.summary as string | null) ?? null,
      flashcards: asArray(row.flashcards),
      quiz: asArray(row.quiz),
      importantQuestions: asArray(row.important_questions),
      formulas: asArray(row.formulas),
      definitions: asArray(row.definitions),
      examNotes: asArray(row.exam_notes),
    };
  });

export const deleteMyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .single();

    if (row?.storage_path) {
      await context.supabase.storage.from("documents").remove([row.storage_path as string]);
    }

    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export function documentToStudySet(doc: DocumentDetail): StudySet {
  return {
    title: doc.title ?? doc.fileName,
    flashcards: doc.flashcards.map((c, i) => ({ id: i + 1, ...c })),
    quiz: doc.quiz.map((q, i) => ({
      id: i + 1,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: q.options,
      answerIndex: Math.min(3, Math.max(0, q.correctIndex)),
      explanation: q.explanation,
    })),
  };
}
