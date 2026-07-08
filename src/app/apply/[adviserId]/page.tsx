"use client";

import { CheckSquare, FileText, Square } from "lucide-react";
import { use, useState } from "react";

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

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white outline-none transition placeholder:text-gray-400";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5";

const CASE_TYPES = [
  { value: "ftb", label: "I'm buying my first home" },
  { value: "residential_purchase", label: "I'm buying a home (have owned before)" },
  { value: "remortgage", label: "I want to remortgage my current home" },
  { value: "buy_to_let", label: "I'm buying a property to rent out" },
  { value: "limited_company_btl", label: "Buying to let via a limited company" },
  { value: "shared_ownership", label: "Shared ownership purchase" },
  { value: "right_to_buy", label: "Right to Buy" },
  { value: "equity_release", label: "Equity release / lifetime mortgage" },
];

const PROPERTY_TYPES = [
  { value: "house_freehold", label: "House (freehold)" },
  { value: "flat_leasehold", label: "Flat / apartment (leasehold)" },
  { value: "new_build_house", label: "New build house" },
  { value: "new_build_flat", label: "New build flat" },
  { value: "ex_local_authority", label: "Ex-local authority / council property" },
  { value: "bungalow", label: "Bungalow" },
  { value: "hmo", label: "HMO / house in multiple occupation" },
  { value: "maisonette", label: "Maisonette" },
  { value: "studio", label: "Studio flat" },
  { value: "other", label: "Other / unsure" },
];

export default function ApplyPage({ params }: { params: Promise<{ adviserId: string }> }) {
  const { adviserId } = use(params);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    employment: "",
    case_type: "",
    is_first_time_buyer: false,
    property_type: "",
    address: "",
    annual_income: "",
    loan_amount: "",
    property_value: "",
    credit_notes: "",
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setError("Please accept the privacy notice to continue."); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adviser_id: adviserId,
          ...form,
          // Map case_type → intent for the existing DB column
          intent: form.case_type,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) { setError(json.error ?? "Submission failed."); setBusy(false); return; }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  };

  const isBTL = form.case_type.includes("btl");
  const docList = (form.employment === "self_employed") ? SELF_EMPLOYED_DOCS : EMPLOYED_DOCS;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request received!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Thank you — your adviser will review your enquiry and be in touch shortly to arrange a consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Apply for finance</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your details are sent securely to your adviser. Takes ~3 minutes.
            </p>
          </div>

          {/* ── Section 1: Personal ── */}
          <div className="px-6 pt-5 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Your details</p>
          </div>
          <div className="px-6 pb-5 space-y-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input required className={inputCls} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@email.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+44 7700 900000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" className={inputCls} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Employment Status</label>
                <select className={inputCls} value={form.employment} onChange={(e) => set("employment", e.target.value)}>
                  <option value="">Select…</option>
                  <option value="employed">Employed (PAYE)</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="contractor">Day-Rate Contractor</option>
                  <option value="company_director">Company Director</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 High Street, London, SW1A 1AA" />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Section 2: Mortgage details ── */}
          <div className="px-6 pt-5 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Mortgage details</p>
          </div>
          <div className="px-6 pb-5 space-y-4">
            <div>
              <label className={labelCls}>What type of mortgage are you looking for? *</label>
              <select
                required
                className={inputCls}
                value={form.case_type}
                onChange={(e) => {
                  const v = e.target.value;
                  set("case_type", v);
                  set("is_first_time_buyer", v === "ftb");
                }}
              >
                <option value="">Select…</option>
                {CASE_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>

            {/* FTB toggle — only show for residential purchase */}
            {(form.case_type === "residential_purchase" || form.case_type === "") && (
              <div>
                <label className={labelCls}>Are you a first-time buyer?</label>
                <div className="flex gap-2">
                  {[{ label: "Yes", value: true }, { label: "No", value: false }].map(({ label, value }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => set("is_first_time_buyer", value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                        form.is_first_time_buyer === value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Property type</label>
              <select className={inputCls} value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>
                <option value="">Select…</option>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Annual Income (£)</label>
                <input type="number" className={inputCls} value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} placeholder="45,000" />
              </div>
              <div>
                <label className={labelCls}>{isBTL ? "Loan Amount (£)" : "Loan Amount (£)"}</label>
                <input type="number" className={inputCls} value={form.loan_amount} onChange={(e) => set("loan_amount", e.target.value)} placeholder="250,000" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Property Value (£)</label>
              <input type="number" className={inputCls} value={form.property_value} onChange={(e) => set("property_value", e.target.value)} placeholder="350,000" />
            </div>

            <div>
              <label className={labelCls}>Credit history — any CCJs, defaults, missed payments?</label>
              <textarea
                className={`${inputCls} resize-none h-20`}
                value={form.credit_notes}
                onChange={(e) => set("credit_notes", e.target.value)}
                placeholder="Leave blank if clean. Otherwise describe: e.g. one missed payment 2022, satisfied CCJ £500 (2021)…"
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Documents ── */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={15} className="text-amber-600" />
              <h2 className="font-bold text-sm text-gray-900">Documents You&apos;ll Need to Provide</h2>
            </div>
            <p className="text-xs text-amber-700 mb-4">Please have the following ready when we begin your application:</p>
            <ul className="space-y-2">
              {docList.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Consent + Submit ── */}
          <div className="px-6 py-5 space-y-4">
            <button
              type="button"
              onClick={() => setConsent((c) => !c)}
              className="flex items-start gap-3 text-left w-full"
            >
              {consent
                ? <CheckSquare size={18} className="text-blue-600 shrink-0 mt-0.5" />
                : <Square size={18} className="text-gray-300 shrink-0 mt-0.5" />
              }
              <span className="text-sm text-gray-600 leading-relaxed">
                I have read and acknowledge the Privacy Notice, and consent to my personal information
                being processed for the purpose of my mortgage enquiry.{" "}
                <span className="text-red-500">*</span>
              </span>
            </button>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full py-3.5 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ background: "#D4A843", opacity: consent ? 1 : 0.55 }}
            >
              {busy ? "Submitting…" : "Request Consultation"}
            </button>

            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              We respect your privacy and will only use your information to respond to your enquiry.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
