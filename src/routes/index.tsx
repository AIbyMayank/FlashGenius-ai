import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlashGenius — Turn notes into flashcards & quizzes" },
      {
        name: "description",
        content:
          "Paste your class notes and instantly study with flip flashcards and multiple-choice quizzes. Minimal, dark, mobile-first.",
      },
      { property: "og:title", content: "FlashGenius — Study smarter from your notes" },
      {
        property: "og:description",
        content: "Paste notes, generate flashcards and quizzes, and track your score.",
      },
    ],
  }),
  component: Landing,
});

const SAMPLE = `Mitosis produces two identical daughter cells.
Osmosis moves water across a semipermeable membrane.
ATP is the energy currency of the cell.`;

function Landing() {
  const [notes, setNotes] = useState("");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[70vh]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10 sm:py-16">
        <header className="flex items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
            F
          </span>
          <span className="font-display text-lg font-bold tracking-tight">FlashGenius</span>
        </header>

        <section className="mt-14 sm:mt-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Study, distilled
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl">
            Paste your notes.
            <br />
            Learn them tonight.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            FlashGenius turns messy lecture notes into flip cards and quick quizzes — so revision
            takes minutes, not evenings.
          </p>
        </section>

        <section className="mt-8">
          <label htmlFor="notes" className="sr-only">
            Your notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your notes here…"
            className="min-h-56 w-full resize-y rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setNotes(SAMPLE)}
              className="text-xs font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Use sample notes
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {notes.trim().length} chars
            </span>
          </div>

          <Link
            to="/flashcards"
            className="mt-5 flex h-13 w-full items-center justify-center rounded-2xl bg-primary py-4 font-display text-sm font-bold tracking-wide text-primary-foreground transition hover:brightness-110 active:scale-[0.99]"
          >
            Generate study set
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/flashcards"
              className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-medium transition hover:border-primary/50"
            >
              Flashcards
            </Link>
            <Link
              to="/quiz"
              className="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-medium transition hover:border-primary/50"
            >
              Quiz
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo set loaded — AI generation coming soon.
          </p>
        </section>
      </div>
    </main>
  );
}
