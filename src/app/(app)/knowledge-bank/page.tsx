"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitCompare,
  Lightbulb,
  MessageSquare,
  Search,
  Sparkles,
  Table2,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { LENDERS, type CaseType, type Lender } from "@/data/lenders";
import { getLenderMeta, getLogoSources } from "@/data/lenderMeta";
import { useMortgageRates } from "@/hooks/useMortgageRates";
import { applyLiveMarketOffset } from "@/lib/liveLenderRates";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MatchedLender {
  lender: Lender;
  relevance: "high" | "medium" | "low";
  matchReason: string;
  fitScore: number;
  warnings: string[];
}

interface KBResult {
  answer: string;
  matchedLenders: MatchedLender[];
  keyPoints: string[];
  followUpSuggestions: string[];
  source: "ai" | "keyword";
  liveRates?: { isLive: boolean; asOf: string } | null;
  error?: string;
}

interface ChatEntry {
  query: string;
  result: KBResult;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_PILL: Record<string, string> = {
  high_street:       "bg-blue-100 text-blue-700",
  building_society:  "bg-emerald-100 text-emerald-700",
  challenger:        "bg-violet-100 text-violet-700",
  specialist:        "bg-amber-100 text-amber-700",
  intermediary_only: "bg-rose-100 text-rose-700",
};

const RELEVANCE_PILL: Record<string, string> = {
  high:   "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-gray-100 text-gray-500",
};

const CREDIT_PILL: Record<string, string> = {
  thin:      "bg-red-100 text-red-700",
  fair:      "bg-orange-100 text-orange-700",
  good:      "bg-blue-100 text-blue-700",
  excellent: "bg-emerald-100 text-emerald-700",
};

function humanize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmt(n: number) { return `£${n.toLocaleString("en-GB")}`; }

const QUICK_SEARCHES = [
  "Which lenders accept contractors?",
  "FTB with 5% deposit, clean credit",
  "Self-employed, 1 year accounts",
  "Satisfied CCJ under £500",
  "HMO up to £1.5m loan",
  "Limited company BTL",
  "Discharged bankruptcy 2 years",
  "Equity release products",
  "Joint borrower sole proprietor",
  "New build flat, 85% LTV",
];

const CASE_TYPES: { value: CaseType | ""; label: string }[] = [
  { value: "", label: "All case types" },
  { value: "residential_purchase", label: "Residential purchase" },
  { value: "ftb", label: "First-time buyer" },
  { value: "remortgage", label: "Remortgage" },
  { value: "buy_to_let", label: "Buy to let" },
  { value: "limited_company_btl", label: "Ltd Co BTL" },
  { value: "hmo", label: "HMO" },
  { value: "shared_ownership", label: "Shared ownership" },
  { value: "right_to_buy", label: "Right to buy" },
  { value: "equity_release", label: "Equity release" },
  { value: "second_charge", label: "Second charge" },
];

// ── Lender Logo ────────────────────────────────────────────────────────────────

function LenderLogo({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  const meta = getLenderMeta(id);
  const sources = getLogoSources(meta.logoDomain);
  const [srcIdx, setSrcIdx] = useState(0);

  const initials = (
    <div
      className="rounded-lg flex items-center justify-center text-white font-black shrink-0 select-none"
      style={{ width: size, height: size, fontSize: Math.max(size * 0.3, 10), background: meta.brandColor }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );

  if (!sources.length || srcIdx >= sources.length) return initials;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[srcIdx]}
      alt={name}
      width={size}
      height={size}
      onError={() => setSrcIdx((i) => i + 1)}
      className="rounded-lg object-contain bg-white shrink-0"
      style={{ width: size, height: size, padding: size > 28 ? 3 : 1, border: "1px solid #e5e7eb" }}
    />
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Lender Detail Drawer ───────────────────────────────────────────────────────

function LenderDrawer({ lender, onClose }: { lender: Lender; onClose: () => void }) {
  const meta = getLenderMeta(lender.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white z-50 overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[var(--border)] px-6 py-4 flex items-center gap-4">
          <LenderLogo id={lender.id} name={lender.name} size={48} />
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-xl text-[var(--text-primary)] truncate">{lender.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_PILL[lender.category]}`}>
                {humanize(lender.category)}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CREDIT_PILL[lender.minCredit]}`}>
                Min credit: {humanize(lender.minCredit)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">

          {/* Rate cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "2yr Fixed", value: `${lender.rate2yr}%`, highlight: true },
              { label: "5yr Fixed", value: `${lender.rate5yr}%`, highlight: false },
              { label: "Indicative", value: `${lender.indicativeRate}%`, highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`rounded-2xl p-4 border text-center ${highlight ? "border-[var(--primary)]/30 bg-[var(--primary-light)]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1">{label}</div>
                <div className={`text-2xl font-extrabold ${highlight ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Key metrics */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Key criteria</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Maximum LTV", value: `${lender.maxLTV}%` },
                { label: "Max income multiple", value: `${lender.maxIncomeMultiple}×` },
                { label: "Minimum income", value: fmt(lender.minIncome) },
                { label: "Maximum loan", value: fmt(lender.maxLoanSize) },
                { label: "Processing time", value: `${lender.processingDays} working days` },
                { label: "Min credit profile", value: humanize(lender.minCredit) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
                  <div className="text-sm font-bold text-[var(--text-primary)] mt-1">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Employment */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Employment accepted</h3>
            <div className="flex flex-wrap gap-2">
              {lender.employment.map((e) => (
                <span key={e} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {humanize(e)}
                </span>
              ))}
            </div>
          </div>

          {/* Case types */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Case types</h3>
            <div className="flex flex-wrap gap-2">
              {lender.caseTypes.map((c) => (
                <span key={c} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {humanize(c)}
                </span>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Specialties & strengths</h3>
            <ul className="space-y-2">
              {lender.specialties.map((s) => (
                <li key={s} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          {lender.exclusions.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Exclusions & watch points</h3>
              <ul className="space-y-2">
                {lender.exclusions.map((e) => (
                  <li key={e} className="flex items-start gap-2.5 text-sm text-red-600">
                    <XCircle size={15} className="shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {lender.notes && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-amber-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Adviser notes</span>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">{lender.notes}</p>
            </div>
          )}

          {/* Website link */}
          {meta.website && (
            <a
              href={`https://${meta.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
            >
              {meta.website} ↗
            </a>
          )}
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 border-t border-[var(--border)] bg-white p-4">
          <Link
            href={`/lender-match?lenderId=${lender.id}`}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-white py-3 text-sm font-bold hover:bg-[var(--primary-dark)] transition"
          >
            <Sparkles size={14} />
            Use in Lender Match
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Compact result lender card ─────────────────────────────────────────────────

function ResultLenderCard({
  ml,
  onOpen,
  selected,
  onToggleCompare,
  compareMode,
}: {
  ml: MatchedLender;
  onOpen: () => void;
  selected: boolean;
  onToggleCompare: () => void;
  compareMode: boolean;
}) {
  const { lender, relevance, matchReason, fitScore, warnings } = ml;

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-all cursor-pointer ${
        selected ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-[var(--border)] hover:border-[var(--primary)]/50"
      }`}
      onClick={onOpen}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <LenderLogo id={lender.id} name={lender.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[var(--text-primary)]">{lender.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RELEVANCE_PILL[relevance]}`}>
              {relevance} match
            </span>
          </div>
          <p className="text-xs text-[var(--primary)] mt-0.5 leading-relaxed font-medium">{matchReason}</p>
          <ScoreBar score={fitScore} />
          {warnings.length > 0 && (
            <p className="text-[11px] text-amber-600 mt-1">⚠ {warnings[0]}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[11px] text-[var(--text-secondary)]">
            <span>2yr <strong className="text-[var(--text-primary)]">{lender.rate2yr}%</strong></span>
            <span>5yr <strong className="text-[var(--text-primary)]">{lender.rate5yr}%</strong></span>
            <span>Max LTV <strong className="text-[var(--text-primary)]">{lender.maxLTV}%</strong></span>
            <span>Up to <strong className="text-[var(--text-primary)]">{lender.maxIncomeMultiple}×</strong></span>
          </div>
        </div>
        {compareMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(); }}
            className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
              selected ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
            }`}
          >
            {selected ? "✓" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Directory lender card ──────────────────────────────────────────────────────

function DirLenderCard({ lender, onOpen }: { lender: Lender; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden hover:border-[var(--primary)]/40 transition-colors">
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer"
        onClick={onOpen}
      >
        <LenderLogo id={lender.id} name={lender.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-[var(--text-primary)]">{lender.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_PILL[lender.category]}`}>
              {humanize(lender.category)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CREDIT_PILL[lender.minCredit]}`}>
              {humanize(lender.minCredit)} credit
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-[var(--text-secondary)]">
            <span>Max LTV <strong className="text-[var(--text-primary)]">{lender.maxLTV}%</strong></span>
            <span>Up to <strong className="text-[var(--text-primary)]">{lender.maxIncomeMultiple}×</strong> LTI</span>
            <span>2yr <strong className="text-[var(--text-primary)]">{lender.rate2yr}%</strong></span>
            <span>5yr <strong className="text-[var(--text-primary)]">{lender.rate5yr}%</strong></span>
            <span>Max <strong className="text-[var(--text-primary)]">{fmt(lender.maxLoanSize)}</strong></span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {lender.caseTypes.slice(0, 4).map((c) => (
              <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">{humanize(c)}</span>
            ))}
            {lender.caseTypes.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">+{lender.caseTypes.length - 4}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] transition"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-[var(--border)] space-y-3">
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Specialties</div>
            <ul className="space-y-1">
              {lender.specialties.map((s) => (
                <li key={s} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                  <span className="text-emerald-500 shrink-0">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          {lender.exclusions.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">Watch points</div>
              <ul className="space-y-1">
                {lender.exclusions.map((e) => (
                  <li key={e} className="text-xs text-red-600 flex items-start gap-1.5">
                    <span className="shrink-0">✕</span> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lender.notes && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-800">{lender.notes}</div>
          )}
          <button
            onClick={onOpen}
            className="mt-1 text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Full details <ArrowRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Compare panel ──────────────────────────────────────────────────────────────

function ComparePanel({ lenders, onClose }: { lenders: Lender[]; onClose: () => void }) {
  if (lenders.length < 2) return null;

  const rows: { label: string; get: (l: Lender) => string }[] = [
    { label: "2yr Fixed", get: (l) => `${l.rate2yr}%` },
    { label: "5yr Fixed", get: (l) => `${l.rate5yr}%` },
    { label: "Indicative rate", get: (l) => `${l.indicativeRate}%` },
    { label: "Max LTV", get: (l) => `${l.maxLTV}%` },
    { label: "Max income multiple", get: (l) => `${l.maxIncomeMultiple}×` },
    { label: "Min income", get: (l) => fmt(l.minIncome) },
    { label: "Max loan", get: (l) => fmt(l.maxLoanSize) },
    { label: "Processing days", get: (l) => `${l.processingDays}d` },
    { label: "Min credit", get: (l) => humanize(l.minCredit) },
    { label: "Employment", get: (l) => l.employment.map(humanize).join(", ") },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-extrabold text-lg text-[var(--text-primary)]">Lender comparison</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] w-40">Criteria</th>
                {lenders.map((l) => (
                  <th key={l.id} className="px-5 py-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <LenderLogo id={l.id} name={l.name} size={36} />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{l.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-[var(--bg)]" : "bg-white"}>
                  <td className="px-5 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">{row.label}</td>
                  {lenders.map((l) => (
                    <td key={l.id} className="px-5 py-3 text-center text-sm font-semibold text-[var(--text-primary)]">
                      {row.get(l)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Specialties</td>
                {lenders.map((l) => (
                  <td key={l.id} className="px-5 py-3 text-center align-top">
                    <ul className="space-y-1 text-left">
                      {l.specialties.slice(0, 3).map((s) => (
                        <li key={s} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1">
                          <span className="text-emerald-500 shrink-0">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = "search" | "directory" | "rates";

export default function KnowledgeBankPage() {
  const [tab, setTab] = useState<Tab>("search");

  // Live rate tracking — no free per-lender feed exists, so we shift the
  // static rate book to track the live BoE-quoted market average instead.
  const { rates, loading: ratesLoading } = useMortgageRates();
  const liveLenders = useMemo(() => applyLiveMarketOffset(LENDERS, rates), [rates]);

  // Chat
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  // Drawer
  const [drawerLender, setDrawerLender] = useState<Lender | null>(null);

  // Directory filters
  const [filterCase, setFilterCase] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [dirSearch, setDirSearch] = useState("");

  // Rate sort
  const [rateSort, setRateSort] = useState<"rate2yr" | "rate5yr" | "maxLTV" | "maxIncomeMultiple">("rate2yr");

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError(null);
    setTab("search");

    const prev = history.slice(-3).map((h) => ({ q: h.query, a: h.result.answer }));

    try {
      const res = await fetch("/api/knowledge-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, history: prev }),
      });
      const data = await res.json() as KBResult;
      if (!res.ok || data.error) throw new Error(data.error ?? "Search failed");
      setHistory((h) => [...h, { query: q, result: data }]);
      setQuery("");
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); runSearch(query); };
  const quickSearch = (q: string) => { setQuery(q); runSearch(q); };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const compareLenders = liveLenders.filter((l) => compareIds.has(l.id));

  // Filtered directory
  const filteredLenders = liveLenders.filter((l) => {
    if (filterCase && !l.caseTypes.includes(filterCase as CaseType)) return false;
    if (filterEmp && !l.employment.includes(filterEmp as Lender["employment"][number])) return false;
    if (filterCat && l.category !== filterCat) return false;
    if (dirSearch) {
      const s = dirSearch.toLowerCase();
      if (!l.name.toLowerCase().includes(s) && !l.specialties.some((sp) => sp.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const sortedLenders = [...liveLenders].sort((a, b) =>
    rateSort === "maxLTV" || rateSort === "maxIncomeMultiple" ? b[rateSort] - a[rateSort] : a[rateSort] - b[rateSort]
  );

  return (
    <>
      <PageHeader
        title="Knowledge Bank"
        subtitle={`AI-powered criteria search across ${LENDERS.length} UK lenders`}
      />

      {drawerLender && <LenderDrawer lender={drawerLender} onClose={() => setDrawerLender(null)} />}
      {showCompare && <ComparePanel lenders={compareLenders} onClose={() => setShowCompare(false)} />}

      <div className="p-6 space-y-5">

        {/* Tabs + Compare toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
            {([
              { id: "search" as Tab, label: "AI Search", icon: MessageSquare },
              { id: "directory" as Tab, label: "All Lenders", icon: BookOpen },
              { id: "rates" as Tab, label: "Rate Table", icon: Table2 },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === id
                    ? "bg-white text-[var(--primary)] shadow-sm border border-[var(--border)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Compare mode button */}
          <button
            onClick={() => { setCompareMode((m) => !m); if (compareMode) setCompareIds(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition ${
              compareMode
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
            }`}
          >
            <GitCompare size={14} />
            Compare{compareMode && compareIds.size > 0 ? ` (${compareIds.size})` : ""}
          </button>

          {compareMode && compareIds.size >= 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 transition"
            >
              View comparison →
            </button>
          )}
        </div>

