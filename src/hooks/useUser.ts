"use client";

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UserState {
  id: string | null;
  email: string | null;
  fullName: string | null;
  loading: boolean;
}

export function useUser(): UserState & {
  signOut: () => void;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<UserState>({
    id: null,
    email: null,
    fullName: null,
    loading: true,
  });
  const mounted = useRef(true);

  const loadProfile = async (u: User | null) => {
    if (!u) {
      if (mounted.current) setState({ id: null, email: null, fullName: null, loading: false });
      return;
    }
    // Unblock pages immediately — set id/email now, fullName fills in shortly
    if (mounted.current) setState({ id: u.id, email: u.email ?? null, fullName: null, loading: false });
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", u.id)
      .maybeSingle();
    if (mounted.current && profile?.full_name) {
      setState((prev) => ({ ...prev, fullName: profile.full_name }));
    }
  };

  const refresh = async () => {
    // Explicit refresh: re-validate session and reload profile
    const { data: { session } } = await supabase.auth.getSession();
    await loadProfile(session?.user ?? null);
  };

  useEffect(() => {
    mounted.current = true;
    // Fast initial load — reads localStorage, no network call
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user ?? null);
    });
    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = () => {
    // Fire-and-forget — don't await; a hanging network call was blocking the redirect
    supabase.auth.signOut().catch(() => {});
    try { localStorage.clear(); } catch { /* ignore */ }
    try { sessionStorage.clear(); } catch { /* ignore */ }
    window.location.href = "/login";
  };

  return { ...state, signOut, refresh };
}
