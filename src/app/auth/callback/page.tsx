"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/Spinner";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase picks up the code/token from the URL automatically via detectSessionInUrl.
    // We just wait for the session to be established then redirect.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/dashboard");
      }
    });

    // Fallback: if already signed in by the time this mounts, redirect immediately.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <Spinner label="Signing you in…" />
    </div>
  );
}
