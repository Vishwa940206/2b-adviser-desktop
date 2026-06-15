"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

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

  const refresh = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const u = userRes.user;
    if (!u) {
      setState({ id: null, email: null, fullName: null, loading: false });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", u.id)
      .maybeSingle();
    setState({
      id: u.id,
      email: u.email ?? null,
      fullName: profile?.full_name ?? null,
      loading: false,
    });
  };

  useEffect(() => {
    refresh();
    const sub = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.data.subscription.unsubscribe();
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
