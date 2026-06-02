"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { useUser } from "@/hooks/useUser";

export default function ProfilePage() {
  const router = useRouter();
  const { email, fullName, id, signOut } = useUser();

  const onSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and preferences" />
      <div className="p-8 max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold flex items-center justify-center shadow shadow-[var(--primary)]/30">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-lg truncate">{fullName ?? "Adviser"}</div>
              <div className="text-sm text-[var(--text-secondary)] truncate">{email ?? "—"}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate">
                User ID: {id ?? "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm space-y-3">
          <div className="font-bold">Account</div>
          <p className="text-sm text-[var(--text-secondary)]">
            Profile editing, password change, and subscription management land here next. For
            now you can sign out.
          </p>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-100"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}
