"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import { useApplications } from "@/hooks/useApplications";
import { useUser } from "@/hooks/useUser";
import { formatCurrencyGBP, formatRelativeTime } from "@/lib/format";
import type { ApplicationStatus } from "@/types/database";

const FILTERS: { label: string; value: ApplicationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "submitted" },
  { label: "Reviewing", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export default function ApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const { data, loading, error, refresh } = useApplications(status);
  const { id: adviserId } = useUser();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (a) =>
        a.applicant_full_name.toLowerCase().includes(q) ||
        (a.applicant_email ?? "").toLowerCase().includes(q) ||
        (a.applicant_phone ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const copySnippet = async () => {
    if (!adviserId) return;
    const url = `${SUPABASE_URL}/functions/v1/widget?adviser=${adviserId}`;
    const snippet = `<iframe src="${url}" style="width:100%;height:780px;border:0" loading="lazy"></iframe>`;
    await navigator.clipboard.writeText(snippet);
  };

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "submission" : "submissions"}`}
        actions={
          <>
            <button
              onClick={refresh}
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-light)]"
            >
              Refresh
            </button>
            <button
              onClick={copySnippet}
              disabled={!adviserId}
              className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              Copy widget snippet
            </button>
          </>
        }
      />
      <div className="p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition border ${
                  active
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white border-[var(--border)] hover:border-[var(--primary)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone…"
            className="ml-auto w-64 rounded-lg border border-[var(--border)] bg-white px-3.5 py-1.5 text-sm focus:border-[var(--primary)] outline-none"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Failed to load: {error}
          </div>
        ) : null}

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📥"
            title={search ? "No matches" : "No applications yet"}
            description={
              search
                ? "Try a different name, email, or phone."
                : "Share your widget snippet on partner websites. Submissions appear here."
            }
            action={
              !search ? (
                <button
                  onClick={copySnippet}
                  className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)]"
                >
                  Copy widget snippet
                </button>
              ) : null
            }
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--primary-light)] text-[var(--text-secondary)] text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Applicant</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-right px-4 py-3">Income</th>
                  <th className="text-right px-4 py-3">Loan</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--primary-light)] transition">
                    <td className="px-4 py-3">
                      <Link href={`/applications/${a.id}`} className="font-semibold text-[var(--text-primary)] hover:underline">
                        {a.applicant_full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {a.applicant_email ?? a.applicant_phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrencyGBP(a.annual_income)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrencyGBP(a.loan_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] text-xs">
                      {formatRelativeTime(a.submitted_at)}
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
