import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { demoStudySet, type StudySet } from "@/lib/study-data";
import { loadStudySet } from "@/lib/study-store";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards — FlashGenius" },
      {
        name: "description",
        content: "Flip through the flashcards generated from your notes and track your progress.",
      },
      { property: "og:title", content: "Flashcards — FlashGenius" },
      {
        property: "og:description",
        content: "Tap to flip through your deck and review your notes fast.",
      },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const [set, setSet] = useState<StudySet>(demoStudySet);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const stored = loadStudySet();
    if (stored) setSet(stored);
  }, []);

  const cards = set.flashcards;
  const card = cards[Math.min(index, cards.length - 1)];
  const progress = ((index + 1) / cards.length) * 100;

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + delta)));
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            Back
          </Link>
          <h1 className="truncate text-center text-sm font-semibold">{set.title}</h1>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {index + 1} of {cards.length}
          </span>
        </header>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label="Flip card"
          className="flip-scene mt-8 w-full"
        >
          <div className={`flip-inner relative h-80 w-full ${flipped ? "is-flipped" : ""}`}>
            <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-7 text-center">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Question
              </span>
              <p className="mt-4 font-display text-2xl font-bold leading-snug">{card.front}</p>
              <span className="mt-auto text-xs text-muted-foreground">Tap to flip</span>
            </div>
            <div className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-primary/40 bg-card p-7 text-center">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary">
                Answer
              </span>
              <p className="mt-4 text-base leading-relaxed text-card-foreground">{card.back}</p>
              <span className="mt-auto text-xs text-muted-foreground">Tap to flip back</span>
            </div>
          </div>
        </button>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="rounded-2xl border border-border bg-card py-3.5 text-sm font-medium transition hover:border-primary/50 disabled:opacity-40"
          >
            Previous
          </button>
          {index === cards.length - 1 ? (
            <Link
              to="/quiz"
              className="flex items-center justify-center rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Start quiz
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => go(1)}
              className="rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
