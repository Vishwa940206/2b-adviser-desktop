"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useClients } from "@/hooks/useClients";
import { formatLongDate } from "@/lib/format";

export default function ClientsPage() {
  const { data, loading, error, refresh } = useClients();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "client" : "clients"}`}
        actions={
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-64 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2 text-sm focus:border-[var(--primary)] outline-none"
            />
            <button
              onClick={refresh}
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-light)]"
            >
              Refresh
            </button>
          </>
        }
      />
      <div className="p-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-4">
            Failed to load: {error}
          </div>
        ) : null}
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title={search ? "No matches" : "No clients yet"}
            description={
              search
                ? "Try a different name or email."
                : "Clients are created when you approve incoming applications, or when leads convert."
            }
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--primary-light)] text-[var(--text-secondary)] text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-right px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--primary-light)] transition">
                    <td className="px-4 py-3 font-semibold">{c.full_name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {c.email ?? c.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={c.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {c.risk_profile ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] text-xs">
                      {formatLongDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
