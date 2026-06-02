"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { useUser } from "./useUser";

interface Stats {
  newApplications: number;
  activeCases: number;
  tasksDueToday: number;
  pipelineValue: number;
  loading: boolean;
}

export function useStats(): Stats {
  const { id: adviserId, loading: authLoading } = useUser();
  const [stats, setStats] = useState<Stats>({
    newApplications: 0,
    activeCases: 0,
    tasksDueToday: 0,
    pipelineValue: 0,
    loading: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!adviserId) {
      setStats((s) => ({ ...s, loading: false }));
      return;
    }
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [apps, cases, tasks, pipeline] = await Promise.all([
        supabase
          .from("b2b_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted"),
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .neq("stage", "completed"),
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .lte("due_date", today),
        supabase.from("cases").select("value").neq("stage", "completed"),
      ]);

      const pipelineTotal =
        pipeline.data?.reduce((sum, row: { value: number | null }) => sum + (row.value ?? 0), 0) ?? 0;

      setStats({
        newApplications: apps.count ?? 0,
        activeCases: cases.count ?? 0,
        tasksDueToday: tasks.count ?? 0,
        pipelineValue: pipelineTotal,
        loading: false,
      });
    })();
  }, [adviserId, authLoading]);

  return stats;
}
