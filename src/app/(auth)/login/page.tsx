"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // router.refresh() forces Next.js to re-evaluate server state before navigation
    router.refresh();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg shadow-[var(--primary)]/30">
            <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6"/>
                  <stop offset="100%" stopColor="#4F35CC"/>
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="16" fill="url(#lg)"/>
              <ellipse cx="27" cy="19" rx="14" ry="8" fill="rgba(255,255,255,0.2)" transform="rotate(-15 27 19)"/>
              <text x="32" y="42" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="24" fill="#ffffff" letterSpacing="-1">AA</text>
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">Agentic Advisor</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Smart advice, powered by AI</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Welcome back.</h2>
          <p className="text-sm text-[var(--text-secondary)] -mt-2">
            Sign in to your adviser account to continue.
          </p>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.co.uk"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
            />
          </div>

          {error ? (
            <div className="text-sm text-[var(--error)] bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[var(--primary)] text-white py-3 font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in →"}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Same login as the mobile app.
          </p>
        </form>
      </div>
    </div>
  );
}
