import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteMyStudySet, getMyStudySet, listMyStudySets } from "@/lib/study-sets.functions";
import { saveStudySet } from "@/lib/study-store";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Your saved study sets — FlashGenius" },
      { name: "description", content: "Open, review or delete the study sets you've generated." },
      { property: "og:title", content: "Your FlashGenius library" },
      { property: "og:description", content: "All the flashcard sets and quizzes you've saved." },
    ],
  }),
  component: Library,
});

function Library() {
  const list = useServerFn(listMyStudySets);
  const open = useServerFn(getMyStudySet);
  const remove = useServerFn(deleteMyStudySet);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["study-sets"], queryFn: () => list() });

  const openSet = async (id: string) => {
    try {
      const set = await open({ data: { id } });
      saveStudySet(set);
      navigate({ to: "/flashcards" });
    } catch {
      toast.error("Couldn't open that set.");
    }
  };

  const deleteSet = async (id: string) => {
    try {
      await remove({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["study-sets"] });
      toast.success("Deleted.");
    } catch {
      toast.error("Couldn't delete that set.");
    }
  };

  return (
    <main className="relative min-h-screen">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[50vh]" />
      <div className="relative mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back
        </button>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Your library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Saved study sets from your notes.</p>

        <div className="mt-8 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && !data?.length && (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              No saved sets yet. Generate one from your notes and it'll appear here.
            </p>
          )}
          {data?.map((set) => (
            <div
              key={set.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <button
                type="button"
                onClick={() => openSet(set.id)}
                className="min-w-0 text-left"
              >
                <p className="truncate font-display text-sm font-bold">{set.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {set.flashcardCount} cards · {set.quizCount} questions ·{" "}
                  {new Date(set.createdAt).toLocaleDateString()}
                </p>
              </button>
              <button
                type="button"
                onClick={() => deleteSet(set.id)}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
