"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/Spinner";
import { StatusBadge } from "@/components/StatusBadge";
import {
  approveApplication,
  rejectApplication,
  signedUrlForDocument,
  useApplication,
} from "@/hooks/useApplications";
import { formatCurrencyGBP, formatLongDate, humanizeEnum } from "@/lib/format";
import type { ApplicationDocument } from "@/types/database";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, docs, loading, refresh } = useApplication(params.id ?? null);
  const [busy, setBusy] = useState(false);

  const onApprove = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const { clientId } = await approveApplication(data);
      await refresh();
      if (confirm("Approved. Create a Lender Match for this client now?")) {
        router.push(`/lender-match?clientId=${clientId}&applicationId=${data.id}`);
      }
    } catch (e) {
      alert("Couldn't approve: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!data) return;
    if (!confirm("Reject this application?")) return;
    setBusy(true);
    try {
      await rejectApplication(data.id);
      await refresh();
    } catch (e) {
      alert("Couldn't reject: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (!data) {
    return (
      <>
        <PageHeader title="Application" />
        <div className="p-8">
          <EmptyState
            title="Not found"
            description="This application may have been deleted."
            action={
              <Link
                href="/applications"
                className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold"
              >
                Back to inbox
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const fields: { label: string; value: string }[] = [
    { label: "Email", value: data.applicant_email ?? "—" },
    { label: "Phone", value: data.applicant_phone ?? "—" },
    {
      label: "Date of birth",
      value: data.applicant_dob ? formatLongDate(data.applicant_dob) : "—",
    },
    { label: "Address", value: data.applicant_address ?? "—" },
    { label: "Employment", value: humanizeEnum(data.employment) },
    { label: "Annual income", value: formatCurrencyGBP(data.annual_income) },
    { label: "Loan amount", value: formatCurrencyGBP(data.loan_amount) },
    { label: "Property value", value: formatCurrencyGBP(data.property_value) },
    { label: "Intent", value: humanizeEnum(data.intent) },
  ];

  return (
    <>
      <PageHeader
        title={data.applicant_full_name}
        subtitle={`Submitted ${formatLongDate(data.submitted_at)}`}
        actions={
          <>
            <StatusBadge value={data.status} />
            <Link
              href="/applications"
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-light)]"
            >
              Back
            </Link>
          </>
        }
      />
      <div className="p-8 grid grid-cols-3 gap-6">
        <section className="col-span-2 space-y-6">
          <Panel title="Applicant details">
            <div className="grid grid-cols-2 gap-x-6">
              {fields.map((f) => (
                <div key={f.label} className="py-2 border-b border-[var(--border)]">
                  <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                    {f.label}
                  </div>
                  <div className="text-sm font-medium mt-1">{f.value}</div>
                </div>
              ))}
            </div>
            {data.credit_notes ? (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  Credit notes
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{data.credit_notes}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title={`Documents (${docs.length})`}>
            {docs.length === 0 ? (
              <div className="text-sm text-[var(--text-secondary)]">
                No documents uploaded with this application.
              </div>
            ) : (
              <div className="space-y-2">
                {docs.map((d) => (
                  <DocumentRow key={d.id} doc={d} />
                ))}
              </div>
            )}
          </Panel>
        </section>

        <aside className="space-y-4">
          {(data.status === "submitted" || data.status === "under_review") ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
              <div className="font-bold">Review</div>
              <p className="text-sm text-[var(--text-secondary)]">
                Approving creates a client profile and routes you to Lender Match.
              </p>
              <button
                onClick={onApprove}
                disabled={busy}
                className="w-full rounded-lg bg-[var(--primary)] text-white py-2.5 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {busy ? "Working…" : "✓ Approve & create client"}
              </button>
              <button
                onClick={onReject}
                disabled={busy}
                className="w-full rounded-lg bg-red-50 text-red-700 py-2.5 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ) : data.status === "approved" ? (
            <Link
              href={`/lender-match?applicationId=${data.id}${data.client_id ? `&clientId=${data.client_id}` : ""}`}
              className="block rounded-2xl bg-[var(--primary)] text-white p-5 hover:bg-[var(--primary-dark)] transition"
            >
              <div className="font-bold">Continue to Lender Match →</div>
              <p className="text-sm text-white/85 mt-1">
                AI ranks lenders for this client and composes the submission email.
              </p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-secondary)]">
              This application was rejected on{" "}
              {data.rejected_at ? formatLongDate(data.rejected_at) : "—"}.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 className="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function DocumentRow({ doc }: { doc: ApplicationDocument }) {
  const open = async () => {
    try {
      const url = await signedUrlForDocument(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert("Couldn't open: " + (e instanceof Error ? e.message : "Unknown"));
    }
  };
  const classified = doc.ai_classified_type ? humanizeEnum(doc.ai_classified_type) : "Pending";
  return (
    <button
      onClick={open}
      className="w-full text-left flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-[var(--primary)] transition"
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] flex items-center justify-center">
        {doc.mime_type?.startsWith("image/") ? "🖼️" : "📄"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{doc.original_filename}</div>
        <div className="text-xs text-[var(--text-secondary)]">
          {classified}
          {doc.ai_confidence != null
            ? ` · ${Math.round(doc.ai_confidence * 100)}% confident`
            : ""}
        </div>
      </div>
      <span className="text-[var(--text-secondary)]">↗</span>
    </button>
  );
}
