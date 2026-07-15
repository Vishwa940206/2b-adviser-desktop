"use client";

import { Building2, Info, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { LENDERS, type CaseType } from "@/data/lenders";
import { useApplication } from "@/hooks/useApplications";
import { useClient, useClients } from "@/hooks/useClients";
import { useLenderSuggestion } from "@/hooks/useLenderSuggestion";
import { useMortgageRates } from "@/hooks/useMortgageRates";
import { applyLiveMarketOffset } from "@/lib/liveLenderRates";

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: "residential_purchase", label: "Residential Purchase (home mover)" },
  { value: "ftb", label: "First-Time Buyer" },
  { value: "remortgage", label: "Remortgage" },
  { value: "buy_to_let", label: "Buy-to-Let" },
  { value: "limited_company_btl", label: "Buy-to-Let — Limited Company" },
  { value: "hmo", label: "HMO / Multi-Unit" },
  { value: "shared_ownership", label: "Shared Ownership" },
  { value: "right_to_buy", label: "Right to Buy" },
  { value: "equity_release", label: "Equity Release" },
  { value: "second_charge", label: "Second Charge" },
];

const PROPERTY_TYPES = [
  "Standard house (freehold)",
  "Standard flat (leasehold)",
  "New build house",
  "New build flat",
  "Ex-local authority",
  "High-rise flat (>4 storeys)",
  "HMO",
  "Agricultural / rural",
  "Listed building",
  "Studio flat",
];

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
  const [caseType, setCaseType] = useState<CaseType | "">("");
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [propertyType, setPropertyType] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const suggestion = useLenderSuggestion();

  // No free per-lender live feed exists — shift the static rate book to
  // track the live BoE-quoted market average instead.
  const { rates } = useMortgageRates();
  const liveLenders = useMemo(() => applyLiveMarketOffset(LENDERS, rates), [rates]);

  // Autofill from linked B2B application
  useEffect(() => {
    if (app && !prefilled) {
      if (app.annual_income != null) setIncome(String(app.annual_income));
      if (app.loan_amount != null) setLoanAmount(String(app.loan_amount));
      if (app.property_value != null) setPropertyValue(String(app.property_value));
      if (app.employment) setEmployment(app.employment);
      if (app.credit_notes) setCreditNotes(app.credit_notes);
      if (app.client_id && !clientId) setClientId(app.client_id);

      // Read new fields from raw_payload (stored by the updated apply form)
      const payload = (app.raw_payload ?? {}) as Record<string, unknown>;

      const ct = (payload.case_type ?? app.intent) as string | null;
      if (ct) setCaseType(ct as CaseType);
      else if (app.intent === "purchase") setCaseType("residential_purchase");
      else if (app.intent === "remortgage") setCaseType("remortgage");
      else if (app.intent === "buy_to_let") setCaseType("buy_to_let");
      else if (app.intent === "equity_release") setCaseType("equity_release");

      if (payload.is_first_time_buyer) setIsFirstTimeBuyer(true);
      if (payload.property_type) setPropertyType(String(payload.property_type));
      if (payload.intent && !payload.case_type) setIntent(String(payload.intent));

      setPrefilled(true);
    }
  }, [app, prefilled, clientId]);

  useEffect(() => {
    if (initialClientId && !clientId) setClientId(initialClientId);
  }, [initialClientId, clientId]);

  const ltv = useMemo(() => {
    const l = Number(loanAmount);
    const p = Number(propertyValue);
    if (!l || !p) return null;
    return Math.round((l / p) * 100);
  }, [loanAmount, propertyValue]);

  const lti = useMemo(() => {
    const l = Number(loanAmount);
    const i = Number(income);
    if (!l || !i) return null;
    return (l / i).toFixed(2);
  }, [loanAmount, income]);

  const onSuggest = () => {
    suggestion.run({
      client: selectedClient ?? null,
      income: income ? Number(income) : null,
      loanAmount: loanAmount ? Number(loanAmount) : null,
      propertyValue: propertyValue ? Number(propertyValue) : null,
      employment: employment || null,
      creditNotes: creditNotes || null,
      intent: intent || null,
      caseType: caseType || null,
      isFirstTimeBuyer,
      propertyType: propertyType || null,
    });
  };

  const recs = suggestion.data?.recommendations ?? [];
  const hiddenIds = new Set(recs.map((r) => r.lenderId));
  const directory = liveLenders.filter((l) => !hiddenIds.has(l.id));

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
        subtitle="AI ranks 30 UK lenders against this client's application"
      />
      <div className="p-6 grid grid-cols-3 gap-6">
        <section className="col-span-2 space-y-5">
          {/* Prefill banner */}
          {app ? (
            <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary-light)] to-white p-4 flex items-center gap-3">
              <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
              <p className="text-sm flex-1">
                Snapshot auto-filled from application{" "}
                <Link href={`/applications/${app.id}`} className="font-semibold text-[var(--primary-dark)] hover:underline">
                  {app.applicant_full_name}
                </Link>
                . Review and adjust before running the match.
              </p>
            </div>
          ) : null}

          {/* Snapshot form */}
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--text-primary)]">Application snapshot</h2>
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                {ltv != null && (
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                    ltv > 90 ? "bg-red-100 text-red-700" :
                    ltv > 80 ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {ltv}% LTV
                  </span>
                )}
                {lti && (
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                    Number(lti) > 5 ? "bg-red-100 text-red-700" :
                    Number(lti) > 4.5 ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {lti}× LTI
                  </span>
                )}
              </div>
            </div>

            {/* Client */}
            <Field label="Client">
              <select
                value={clientId ?? ""}
                onChange={(e) => setClientId(e.target.value || null)}
                className={selectCls}
              >
                <option value="">— Select client (optional) —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </Field>

            {/* Case type + FTB */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Case type *">
                <select
                  value={caseType}
                  onChange={(e) => {
                    setCaseType(e.target.value as CaseType | "");
                    if (e.target.value === "ftb") setIsFirstTimeBuyer(true);
                    else if (e.target.value !== "ftb") setIsFirstTimeBuyer(false);
                  }}
                  className={selectCls}
                >
                  <option value="">— Select case type —</option>
                  {CASE_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Property type">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— Select (optional) —</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Financial snapshot */}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Annual income (£)">
                <NumInput value={income} onChange={setIncome} placeholder="65,000" />
              </Field>
              <Field label="Loan amount (£)">
                <NumInput value={loanAmount} onChange={setLoanAmount} placeholder="280,000" />
              </Field>
              <Field label="Property value (£)">
                <NumInput value={propertyValue} onChange={setPropertyValue} placeholder="350,000" />
              </Field>
            </div>

            {/* Employment + FTB toggle */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employment type">
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— Select —</option>
                  <option value="employed">Employed (PAYE)</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="contractor">Day-Rate Contractor</option>
                  <option value="company_director">Company Director</option>
                  <option value="retired">Retired</option>
                </select>
              </Field>
              <Field label="First-time buyer?">
                <button
                  type="button"
                  onClick={() => setIsFirstTimeBuyer((v) => !v)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-left transition ${
                    isFirstTimeBuyer
                      ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                      : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                  }`}
                >
                  {isFirstTimeBuyer ? "✓ Yes — first-time buyer" : "No — existing owner / investor"}
                </button>
              </Field>
            </div>

            <Field label="Credit / adverse history">
              <textarea
                value={creditNotes}
                onChange={(e) => setCreditNotes(e.target.value)}
                placeholder="Clean — no adverse. Or: satisfied CCJ £800 (2023), no missed payments since..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label="Additional notes for AI">
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g. Needs quick completion, prefers fixed 5yr, has bonus income..."
                className={inputCls}
              />
            </Field>

            <button
              onClick={onSuggest}
              disabled={suggestion.loading || !caseType}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-3.5 font-bold hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[var(--primary)]/30 transition"
            >
              <Sparkles size={18} />
              {suggestion.loading ? "Analysing 30 lenders…" : "Get AI Lender Match"}
            </button>

            {!caseType && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <Info size={12} /> Select a case type above to enable matching.
              </p>
            )}

            {suggestion.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {suggestion.error}
              </div>
            ) : null}
          </div>

          {/* Results */}
          {suggestion.data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[var(--text-primary)]">Top recommendations</h2>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {suggestion.data.liveRates && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      suggestion.data.liveRates.isLive
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${suggestion.data.liveRates.isLive ? "bg-green-500" : "bg-gray-400"}`} />
                      BoE base {suggestion.data.liveRates.baseRate}% · 2yr ~{suggestion.data.liveRates.twoYearFixed}% · 5yr ~{suggestion.data.liveRates.fiveYearFixed}%
                      {suggestion.data.liveRates.isLive ? " (live)" : " (fallback)"}
                    </span>
                  )}
                  {suggestion.data.aiError && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                      AI unavailable — heuristic used
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] border border-[var(--border)] px-2 py-1 rounded-full">
                    {suggestion.data.source === "openai" ? "✦ GPT-4o ranked" : "KB ranked"}
                  </span>
                </div>
              </div>

              {suggestion.data.summary ? (
                <div className="rounded-xl bg-gradient-to-r from-[var(--primary-light)] to-white border border-[var(--primary)]/20 p-4 text-sm text-[var(--text-primary)] flex items-start gap-2.5">
                  <Sparkles size={14} className="text-[var(--primary)] mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{suggestion.data.summary}</span>
                </div>
              ) : null}

              {recs.length === 0 ? (
                <EmptyState title="No matches" description="Adjust the snapshot and try again." />
              ) : (
                recs.map((r, i) => (
                  <div key={r.lenderId} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white font-extrabold text-sm flex items-center justify-center shadow shadow-[var(--primary)]/30 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{r.lender.name}</div>
                            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
                              {r.lender.category.replace("_", " ")}
                            </div>
                          </div>
                          <FitPill score={r.fitScore} />
                        </div>

                        <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">{r.reasoning}</p>

                        {/* Rate + stats */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <RateBadge label={r.indicativeRate} />
                          <Stat label={`${r.lender.maxLTV}% max LTV`} />
                          <Stat label={`${r.lender.maxIncomeMultiple}× LTI`} />
                          <Stat label={`${r.lender.processingDays}d processing`} />
                          <Stat label={`Up to £${(r.lender.maxLoanSize / 1000000).toFixed(1)}m`} />
                        </div>

                        {r.warnings.length > 0 ? (
                          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                            {r.warnings.map((w, idx) => (
                              <div key={idx} className="flex items-start gap-1.5">
                                <span className="shrink-0">⚠</span> {w}
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 pt-3 border-t border-[var(--border)]">
                          <p className="text-xs text-[var(--text-muted)] mb-2">
                            {r.lender.specialties.slice(0, 2).join(" · ")}
                          </p>
                          <Link
                            href={processHref(r.lenderId)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)] transition"
                          >
                            <Send size={13} /> Process — Send to {r.lender.name}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Info size={11} />
                {rates.isLive
                  ? "Per-lender spreads are indicative; overall levels track the live BoE-quoted market."
                  : "Rates are indicative — live market unavailable."}
                {" "}Always verify on your sourcing system (Trigold / Twenty7Tec / Iress) before quoting clients.
              </p>
            </div>
          ) : null}
        </section>

        {/* Directory sidebar */}
        <aside>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Building2 size={13} /> All Lenders ({directory.length})
            </h3>
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {directory.map((l) => (
                <Link
                  key={l.id}
                  href={processHref(l.id)}
                  className="block rounded-xl border border-[var(--border)] p-3 hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{l.name}</div>
                    <span className="text-xs text-green-700 font-bold shrink-0 ml-2">{l.rate5yr}%</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {l.category.replace(/_/g, " ")} · {l.maxLTV}% LTV
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--primary)] outline-none transition";
const selectCls = inputCls;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  );
}

function FitPill({ score }: { score: number }) {
  const { bg, text } =
    score >= 80 ? { bg: "#DCFCE7", text: "#15803D" } :
    score >= 60 ? { bg: "#FEF3C7", text: "#B45309" } :
                  { bg: "#FEE2E2", text: "#B91C1C" };
  return (
    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0" style={{ background: bg, color: text }}>
      {score}% fit
    </span>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <span className="text-xs font-semibold text-[var(--primary-dark)] bg-[var(--primary-light)] px-2.5 py-1 rounded-md">
      {label}
    </span>
  );
}

function RateBadge({ label }: { label: string }) {
  return (
    <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-md">
      {label}
    </span>
  );
}
