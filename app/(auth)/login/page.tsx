"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned.endsWith("@getlivewire.com")) {
      setError("Use your @getlivewire.com email.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setPending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">XPrize</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Livewire's internal bounty board for OpenAI projects.
        </p>

        {sent ? (
          <div className="mt-6 text-sm">
            <p className="font-medium">Check your email.</p>
            <p className="text-muted-foreground mt-1">
              We sent a magic link to <span className="text-foreground">{email}</span>. Click it to sign
              in.
            </p>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm font-medium">
              Work email
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@getlivewire.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send magic link"}
            </button>
            <p className="text-xs text-muted-foreground">
              Sign-in is restricted to @getlivewire.com.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
