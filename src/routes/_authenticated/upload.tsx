import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { extractPdfText } from "@/lib/pdf-extract";
import { uploadPdfWithProgress } from "@/lib/storage-upload";
import {
  createDocumentRecord,
  processDocumentText,
  setDocumentStatus,
} from "@/lib/documents.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload a PDF — FlashGenius" },
      {
        name: "description",
        content:
          "Upload a lecture PDF and FlashGenius extracts the text and builds a summary, flashcards, a quiz and exam notes.",
      },
      { property: "og:title", content: "Upload a PDF to FlashGenius" },
      {
        property: "og:description",
        content: "Turn any PDF into a full AI study pack in one step.",
      },
    ],
  }),
  component: UploadPage,
});

const MAX_BYTES = 20 * 1024 * 1024;

type Stage = "idle" | "uploading" | "extracting" | "generating" | "completed" | "scanned" | "failed";

const STAGE_TEXT: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading…",
  extracting: "Extracting text…",
  generating: "Generating AI content…",
  completed: "Completed.",
  scanned: "Scanned PDF detected.",
  failed: "Something went wrong.",
};

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [pageInfo, setPageInfo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const createDoc = useServerFn(createDocumentRecord);
  const markStatus = useServerFn(setDocumentStatus);
  const process = useServerFn(processDocumentText);

  const busy = stage === "uploading" || stage === "extracting" || stage === "generating";

  const pick = (next: File | null) => {
    if (!next) return;
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }
    if (next.size > MAX_BYTES) {
      toast.error("That file is larger than 20MB.");
      return;
    }
    setFile(next);
    setStage("idle");
    setProgress(0);
    setMessage(null);
    setPageInfo(null);
  };

  const start = async () => {
    if (!file || !user) return;
    setMessage(null);
    setProgress(0);

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    let docId: string | null = null;

    try {
      setStage("uploading");
      await uploadPdfWithProgress(path, file, setProgress);

      const created = await createDoc({ data: { fileName: file.name, storagePath: path } });
      docId = created.id;

      setStage("extracting");
      const extraction = await extractPdfText(file, (page, total) =>
        setPageInfo(`Page ${page} of ${total}`),
      );
      setPageInfo(null);

      if (extraction.scanned || extraction.text.length < 200) {
        setStage("scanned");
        setMessage("Scanned PDF detected. OCR support will be added in a future update.");
        await markStatus({
          data: {
            id: docId,
            status: "scanned",
            error: "Scanned PDF detected. OCR support will be added in a future update.",
          },
        });
        return;
      }

      setStage("generating");
      await process({ data: { id: docId, text: extraction.text } });

      setStage("completed");
      toast.success("Study pack ready.");
      navigate({ to: "/documents" });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      setStage("failed");
      if (raw.includes("429")) setMessage("Rate limited — try again in a moment.");
      else if (raw.includes("402")) setMessage("AI credits exhausted. Add credits to continue.");
      else setMessage(raw || "Something went wrong. Please try again.");
      if (docId) {
        try {
          await markStatus({ data: { id: docId, status: "failed", error: raw.slice(0, 300) } });
        } catch {
          /* status update is best-effort */
        }
      }
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
          <Link to="/documents" className="underline-offset-4 hover:text-foreground hover:underline">
            My documents
          </Link>
          <Link to="/library" className="underline-offset-4 hover:text-foreground hover:underline">
            Library
          </Link>
        </nav>

        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Upload a PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to 20MB. We extract the text and build a full study pack from it.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) pick(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`mt-8 rounded-2xl border border-dashed p-6 text-center transition sm:p-10 ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <p className="font-display text-sm font-bold">
            {file ? file.name : "Drop your PDF here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : "PDF only · max 20MB · text-based documents"}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/50 hover:text-primary disabled:opacity-60"
          >
            {file ? "Choose another file" : "Choose file"}
          </button>
        </div>

        <button
          type="button"
          onClick={start}
          disabled={!file || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-display text-sm font-bold tracking-wide text-primary-foreground transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {busy ? STAGE_TEXT[stage] : "Upload & generate"}
        </button>

        {stage !== "idle" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-sm font-bold">{STAGE_TEXT[stage]}</p>
            {stage === "uploading" && (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">{progress}%</p>
              </div>
            )}
            {stage === "extracting" && pageInfo && (
              <p className="mt-2 text-xs text-muted-foreground">{pageInfo}</p>
            )}
            {stage === "generating" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Summary, flashcards, quiz, key formulas and exam notes…
              </p>
            )}
            {message && (
              <p
                className={`mt-3 text-sm ${
                  stage === "failed" ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {message}
              </p>
            )}
            {(stage === "scanned" || stage === "failed") && (
              <Link
                to="/documents"
                className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-xs font-medium transition hover:border-primary/50 hover:text-primary"
              >
                Go to my documents
              </Link>
            )}
          </div>
        )}

        <ol className="mt-8 space-y-2 text-xs text-muted-foreground">
          <li>1. Uploading…</li>
          <li>2. Extracting text…</li>
          <li>3. Generating AI content…</li>
          <li>4. Completed.</li>
        </ol>
      </div>
    </main>
  );
}
