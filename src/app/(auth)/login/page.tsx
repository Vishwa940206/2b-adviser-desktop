"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthBackground } from "@/components/AuthBackground";
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

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4" strokeWidth="2"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // Step 1 — credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 — MFA
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the code input when the MFA step appears
  useEffect(() => {
    if (mfaStep) codeInputRef.current?.focus();
  }, [mfaStep]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setBusy(false);
      setError(signInError.message);
      return;
    }

    // Check if MFA verification is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        setMfaFactorId(totp.id);
        setMfaStep(true);
        setBusy(false);
        return;
      }
    }

    router.push("/dashboard");
  };

  const onMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mfaFactorId) return;

    const code = mfaCode.replace(/\s/g, "");
    if (code.length !== 6) { setError("Enter your 6-digit code."); return; }

    setMfaBusy(true);
    setError(null);

    const { error: mfaError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaFactorId,
      code,
    });

    setMfaBusy(false);

    if (mfaError) {
      setError("Invalid code — check your authenticator app and try again.");
      setMfaCode("");
      codeInputRef.current?.focus();
      return;
    }

    router.push("/dashboard");
  };

  // Format input as "123 456"
  const handleCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setMfaCode(digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits);
  };

  const onGoogleSignIn = async () => {
    setGoogleBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setGoogleBusy(false); setError(error.message); }
  };

  // ── MFA step ──────────────────────────────────────────────────────────────
  if (mfaStep) {
    return (
      <AuthBackground>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto backdrop-blur">
              <ShieldIcon />
            </div>
            <h1 className="font-heading mt-4 text-2xl font-bold text-white">Two-factor verification</h1>
            <p className="text-sm text-white/60 mt-1.5">
              Open your authenticator app and enter the 6-digit code for MortgageGPT.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg shadow-[var(--primary)]/5">
            <form onSubmit={onMfaSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Authentication code
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="123 456"
                  required
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-4 text-2xl font-mono text-center tracking-[0.4em] focus:border-[var(--primary)] outline-none transition"
                />
              </div>

              {error && (
                <div className="text-sm text-[var(--error)] bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={mfaBusy || mfaCode.replace(/\s/g, "").length < 6}
                className="w-full rounded-full bg-[var(--primary)] text-white py-3 font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition"
              >
                {mfaBusy ? "Verifying…" : "Verify →"}
              </button>
            </form>

            <button
              onClick={() => { setMfaStep(false); setMfaFactorId(null); setMfaCode(""); setError(null); }}
              className="mt-4 w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              ← Back to login
            </button>
          </div>

          <p className="text-center text-xs text-white/50 mt-6">
            Lost access to your authenticator? Contact your administrator to reset 2FA.
          </p>
        </div>
      </AuthBackground>
    );
  }

  // ── Normal login ──────────────────────────────────────────────────────────
  return (
    <AuthBackground>
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto shadow-xl shadow-black/30">
            <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6"/>
                  <stop offset="100%" stopColor="#4F35CC"/>
                </linearGradient>
                <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
                  <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
                </linearGradient>
              </defs>
              <rect width="80" height="80" rx="22" fill="url(#lg)"/>
              <rect width="80" height="40" rx="22" fill="url(#sheen)"/>
              <ellipse cx="34" cy="24" rx="18" ry="10" fill="rgba(255,255,255,0.15)" transform="rotate(-15 34 24)"/>
              <path d="M40 20 L56 34 L56 58 L46 58 L46 46 L34 46 L34 58 L24 58 L24 34 Z" fill="rgba(255,255,255,0.9)" />
              <path d="M32 20 L40 13 L48 20" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinejoin="round"/>
              <circle cx="58" cy="22" r="3" fill="rgba(255,255,255,0.7)"/>
              <circle cx="63" cy="17" r="1.5" fill="rgba(255,255,255,0.5)"/>
              <circle cx="54" cy="16" r="1" fill="rgba(255,255,255,0.5)"/>
            </svg>
          </div>
          <h1 className="font-heading mt-4 text-3xl font-bold text-white">MortgageGPT</h1>
          <p className="text-sm text-white/60 mt-1.5">Your AI mortgage adviser platform</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>
              FCA-aware
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"/>
              OpenAI powered
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"/>
              Secure
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl shadow-black/40 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Welcome back</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Sign in to your adviser account</p>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googleBusy}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 shadow-sm"
          >
            <GoogleIcon />
            {googleBusy ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]"/>
            <span className="text-xs text-[var(--text-secondary)]">or sign in with email</span>
            <div className="flex-1 h-px bg-[var(--border)]"/>
          </div>

          {/* Email / password form */}
          <form onSubmit={onSubmit} className="space-y-4">
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
              className="w-full rounded-full bg-[var(--primary)] text-white py-3 font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition"
            >
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[var(--primary)] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          By signing in you agree to our{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </AuthBackground>
  );
}
