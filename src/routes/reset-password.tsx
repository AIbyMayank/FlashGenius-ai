import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — FlashGenius" },
      { name: "description", content: "Choose a new password for your FlashGenius account." },
      { property: "og:title", content: "Reset your FlashGenius password" },
      { property: "og:description", content: "Set a new password and get back to studying." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[60vh]" />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Choose a password of at least 6 characters."
            : "Open this page from the reset link in your email."}
        </p>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <label htmlFor="new-password" className="text-xs font-medium text-muted-foreground">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full rounded-xl bg-primary py-3.5 font-display text-sm font-bold tracking-wide text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
