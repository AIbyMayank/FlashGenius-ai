import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { demoStudySet } from "@/lib/study-data";
import { saveStudySet } from "@/lib/study-store";
import { generateStudySet } from "@/lib/study.functions";
import { saveStudySetToCloud } from "@/lib/study-sets.functions";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlashGenius — Turn notes into flashcards & quizzes" },
      {
        name: "description",
        content:
          "Paste your class notes and instantly get AI flashcards and a multiple-choice quiz across three difficulty levels.",
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

const SAMPLE = `Mitosis produces two genetically identical daughter cells and is preceded by DNA replication.
Osmosis is the movement of water across a semipermeable membrane toward higher solute concentration.
ATP is the energy currency of the cell and is produced mainly by mitochondria during aerobic respiration.
Enzymes are protein catalysts that lower the activation energy of reactions.
Photosynthesis converts light, CO2 and water into glucose and oxygen.`;

function Landing() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const generate = useServerFn(generateStudySet);

  const onGenerate = async () => {
    if (notes.trim().length < 20) {
      toast.error("Add a bit more text — at least a couple of sentences.");
      return;
    }
    setLoading(true);
    try {
      const set = await generate({ data: { notes: notes.trim() } });
      if (!set.flashcards.length || !set.quiz.length) {
        throw new Error("Empty study set");
      }
      saveStudySet(set);
      navigate({ to: "/flashcards" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("429")) toast.error("Rate limited — try again in a moment.");
      else if (message.includes("402")) toast.error("AI credits exhausted. Add credits to continue.");
      else toast.error("Couldn't generate a study set. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => {
    saveStudySet(demoStudySet);
    navigate({ to: "/flashcards" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[70vh]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10 sm:py-16">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
              F
            </span>
            <span className="truncate font-display text-lg font-bold tracking-tight">
              FlashGenius
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
          >
            Login
          </button>
        </header>

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

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
            FlashGenius turns messy lecture notes into 10 flip cards and a 15-question quiz across
            easy, medium and hard levels.
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
            disabled={loading}
            placeholder="Paste your notes here…"
            className="min-h-56 w-full resize-y rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
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

          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display text-sm font-bold tracking-wide text-primary-foreground transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {loading ? "Generating study set…" : "Generate study set"}
          </button>

          <button
            type="button"
            onClick={useDemo}
            className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-medium transition hover:border-primary/50"
          >
            Skip — open the demo set
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Powered by Lovable AI. Questions stay grounded in your notes.
          </p>
        </section>
      </div>
    </main>
  );
}
