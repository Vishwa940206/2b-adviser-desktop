"use client";

import { Mail } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { useApplications } from "@/hooks/useApplications";
import { useUser } from "@/hooks/useUser";
import type { B2BApplication } from "@/types/database";

const EMPLOYED_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Latest 3 Months Payslips",
  "Last 3 Months Bank Statements (salary account)",
  "Credit File (Experian / Equifax / TransUnion)",
];

const SELF_EMPLOYED_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Last 3 Months Business Bank Statements",
  "SA302 for Last 2 Years",
  "Tax Year Overview (TYO) for Last 2 Years",
  "Credit File (Experian / Equifax / TransUnion)",
];

const CONTRACTOR_DOCS = [
  "Passport or Government-issued Photo ID",
  "Proof of Address (utility bill or bank letter, last 3 months)",
  "Current Contract (and previous if within 3 months of renewal)",
  "Last 3 Months Bank Statements",
  "Credit File (Experian / Equifax / TransUnion)",
];

function getDocList(employment: string | null): string[] {
  const e = (employment ?? "").toLowerCase();
  if (e === "self_employed" || e === "self-employed") return SELF_EMPLOYED_DOCS;
  if (e === "contractor") return CONTRACTOR_DOCS;
  return EMPLOYED_DOCS;
}

function formatEmployment(e: string | null): string {
  switch ((e ?? "").toLowerCase()) {
    case "employed": return "Employed";
    case "self_employed": return "Self-Employed";
    case "contractor": return "Contractor";
    case "retired": return "Retired";
    default: return "Employed";
  }
}

export default function DocumentsPage() {
  const { data: applications, loading, error } = useApplications("all");
  const { email: adviserEmail, fullName: adviserName } = useUser();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) =>
        a.applicant_full_name.toLowerCase().includes(q) ||
        (a.applicant_email ?? "").toLowerCase().includes(q)
    );
  }, [applications, search]);

  const sentCount = useMemo(
    () => applications.filter((a) => sentIds.has(a.id)).length,
    [applications, sentIds]
  );
  const pendingCount = applications.length - sentCount;

  const sendRequest = (app: B2BApplication) => {
    const docs = getDocList(app.employment);
    const docList = docs.map((d, i) => `${i + 1}. ${d}`).join("\n");
    const subject = `Documents required — your mortgage application`;
    const body = [
      `Dear ${app.applicant_full_name},`,
      "",
      "Thank you for submitting your mortgage enquiry. To progress your application, please provide the following documents at your earliest convenience:",
      "",
      docList,
      "",
      `Please send clear scans or photos to ${adviserEmail ?? "your adviser"}.`,
      "",
      "If you have any questions, please don't hesitate to get in touch.",
      "",
      `Kind regards,`,
      adviserName ?? "Your Adviser",
    ].join("\n");

    const mailto =
      `mailto:${encodeURIComponent(app.applicant_email ?? "")}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSentIds((prev) => new Set([...prev, app.id]));
  };

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Send document checklists to clients by email"
      />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Applications" value={applications.length} color="purple" />
          <StatCard label="Requests Sent" value={sentCount} color="green" />
          <StatCard label="Awaiting Request" value={pendingCount} color="amber" />
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-72 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2 text-sm focus:border-[var(--primary)] outline-none"
          />
          {!loading && (
            <span className="text-sm text-[var(--text-secondary)]">
              {filtered.length} {filtered.length === 1 ? "client" : "clients"}
            </span>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📄"
            title={search ? "No matches" : "No applications yet"}
            description={
              search
                ? "Try a different name or email."
                : "Document requests appear here once clients submit your application form."
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const docs = getDocList(app.employment);
              const sent = sentIds.has(app.id);
              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden"
                >
                  {/* Client header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-extrabold text-sm shrink-0">
                        {app.applicant_full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--text-primary)]">
                          {app.applicant_full_name}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {app.applicant_email ?? app.applicant_phone ?? "No contact info"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 rounded-full font-medium">
                        {formatEmployment(app.employment)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          sent
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {sent ? "✓ Sent" : "Not sent"}
                      </span>
                    </div>
                  </div>

                  {/* Document checklist */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                      Documents required
                    </p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                      {docs.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-[var(--primary)] shrink-0 mt-0.5 font-bold text-xs">
                            {i + 1}.
                          </span>
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action footer */}
                  <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-4">
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {app.applicant_email
                        ? `Sends to: ${app.applicant_email}`
                        : "No email — update the application to add one"}
                    </p>
                    <button
                      onClick={() => sendRequest(app)}
                      disabled={!app.applicant_email}
                      className="flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-40 transition shrink-0"
                    >
                      <Mail size={14} />
                      {sent ? "Re-send Request" : "Send Document Request"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "green" | "amber";
}) {
  const cls =
    color === "green"
      ? "text-green-600"
      : color === "amber"
      ? "text-amber-600"
      : "text-[var(--primary)]";
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className={`text-3xl font-extrabold ${cls}`}>{value}</div>
      <div className="text-xs text-[var(--text-secondary)] font-medium mt-1">{label}</div>
    </div>
  );
}
