import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { quizQuestions } from "@/lib/study-data";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — FlashGenius" },
      {
        name: "description",
        content:
          "Test yourself with multiple-choice questions, get instant right/wrong feedback and a final score.",
      },
      { property: "og:title", content: "Quiz — FlashGenius" },
      {
        property: "og:description",
        content: "Instant feedback multiple-choice quiz built from your notes.",
      },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const question = quizQuestions[index];
  const progress = ((index + 1) / quizQuestions.length) * 100;

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === question.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (index === quizQuestions.length - 1) {
      setDone(true);
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / quizQuestions.length) * 100);
    return (
      <main className="relative min-h-screen">
        <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[60vh]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Quiz complete
          </span>
          <p className="mt-6 font-display text-7xl font-bold tabular-nums text-primary">{pct}%</p>
          <p className="mt-3 text-sm text-muted-foreground">
            You got {score} of {quizQuestions.length} correct.
          </p>
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            {pct === 100
              ? "Flawless. This topic is locked in."
              : pct >= 60
                ? "Solid work — one more pass and you're there."
                : "Review the flashcards, then run it back."}
          </p>

          <div className="mt-10 w-full space-y-3">
            <button
              type="button"
              onClick={restart}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110"
            >
              Retake quiz
            </button>
            <Link
              to="/flashcards"
              className="block w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-medium transition hover:border-primary/50"
            >
              Review flashcards
            </Link>
            <Link
              to="/"
              className="block w-full py-2 text-xs text-muted-foreground transition hover:text-foreground"
            >
              New study set
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
          <h1 className="truncate text-center text-sm font-semibold">Quiz</h1>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {index + 1} of {quizQuestions.length}
          </span>
        </header>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold leading-snug">{question.prompt}</h2>

        <div className="mt-6 space-y-3">
          {question.options.map((option, i) => {
            const isAnswer = i === question.answerIndex;
            const isPicked = selected === i;
            const revealed = selected !== null;

            const state = revealed
              ? isAnswer
                ? "border-success bg-success/10 text-foreground"
                : isPicked
                  ? "border-destructive bg-destructive/10 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              : "border-border bg-card hover:border-primary/50";

            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(i)}
                disabled={revealed}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition ${state}`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-[0.7rem] font-semibold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">{option}</span>
                {revealed && isAnswer && (
                  <span className="shrink-0 text-xs font-semibold text-success">Correct</span>
                )}
                {revealed && isPicked && !isAnswer && (
                  <span className="shrink-0 text-xs font-semibold text-destructive">Wrong</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={next}
            disabled={selected === null}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            {index === quizQuestions.length - 1 ? "See score" : "Next question"}
          </button>
        </div>
      </div>
    </main>
  );
}
