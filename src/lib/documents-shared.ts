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

export type DocumentQuizItem = {
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type DocumentDetail = {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: string;
  title: string | null;
  summary: string | null;
  flashcards: { front: string; back: string }[];
  quiz: DocumentQuizItem[];
  importantQuestions: { question: string; answer: string }[];
  formulas: { name: string; formula: string; meaning: string }[];
  definitions: { term: string; definition: string }[];
  examNotes: string[];
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  uploading: "Uploading…",
  extracting: "Extracting text…",
  generating: "Generating AI content…",
  completed: "Completed",
  failed: "Failed",
  scanned: "Scanned PDF",
};

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

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
