"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Client } from "@/types/database";

import { useUser } from "./useUser";

export function useClients() {
  const { id: adviserId, loading: authLoading } = useUser();
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!adviserId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setData((rows ?? []) as Client[]);
    setLoading(false);
  }, [adviserId, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useClient(id: string | null) {
  const { id: adviserId, loading: authLoading } = useUser();
  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    if (authLoading || !adviserId) return;
    setLoading(true);
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data: row }) => {
        setData((row as Client) ?? null);
        setLoading(false);
      });
  }, [id, adviserId, authLoading]);

  return { data, loading };
}
