"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { lenderById } from "@/data/lenders";
import {
  fillTemplate,
  getLenderEmailTemplate,
  lenderDisplayName,
} from "@/data/lenderEmailTemplates";
import { useClient } from "@/hooks/useClients";
import { useUser } from "@/hooks/useUser";

interface FieldRow {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
}

export default function LenderApplicationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { fullName: adviserName } = useUser();

  const lenderId = sp.get("lenderId") ?? "";
  const clientId = sp.get("clientId");
  const income = sp.get("income") ?? "";
  const loanAmount = sp.get("loanAmount") ?? "";
  const propertyValue = sp.get("propertyValue") ?? "";
  const employment = sp.get("employment") ?? "";
  const creditNotes = sp.get("creditNotes") ?? "";
  const intent = sp.get("intent") ?? "";

  const lender = lenderById(lenderId);
  const template = getLenderEmailTemplate(lenderId);
  const lenderName = lenderDisplayName(lenderId);

  const { data: client } = useClient(clientId);

  // URL param fields are available immediately; client fields load async
  const [fields, setFields] = useState<FieldRow[]>([
    { key: "applicant_name", label: "Applicant name", value: "" },
    { key: "applicant_dob", label: "Date of birth", value: "" },
    { key: "applicant_email", label: "Email", value: "" },
    { key: "applicant_phone", label: "Phone", value: "" },
    { key: "applicant_address", label: "Address", value: "", multiline: true },
    { key: "employment", label: "Employment", value: employment },
    { key: "annual_income", label: "Annual income (£)", value: income },
    { key: "loan_amount", label: "Loan amount (£)", value: loanAmount },
    { key: "property_value", label: "Property value (£)", value: propertyValue },
    { key: "intent", label: "Intent", value: intent },
    { key: "credit_notes", label: "Credit notes", value: creditNotes, multiline: true },
  ]);
  const [clientSynced, setClientSynced] = useState(false);

  // Fill client personal details when they load from Supabase
  useEffect(() => {
    if (!client || clientSynced) return;
    setFields((prev) =>
      prev.map((f) => {
        switch (f.key) {
          case "applicant_name": return { ...f, value: client.full_name ?? "" };
          case "applicant_dob": return { ...f, value: client.dob ?? "" };
          case "applicant_email": return { ...f, value: client.email ?? "" };
          case "applicant_phone": return { ...f, value: client.phone ?? "" };
          case "applicant_address": return { ...f, value: client.address ?? "" };
          default: return f;
        }
      })
    );
    setClientSynced(true);
  }, [client, clientSynced]);

  const updateField = (key: string, value: string) =>
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));

  const ltv = useMemo(() => {
    const loan = Number(fields.find((f) => f.key === "loan_amount")?.value ?? 0);
    const pv = Number(fields.find((f) => f.key === "property_value")?.value ?? 0);
    if (!loan || !pv) return null;
    return Math.round((loan / pv) * 100);
  }, [fields]);

  const tokenData = useMemo(() => {
    const m: Record<string, string> = { lender_name: lenderName };
    fields.forEach((f) => (m[f.key] = f.value));
    m.ltv = ltv != null ? String(ltv) : "—";
    m.adviser_name = adviserName ?? "Your adviser";
    return m;
  }, [fields, ltv, lenderName, adviserName]);

  const subject = fillTemplate(template.subject, tokenData);
  const body = fillTemplate(template.body, tokenData);

  const sendEmail = () => {
    const mailto =
      `mailto:${encodeURIComponent(template.to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}` +
      (template.cc?.length ? `&cc=${encodeURIComponent(template.cc.join(","))}` : "");
    window.location.href = mailto;
  };

  if (!lenderId || !lender) {
    return (
      <>
        <PageHeader title="Lender Application" />
        <div className="p-8">
          <Link
            href="/lender-match"
            className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold"
          >
            ← Back to Lender Match
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Apply to ${lenderName}`}
        subtitle="Review autofilled details, then send"
        actions={
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-light)]"
          >
            ← Back
          </button>
        }
      />
      <div className="p-8 grid grid-cols-2 gap-6">
        {/* Form */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold">{lenderName}</h2>
                <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  {lender.category.replace("_", " ")} · {lender.maxLTV}% LTV ·{" "}
                  {lender.indicativeRate}%
                </div>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                To: <span className="font-mono">{template.to}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      value={f.value}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
                    />
                  ) : (
                    <input
                      value={f.value}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-900">
            ⚠ DUMMY MODE — destination is a placeholder ({template.to}). Real lender
            inboxes will be wired in a follow-up via Resend/SendGrid through a
            Supabase Edge Function.
          </div>

          <button
            onClick={sendEmail}
            className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-semibold hover:bg-[var(--primary-dark)]"
          >
            ✈ Send to {lenderName}
          </button>
        </section>

        {/* Preview */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-3">
              Email preview
            </h2>
            <div className="space-y-3">
              <PreviewRow label="To" value={template.to} mono />
              <PreviewRow label="Subject" value={subject} />
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  Body
                </div>
                <pre className="mt-1 text-sm whitespace-pre-wrap font-sans">{body}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function PreviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : "font-semibold"}`}>{value}</div>
    </div>
  );
}
