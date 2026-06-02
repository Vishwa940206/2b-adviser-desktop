"use client";

import { Building2, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { LENDERS } from "@/data/lenders";
import { useApplication } from "@/hooks/useApplications";
import { useClient, useClients } from "@/hooks/useClients";
import { useLenderSuggestion } from "@/hooks/useLenderSuggestion";
import { isOpenAIConfigured } from "@/lib/openai";

export default function LenderMatchPage() {
  const sp = useSearchParams();
  const initialClientId = sp.get("clientId");
  const initialApplicationId = sp.get("applicationId");

  const { data: clients } = useClients();
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const { data: selectedClient } = useClient(clientId);
  const { data: app } = useApplication(initialApplicationId);

  const [income, setIncome] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [propertyValue, setPropertyValue] = useState("");
  const [employment, setEmployment] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [intent, setIntent] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const suggestion = useLenderSuggestion();

  // Autofill snapshot from the linked B2B application (once)
  useEffect(() => {
    if (app && !prefilled) {
      if (app.annual_income != null) setIncome(String(app.annual_income));
      if (app.loan_amount != null) setLoanAmount(String(app.loan_amount));
      if (app.property_value != null) setPropertyValue(String(app.property_value));
      if (app.employment) setEmployment(app.employment);
      if (app.credit_notes) setCreditNotes(app.credit_notes);
      if (app.intent) setIntent(app.intent);
      if (app.client_id && !clientId) setClientId(app.client_id);
      setPrefilled(true);
    }
  }, [app, prefilled, clientId]);

  const ltv = useMemo(() => {
    const l = Number(loanAmount);
    const p = Number(propertyValue);
    if (!l || !p) return null;
    return Math.round((l / p) * 100);
  }, [loanAmount, propertyValue]);

  useEffect(() => {
    if (initialClientId && !clientId) setClientId(initialClientId);
  }, [initialClientId, clientId]);

  const onSuggest = () => {
    suggestion.run({
      client: selectedClient ?? null,
      income: income ? Number(income) : null,
      loanAmount: loanAmount ? Number(loanAmount) : null,
      propertyValue: propertyValue ? Number(propertyValue) : null,
      employment: employment || null,
      creditNotes: creditNotes || null,
      intent: intent || null,
    });
  };

  const recs = suggestion.data?.recommendations ?? [];
  const hiddenIds = new Set(recs.map((r) => r.lenderId));
  const directory = LENDERS.filter((l) => !hiddenIds.has(l.id));

  const processHref = (lenderId: string) => {
    const params = new URLSearchParams();
    params.set("lenderId", lenderId);
    if (clientId) params.set("clientId", clientId);
    if (initialApplicationId) params.set("applicationId", initialApplicationId);
    if (income) params.set("income", income);
    if (loanAmount) params.set("loanAmount", loanAmount);
    if (propertyValue) params.set("propertyValue", propertyValue);
    if (employment) params.set("employment", employment);
    if (creditNotes) params.set("creditNotes", creditNotes);
    if (intent) params.set("intent", intent);
    return `/lender-application?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Lender Match"
        subtitle="AI ranks lenders against this client's application"
      />
      <div className="p-8 grid grid-cols-3 gap-6">
        <section className="col-span-2 space-y-6">
          {/* Source banner if prefilled from application */}
          {app ? (
            <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary-light)] to-white p-4 flex items-center gap-3">
              <Sparkles size={18} className="text-[var(--primary)]" />
              <div className="flex-1 text-sm">
                Snapshot auto-filled from application{" "}
                <Link
                  href={`/applications/${app.id}`}
                  className="font-semibold text-[var(--primary-dark)] hover:underline"
                >
                  {app.applicant_full_name}
                </Link>
                . Edit anything before asking the AI.
              </div>
            </div>
          ) : null}

          {/* Snapshot form */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Application snapshot</h2>
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isOpenAIConfigured() ? "bg-emerald-500" : "bg-amber-500"}`} />
                {isOpenAIConfigured() ? "OpenAI ready" : "Heuristic mode"}
                {ltv != null ? ` · ${ltv}% LTV` : ""}
              </span>
            </div>

            <Field label="Client">
              <select
                value={clientId ?? ""}
                onChange={(e) => setClientId(e.target.value || null)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
              >
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Annual income (£)">
                <NumInput value={income} onChange={setIncome} placeholder="e.g. 65000" />
              </Field>
              <Field label="Loan amount (£)">
                <NumInput value={loanAmount} onChange={setLoanAmount} placeholder="e.g. 280000" />
              </Field>
              <Field label="Property value (£)">
                <NumInput value={propertyValue} onChange={setPropertyValue} placeholder="e.g. 350000" />
              </Field>
              <Field label="Employment">
                <input
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  placeholder="employed / self-employed"
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
                />
              </Field>
            </div>

            <Field label="Intent">
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="FTB residential, BTL, remortgage…"
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
              />
            </Field>
            <Field label="Credit notes">
              <textarea
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder="Clean, recent CCJ, discharged IVA, etc."
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
              />
            </Field>

            <button
              onClick={onSuggest}
              disabled={suggestion.loading}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-3 font-semibold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[var(--primary)]/30"
            >
              <Sparkles size={18} />
              {suggestion.loading ? "Asking AI…" : "Get AI lender suggestion"}
            </button>

            {suggestion.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {suggestion.error}
              </div>
            ) : null}
          </div>

          {/* Recommendations */}
          {suggestion.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Top recommendations</h2>
                <span className="text-xs text-[var(--text-secondary)]">
                  {suggestion.data.source === "openai" ? "AI ranked" : "KB ranked"}
                </span>
              </div>
              {suggestion.data.summary ? (
                <div className="rounded-xl bg-[var(--primary-light)] p-3 text-sm text-[var(--primary-dark)] flex items-start gap-2">
                  <Sparkles size={14} className="mt-0.5 shrink-0" />
                  <span>{suggestion.data.summary}</span>
                </div>
              ) : null}
              {recs.length === 0 ? (
                <EmptyState title="No matches" description="Adjust the snapshot and try again." />
              ) : (
                recs.map((r, i) => (
                  <div
                    key={r.lenderId}
                    className="card-hover rounded-2xl border border-[var(--border)] bg-white p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold text-sm flex items-center justify-center shadow shadow-[var(--primary)]/30">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold">{r.lender.name}</div>
                          <FitPill score={r.fitScore} />
                        </div>
                        <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                          {r.lender.category.replace("_", " ")}
                        </div>
                        <p className="text-sm mt-2">{r.reasoning}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Stat label={`${r.lender.maxLTV}% LTV`} />
                          <Stat label={`${r.lender.maxIncomeMultiple}× LTI`} />
                          <Stat label={`${r.lender.processingDays}d`} />
                          <Stat label={`${r.lender.indicativeRate}%`} />
                        </div>
                        {r.warnings.length > 0 ? (
                          <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-900">
                            {r.warnings.map((w, idx) => (
                              <div key={idx}>⚠ {w}</div>
                            ))}
                          </div>
                        ) : null}
                        <Link
                          href={processHref(r.lenderId)}
                          className="inline-flex items-center gap-2 mt-3 rounded-xl bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
                        >
                          <Send size={14} /> Process — Send to {r.lender.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </section>

        <aside>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h3 className="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-3 flex items-center gap-2">
              <Building2 size={14} /> Directory ({directory.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {directory.map((l) => (
                <Link
                  key={l.id}
                  href={processHref(l.id)}
                  className="card-hover block rounded-xl border border-[var(--border)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{l.name}</div>
                    <span className="text-xs text-[var(--text-secondary)]">{l.indicativeRate}%</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {l.category.replace("_", " ")} · {l.maxLTV}% LTV
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none"
    />
  );
}

function FitPill({ score }: { score: number }) {
  const palette =
    score >= 80
      ? { bg: "#DCFCE7", text: "#15803D" }
      : score >= 60
      ? { bg: "#FEF3C7", text: "#B45309" }
      : { bg: "#FEE2E2", text: "#B91C1C" };
  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded-full"
      style={{ background: palette.bg, color: palette.text }}
    >
      {score}% fit
    </span>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <span className="text-xs font-semibold text-[var(--primary-dark)] bg-[var(--primary-light)] px-2 py-1 rounded-md">
      {label}
    </span>
  );
}
