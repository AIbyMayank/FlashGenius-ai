import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteMyDocument,
  getMyDocument,
  listMyDocuments,
  processDocumentText,
} from "@/lib/documents.functions";
import { STATUS_LABELS, documentToStudySet } from "@/lib/documents-shared";
import { saveStudySet } from "@/lib/study-store";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "My documents — FlashGenius" },
      {
        name: "description",
        content: "Every PDF you've uploaded, with its summary, flashcards and quiz.",
      },
      { property: "og:title", content: "My FlashGenius documents" },
      {
        property: "og:description",
        content: "Open summaries, flashcards and quizzes generated from your PDFs.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const list = useServerFn(listMyDocuments);
  const open = useServerFn(getMyDocument);
  const remove = useServerFn(deleteMyDocument);
  const regenerate = useServerFn(processDocumentText);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => list() });

  const loadInto = async (id: string, to: "/flashcards" | "/quiz") => {
    setBusyId(id);
    try {
      const doc = await open({ data: { id } });
      if (!doc.flashcards.length && !doc.quiz.length) {
        toast.error("This document has no generated content yet.");
        return;
      }
      saveStudySet(documentToStudySet(doc));
      navigate({ to });
    } catch {
      toast.error("Couldn't open that document.");
    } finally {
      setBusyId(null);
    }
  };

  const onRegenerate = async (id: string) => {
    setBusyId(id);
    try {
      await regenerate({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Regenerated.");
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      if (raw.includes("429")) toast.error("Rate limited — try again shortly.");
      else if (raw.includes("402")) toast.error("AI credits exhausted.");
      else toast.error("Couldn't regenerate this document.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    setBusyId(id);
    try {
      await remove({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Deleted.");
    } catch {
      toast.error("Couldn't delete that document.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[50vh]" />
      <div className="relative mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        <nav className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:text-foreground hover:underline">
            ← Home
          </Link>
          <Link to="/upload" className="underline-offset-4 hover:text-foreground hover:underline">
            Upload PDF
          </Link>
          <Link to="/library" className="underline-offset-4 hover:text-foreground hover:underline">
            Library
          </Link>
        </nav>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">My documents</h1>
            <p className="mt-1 text-sm text-muted-foreground">PDFs you've turned into study packs.</p>
          </div>
          <Link
            to="/upload"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            Upload PDF
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && !data?.length && (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No documents yet. Upload a PDF and it'll appear here.
            </p>
          )}

          {data?.map((doc) => {
            const ready = doc.status === "completed";
            const busy = busyId === doc.id;
            return (
              <article key={doc.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold">
                      {doc.title ?? doc.fileName}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{doc.fileName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleString()} · {doc.flashcardCount} cards ·{" "}
                      {doc.quizCount} questions
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${
                      ready
                        ? "bg-primary/15 text-primary"
                        : doc.status === "failed"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                </div>

                {doc.status === "scanned" && (
                  <p className="mt-3 rounded-xl border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                    Scanned PDF detected. OCR support will be added in a future update.
                  </p>
                )}
                {doc.status === "failed" && doc.error && (
                  <p className="mt-3 truncate text-xs text-destructive">{doc.error}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/document/$id"
                    params={{ id: doc.id }}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary"
                  >
                    View summary
                  </Link>
                  <button
                    type="button"
                    disabled={!ready || busy}
                    onClick={() => loadInto(doc.id, "/flashcards")}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                  >
                    View flashcards
                  </button>
                  <button
                    type="button"
                    disabled={!ready || busy}
                    onClick={() => loadInto(doc.id, "/quiz")}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                  >
                    Take quiz
                  </button>
                  <button
                    type="button"
                    disabled={busy || doc.status === "scanned"}
                    onClick={() => onRegenerate(doc.id)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                  >
                    {busy ? "Working…" : "Generate again"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(doc.id)}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive/60 hover:text-destructive disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
