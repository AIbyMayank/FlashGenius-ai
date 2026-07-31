import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "login" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.65-.07-1.15-.16-1.65H12z"
      />
    </svg>
  );
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const withGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      toast.success("Signed in with Google.");
      onClose();
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          toast.success("Check your email to confirm your account.");
          return;
        }
        toast.success("Account created.");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first, then tap “Forgot password?”.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent — check your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send the reset link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-2xl duration-200 sm:rounded-3xl sm:p-8"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <h2 id="auth-title" className="font-display text-2xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Log in to save your study sets."
                : "Sign up to keep your flashcards in sync."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {sentConfirmation ? (
          <div className="mt-6 rounded-2xl border border-border bg-secondary p-5 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Click it to activate your
            account, then log in.
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={withGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium transition hover:border-primary/50 disabled:opacity-60"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                or
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-3" onSubmit={submit}>
              <div>
                <label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="auth-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={forgotPassword}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-xl bg-primary py-3.5 font-display text-sm font-bold tracking-wide text-primary-foreground transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {mode === "login" ? "New to FlashGenius? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
