"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Sidebar } from "@/components/Sidebar";
import { Spinner } from "@/components/Spinner";
import { useUser } from "@/hooks/useUser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { id, loading } = useUser();

  useEffect(() => {
    if (!loading && !id) router.replace("/login");
  }, [loading, id, router]);

  if (loading || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
