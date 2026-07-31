import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyDocument } from "@/lib/documents.functions";
import { documentToStudySet } from "@/lib/documents-shared";
import { saveStudySet } from "@/lib/study-store";

export const Route = createFileRoute("/_authenticated/document/$id")({
  head: () => ({
    meta: [
      { title: "Document study pack — FlashGenius" },
      {
        name: "description",
        content: "Summary, key formulas, definitions, important questions and exam notes from your PDF.",
      },
      { property: "og:title", content: "Your FlashGenius study pack" },
      { property: "og:description", content: "AI-generated study material from your uploaded PDF." },
    ],
  }),
  component: DocumentDetailPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-sm font-bold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function DocumentDetailPage() {
  const { id } = Route.useParams();
  const open = useServerFn(getMyDocument);
  const navigate = useNavigate();

  const { data: doc, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: () => open({ data: { id } }),
  });

  const study = (to: "/flashcards" | "/quiz") => {
    if (!doc) return;
    if (!doc.flashcards.length && !doc.quiz.length) {
      toast.error("Nothing generated for this document yet.");
      return;
    }
    saveStudySet(documentToStudySet(doc));
    navigate({ to });
  };

  return (
    <main className="relative min-h-screen">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[50vh]" />
      <div className="relative mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        <Link
          to="/documents"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← My documents
        </Link>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

        {doc && (
          <>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
              {doc.title ?? doc.fileName}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {doc.fileName} · {new Date(doc.uploadedAt).toLocaleString()}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => study("/flashcards")}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
              >
                View flashcards
              </button>
              <button
                type="button"
                onClick={() => study("/quiz")}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:text-primary"
              >
                Take quiz
              </button>
            </div>

            {doc.status === "scanned" && (
              <p className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Scanned PDF detected. OCR support will be added in a future update.
              </p>
            )}

            {doc.summary && <Section title="Smart summary"><p>{doc.summary}</p></Section>}

            {doc.formulas.length > 0 && (
              <Section title="Key formulas">
                <ul className="space-y-3">
                  {doc.formulas.map((f, i) => (
                    <li key={i}>
                      <p className="font-medium text-foreground">{f.name}</p>
                      <p className="font-mono text-xs text-primary">{f.formula}</p>
                      <p>{f.meaning}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {doc.definitions.length > 0 && (
              <Section title="Important definitions">
                <ul className="space-y-2">
                  {doc.definitions.map((d, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">{d.term}: </span>
                      {d.definition}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {doc.importantQuestions.length > 0 && (
              <Section title="Important questions">
                <ol className="space-y-3">
                  {doc.importantQuestions.map((q, i) => (
                    <li key={i}>
                      <p className="font-medium text-foreground">
                        {i + 1}. {q.question}
                      </p>
                      <p>{q.answer}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {doc.examNotes.length > 0 && (
              <Section title="Exam preparation notes">
                <ul className="list-disc space-y-2 pl-5">
                  {doc.examNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
