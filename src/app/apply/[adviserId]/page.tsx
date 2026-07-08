"use client";

import { CheckSquare, FileText, Square } from "lucide-react";
import { use, useState } from "react";

import { supabase } from "@/lib/supabase";

const EMPLOYED_DOCS = [
  "Passport",
  "Proof of Address",
  "Latest 3 Months Payslips",
  "Last 3 Months Bank Statements (Salary Credited Account)",
  "Credit Files",
];

const SELF_EMPLOYED_DOCS = [
  "Passport",
  "Proof of Address",
  "Last 3 Months Bank Statements",
  "Credit Files",
  "SA302 for Last 2 Years",
  "Tax Year Overview (TYO) for Last 2 Years",
];

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 outline-none transition placeholder:text-gray-400";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5";

export default function ApplyPage({ params }: { params: Promise<{ adviserId: string }> }) {
  const { adviserId } = use(params);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    employment: "",
    address: "",
    annual_income: "",
    loan_amount: "",
    property_value: "",
    intent: "",
    credit_notes: "",
  });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { setError("Please accept the privacy notice to continue."); return; }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("b2b_applications").insert({
      adviser_id: adviserId,
      status: "submitted",
      applicant_full_name: form.full_name,
      applicant_email: form.email || null,
      applicant_phone: form.phone || null,
      applicant_dob: form.dob || null,
      applicant_address: form.address || null,
      employment: form.employment || null,
      annual_income: form.annual_income ? Number(form.annual_income) : null,
      loan_amount: form.loan_amount ? Number(form.loan_amount) : null,
      property_value: form.property_value ? Number(form.property_value) : null,
      intent: form.intent || null,
      credit_notes: form.credit_notes || null,
      raw_payload: form,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setSubmitted(true);
  };

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
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Apply for finance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your details are sent securely to your adviser. Takes ~3 minutes.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">

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
              <label className={labelCls}>Employment</label>
              <select className={inputCls} value={form.employment} onChange={(e) => set("employment", e.target.value)}>
                <option value="">Select…</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="contractor">Contractor</option>
                <option value="retired">Retired</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 High Street, London, SW1A 1AA" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Annual Income (£)</label>
              <input type="number" className={inputCls} value={form.annual_income} onChange={(e) => set("annual_income", e.target.value)} placeholder="45000" />
            </div>
            <div>
              <label className={labelCls}>Loan Amount (£)</label>
              <input type="number" className={inputCls} value={form.loan_amount} onChange={(e) => set("loan_amount", e.target.value)} placeholder="250000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Property Value (£)</label>
              <input type="number" className={inputCls} value={form.property_value} onChange={(e) => set("property_value", e.target.value)} placeholder="350000" />
            </div>
            <div>
              <label className={labelCls}>Intent</label>
              <select className={inputCls} value={form.intent} onChange={(e) => set("intent", e.target.value)}>
                <option value="">Select…</option>
                <option value="purchase">Purchase</option>
                <option value="remortgage">Remortgage</option>
                <option value="buy_to_let">Buy to Let</option>
                <option value="equity_release">Equity Release</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Credit Notes (defaults, CCJs, etc.)</label>
            <textarea className={`${inputCls} resize-none h-20`} value={form.credit_notes} onChange={(e) => set("credit_notes", e.target.value)} placeholder="Leave blank if none" />
          </div>

        </form>

        {/* Documents You'll Need */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-amber-600" />
            <h2 className="font-bold text-gray-900">Documents You&apos;ll Need to Provide</h2>
          </div>
          <p className="text-sm text-amber-700 mb-4">Please have the following ready when we begin your application:</p>
          <div className="grid grid-cols-2 gap-4">
            {[{ title: "Employed", docs: EMPLOYED_DOCS }, { title: "Self-Employed", docs: SELF_EMPLOYED_DOCS }].map(({ title, docs }) => (
              <div key={title} className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-amber-600" />
                  <span className="font-bold text-sm text-gray-800">{title}</span>
                </div>
                <ul className="space-y-1.5">
                  {docs.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Consent + Submit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <button
            type="button"
            onClick={() => setConsent((c) => !c)}
            className="flex items-start gap-3 text-left w-full"
          >
            {consent
              ? <CheckSquare size={18} className="text-blue-600 shrink-0 mt-0.5" />
              : <Square size={18} className="text-gray-400 shrink-0 mt-0.5" />
            }
            <span className="text-sm text-gray-700 leading-relaxed">
              I have read and acknowledge the Privacy Notice, and consent to my personal information
              being processed for the purpose of my enquiry.{" "}
              <span className="text-red-500">*</span>
            </span>
          </button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            onClick={onSubmit}
            disabled={busy}
            className="w-full rounded-full py-3.5 text-sm font-bold transition disabled:opacity-50"
            style={{ background: consent ? "#D4A843" : "#D4A843", color: "#fff", opacity: consent ? 1 : 0.6 }}
          >
            {busy ? "Submitting…" : "Request Consultation"}
          </button>

          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            We respect your privacy and will only use your information to respond to your enquiry.
          </p>
        </div>

      </div>
    </div>
  );
}
