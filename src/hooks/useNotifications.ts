"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types/database";

import { useUser } from "./useUser";

// Desktop (OS-level) toast for a freshly-arrived notification. Only fires
// while permission has been granted and the tab isn't the one in focus —
// the in-app bell already covers that case.
function showDesktopToast(n: Notification): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (window.Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const toast = new window.Notification(n.title, {
    body: n.body ?? undefined,
    tag: n.id,
  });
  toast.onclick = () => {
    window.focus();
    if (n.link) window.location.href = n.link;
    toast.close();
  };
}

export function useNotifications() {
  const { id: adviserId, loading: authLoading } = useUser();
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!adviserId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("adviser_id", adviserId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error) setData((rows ?? []) as Notification[]);
    setLoading(false);
  }, [adviserId, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!adviserId) return;
    const channel = supabase
      .channel(`notifications:${adviserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `adviser_id=eq.${adviserId}` },
        (payload) => {
          const row = payload.new as Notification;
          setData((prev) => [row, ...prev]);
          showDesktopToast(row);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [adviserId]);

  const markAsRead = useCallback(async (id: string) => {
    setData((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!adviserId) return;
    const now = new Date().toISOString();
    setData((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("adviser_id", adviserId)
      .is("read_at", null);
  }, [adviserId]);

  const unreadCount = data.filter((n) => !n.read_at).length;

  return { data, loading, unreadCount, refresh, markAsRead, markAllAsRead };
}
