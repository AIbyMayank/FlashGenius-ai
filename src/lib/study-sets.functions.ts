import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StudySet } from "./study-data";

const studySetInput = z.object({
  title: z.string().min(1),
  notes: z.string().optional(),
  flashcards: z.array(z.record(z.string(), z.any())),
  quiz: z.array(z.record(z.string(), z.any())),
});

export const saveStudySetToCloud = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => studySetInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("study_sets")
      .insert({
        user_id: context.userId,
        title: data.title,
        notes: data.notes ?? null,
        flashcards: data.flashcards,
        quiz: data.quiz,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const listMyStudySets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("study_sets")
      .select("id, title, created_at, flashcards, quiz")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      createdAt: row.created_at as string,
      flashcardCount: Array.isArray(row.flashcards) ? row.flashcards.length : 0,
      quizCount: Array.isArray(row.quiz) ? row.quiz.length : 0,
    }));
  });

export const getMyStudySet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<StudySet> => {
    const { data: row, error } = await context.supabase
      .from("study_sets")
      .select("title, flashcards, quiz")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return {
      title: row.title as string,
      flashcards: (row.flashcards ?? []) as StudySet["flashcards"],
      quiz: (row.quiz ?? []) as StudySet["quiz"],
    };
  });

export const deleteMyStudySet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("study_sets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
