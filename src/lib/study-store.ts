import type { StudySet } from "./study-data";

const KEY = "flashgenius:set";

export function saveStudySet(set: StudySet) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(set));
}

export function loadStudySet(): StudySet | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudySet;
  } catch {
    return null;
  }
}