        {/* ── AI SEARCH TAB ── */}
        {tab === "search" && (
          <div className="space-y-4">

            {/* Quick searches (only show when empty) */}
            {history.length === 0 && !searching && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SEARCHES.map((q) => (
                    <button
                      key={q}
                      onClick={() => quickSearch(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat history */}
            {history.length > 0 && (
              <div className="space-y-6">
                {history.map((entry, idx) => (
                  <div key={idx} className="space-y-3">
                    {/* User bubble */}
                    <div className="flex justify-end">
                      <div className="bg-[var(--primary)] text-white text-sm font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-lg">
                        {entry.query}
                      </div>
                    </div>

                    {/* AI answer */}
                    <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary-light)] p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={13} className="text-[var(--primary)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">
                          {entry.result.source === "ai" ? "AI · GPT-4o" : "Keyword match"}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">{entry.result.answer}</p>

                      {entry.result.keyPoints.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-[var(--primary)]/10">
                          {entry.result.keyPoints.map((pt) => (
                            <div key={pt} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                              <Lightbulb size={11} className="text-amber-500 shrink-0 mt-0.5" />
                              {pt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Matched lenders */}
                    {entry.result.matchedLenders.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                        {entry.result.matchedLenders.map((ml) => (
                          <ResultLenderCard
                            key={ml.lender.id}
                            ml={ml}
                            onOpen={() => setDrawerLender(ml.lender)}
                            selected={compareIds.has(ml.lender.id)}
                            onToggleCompare={() => toggleCompare(ml.lender.id)}
                            compareMode={compareMode}
                          />
                        ))}
                      </div>
                    )}

                    {/* Follow-up suggestions */}
                    {entry.result.followUpSuggestions.length > 0 && idx === history.length - 1 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {entry.result.followUpSuggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => quickSearch(s)}
                            className="text-xs px-3 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition font-medium"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Searching skeleton */}
            {searching && (
              <div className="space-y-3 animate-pulse">
                <div className="h-5 w-64 bg-[var(--bg)] rounded-full ml-auto" />
                <div className="h-28 rounded-2xl bg-[var(--primary-light)]/50" />
                <div className="h-20 rounded-2xl bg-[var(--bg)]" />
                <div className="h-20 rounded-2xl bg-[var(--bg)]" />
              </div>
            )}

            {searchError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{searchError}</div>
            )}

            {/* Input bar (sticky at bottom) */}
            <div className={`${history.length > 0 ? "sticky bottom-4" : ""}`}>
              <form onSubmit={onSubmit} className="relative bg-white rounded-2xl border border-[var(--border)] shadow-lg overflow-hidden">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="absolute top-3 right-28 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition px-2"
                  >
                    Clear chat
                  </button>
                )}
                <div className="flex items-center gap-2 p-2">
                  <Search size={15} className="text-[var(--text-muted)] ml-2 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={history.length > 0 ? "Ask a follow-up question…" : 'Ask anything — e.g. "Which lenders accept contractors with a CCJ?"'}
                    className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="submit"
                    disabled={searching || !query.trim()}
                    className="rounded-xl bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-bold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition shrink-0"
                  >
                    {searching ? "…" : "Ask"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DIRECTORY TAB ── */}
        {tab === "directory" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  placeholder="Search lenders…"
                  className="pl-8 pr-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-white focus:border-[var(--primary)] outline-none w-44"
                />
              </div>
              <select value={filterCase} onChange={(e) => setFilterCase(e.target.value)} className="text-sm rounded-xl border border-[var(--border)] bg-white px-3 py-2 focus:border-[var(--primary)] outline-none">
                {CASE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="text-sm rounded-xl border border-[var(--border)] bg-white px-3 py-2 focus:border-[var(--primary)] outline-none">
                <option value="">Any employment</option>
                <option value="employed">Employed (PAYE)</option>
                <option value="self_employed">Self-employed</option>
                <option value="contractor">Contractor</option>
                <option value="retired">Retired</option>
                <option value="company_director">Company director</option>
              </select>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm rounded-xl border border-[var(--border)] bg-white px-3 py-2 focus:border-[var(--primary)] outline-none">
                <option value="">All categories</option>
                <option value="high_street">High street</option>
                <option value="building_society">Building society</option>
                <option value="challenger">Challenger bank</option>
                <option value="specialist">Specialist</option>
                <option value="intermediary_only">Intermediary only</option>
              </select>
              {(filterCase || filterEmp || filterCat || dirSearch) && (
                <button onClick={() => { setFilterCase(""); setFilterEmp(""); setFilterCat(""); setDirSearch(""); }} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] bg-white">
                  <X size={12} /> Clear
                </button>
              )}
              <span className="text-xs text-[var(--text-muted)] ml-auto font-medium">{filteredLenders.length} / {LENDERS.length} lenders</span>
            </div>

            {filteredLenders.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-secondary)]">
                <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No lenders match your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLenders.map((l) => (
                  <DirLenderCard key={l.id} lender={l} onOpen={() => setDrawerLender(l)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RATE TABLE TAB ── */}
        {tab === "rates" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-[var(--text-secondary)] font-medium">Sort by:</span>
                {[
                { key: "rate2yr" as const, label: "2yr Fixed ↑" },
                { key: "rate5yr" as const, label: "5yr Fixed ↑" },
                { key: "maxLTV" as const, label: "Max LTV ↓" },
                { key: "maxIncomeMultiple" as const, label: "Max LTI ↓" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRateSort(key)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition border ${
                    rateSort === key
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
                ratesLoading ? "bg-gray-100 text-gray-500 border border-gray-200"
                : rates.isLive ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${rates.isLive && !ratesLoading ? "bg-green-500" : "bg-gray-400"}`} />
                {ratesLoading
                  ? "Checking live market rate…"
                  : rates.isLive
                  ? `Tracking live BoE-quoted market · ${rates.asOf}`
                  : "Indicative only — live market unavailable"}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                      {["Lender", "Category", "2yr Fixed", "5yr Fixed", "Max LTV", "Max LTI", "Max Loan", "Days", "Min Credit"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLenders.map((l, i) => {
                      const isBest = i === 0 && (rateSort === "rate2yr" || rateSort === "rate5yr");
                      return (
                        <tr
                          key={l.id}
                          className={`border-b border-[var(--border)] hover:bg-[var(--primary-light)] transition-colors cursor-pointer ${isBest ? "bg-emerald-50" : ""}`}
                          onClick={() => setDrawerLender(l)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <LenderLogo id={l.id} name={l.name} size={28} />
                              <div>
                                <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                                  {isBest && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase">Best</span>}
                                  {l.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_PILL[l.category]}`}>
                              {humanize(l.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{l.rate2yr}%</td>
                          <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{l.rate5yr}%</td>
                          <td className="px-4 py-3">{l.maxLTV}%</td>
                          <td className="px-4 py-3">{l.maxIncomeMultiple}×</td>
                          <td className="px-4 py-3">{fmt(l.maxLoanSize)}</td>
                          <td className="px-4 py-3">{l.processingDays}d</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CREDIT_PILL[l.minCredit]}`}>
                              {humanize(l.minCredit)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)] text-center">
              {rates.isLive
                ? "Per-lender spreads are indicative; overall levels track the live BoE-quoted market average."
                : "Indicative rates — live market unavailable, showing static baseline."}
              {" "}Always verify on Trigold, Twenty7Tec or Iress before submission · Click any row to view full criteria
            </p>
          </div>
        )}

      </div>
    </>
  );
}
