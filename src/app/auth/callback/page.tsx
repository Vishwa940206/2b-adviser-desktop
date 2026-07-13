"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AuthBackground } from "@/components/AuthBackground";
import { supabase } from "@/lib/supabase";
import { syncAdvisorToCRM } from "@/lib/syncToCRM";
import { Spinner } from "@/components/Spinner";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase picks up the code/token from the URL automatically via detectSessionInUrl.
    // We just wait for the session to be established then redirect.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Sync Google OAuth user to CRM (fire-and-forget)
        if (session?.user.email) {
          void syncAdvisorToCRM({
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name ?? null,
            avatar_url: session.user.user_metadata?.avatar_url ?? null,
            role: "advisor",
          });
        }
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
    <AuthBackground>
      <Spinner label="Signing you in…" className="text-white/70" />
    </AuthBackground>
  );
}
