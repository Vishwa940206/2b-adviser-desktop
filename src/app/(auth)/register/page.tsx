"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setBusy(false);
      setError(signUpError.message);
      return;
    }

    // If email confirmation is disabled in Supabase, session is returned immediately
    if (data.session) {
      router.push("/dashboard");
      return;
    }

    // Email confirmation required
    setBusy(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Check your email</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="block w-full rounded-full bg-[var(--primary)] text-white py-3 font-semibold hover:bg-[var(--primary-dark)] text-center"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

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
              <text x="32" y="42" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="24" fill="#ffffff" letterSpacing="-1">MG</text>
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">MortgageGPT</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Your AI mortgage adviser</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-lg shadow-[var(--primary)]/5">

          {/* Google sign-up */}
          <button
            type="button"
            onClick={async () => {
              setGoogleBusy(true);
              setError(null);
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/auth/callback` },
              });
              if (error) { setGoogleBusy(false); setError(error.message); }
            }}
            disabled={googleBusy}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 shadow-sm"
          >
            <GoogleIcon />
            {googleBusy ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]"/>
            <span className="text-xs text-[var(--text-secondary)]">or register with email</span>
            <div className="flex-1 h-px bg-[var(--border)]"/>
          </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Create your account</h2>
          <p className="text-sm text-[var(--text-secondary)] -mt-2">
            Get started with your adviser account.
          </p>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
            />
          </div>

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
              placeholder="Min. 8 characters"
              required
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm focus:border-[var(--primary)] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
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
            {busy ? "Creating account…" : "Create account →"}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
        </div>
      </div>
    </div>
  );
}
