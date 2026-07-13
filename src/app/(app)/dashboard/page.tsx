"use client";

import {
  BarChart3,
  Briefcase,
  CheckSquare,
  ChevronRight,
  Inbox,
  Landmark,
  Link2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { useMortgageRates } from "@/hooks/useMortgageRates";
import { useStats } from "@/hooks/useStats";
import { useUser } from "@/hooks/useUser";
import { formatCurrencyGBP } from "@/lib/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const stats = useStats();
  const { fullName, email } = useUser();
  const { rates, loading: ratesLoading } = useMortgageRates();
  const displayName = fullName?.split(" ")[0] ?? email?.split("@")[0] ?? "Adviser";

  const kpis = [
    {
      label: "Applications",
      value: stats.loading ? "—" : String(stats.newApplications),
      hint: "New submissions via widget",
      href: "/applications",
      Icon: Inbox,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      valueCls: "text-[var(--text-primary)]",
    },
    {
      label: "Active",
      value: stats.loading ? "—" : String(stats.activeCases),
      hint: "Currently in pipeline",
      href: "/pipeline",
      Icon: Briefcase,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valueCls: "text-[var(--text-primary)]",
    },
    {
      label: "Tasks",
      value: stats.loading ? "—" : String(stats.tasksDueToday),
      hint: "Due today; action required",
      href: "/pipeline",
      Icon: CheckSquare,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueCls: "text-[var(--text-primary)]",
    },
    {
      label: "Pipeline",
      value: stats.loading ? "—" : formatCurrencyGBP(stats.pipelineValue),
      hint: "Total estimated value",
      href: "/pipeline",
      Icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueCls: "text-[var(--text-primary)]",
    },
  ];

  const isBoE = rates.quotedRatesSource === "boe_quoted";
  const fixedNote = isBoE ? "BoE quoted · 75% LTV" : "est. from base rate";
  const svrNote   = isBoE ? "BoE quoted avg" : "est. from base rate";

  const rateCards = [
    { label: "Base Rate",  value: rates.baseRate,      note: "BoE",        highlight: true  },
    { label: "2yr Fixed",  value: rates.twoYearFixed,  note: fixedNote,    highlight: false },
    { label: "5yr Fixed",  value: rates.fiveYearFixed, note: fixedNote,    highlight: false },
    { label: "Tracker",    value: rates.trackerRate,   note: "base + 0.90%", highlight: false },
    { label: "SVR",        value: rates.svr,           note: svrNote,      warning: true    },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${displayName}`}
        subtitle="Here's your business at a glance"
      />

      <div className="p-6 space-y-7">

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-px rounded-2xl border border-[var(--border)] bg-[var(--border)] overflow-hidden">
          {kpis.map((k) => {
            const Icon = k.Icon;
            return (
              <Link
                key={k.label}
                href={k.href}
                className="bg-white hover:bg-[var(--bg)] transition-colors p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl ${k.iconBg} flex items-center justify-center`}>
                    <Icon size={16} className={k.iconColor} />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                    {k.label}
                  </span>
                </div>
                <div>
                  <div className={`font-heading text-3xl font-bold tabular ${k.valueCls}`}>
                    {k.value}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{k.hint}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Market rates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Market Rates</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${ratesLoading ? "bg-[var(--text-muted)]" : rates.isLive ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"}`} />
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {ratesLoading
                  ? "Loading…"
                  : rates.isLive
                  ? `${isBoE ? "BoE quoted" : "BoE base"} · ${rates.asOf}`
                  : "Indicative average"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {rateCards.map((r) => (
              <div
                key={r.label}
                className={`rounded-2xl border p-4 ${
                  r.highlight
                    ? "border-[var(--primary)]/25 bg-[var(--primary-light)]"
                    : r.warning
                    ? "border-amber-200 bg-amber-50"
                    : "border-[var(--border)] bg-white"
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  {r.label}
                </div>
                <div className={`font-heading text-2xl font-bold tabular ${
                  r.highlight ? "text-[var(--primary)]" : r.warning ? "text-amber-700" : "text-[var(--text-primary)]"
                }`}>
                  {ratesLoading ? "—" : `${r.value.toFixed(2)}%`}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  {r.highlight && rates.isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                  )}
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">{r.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight mb-3">Quick actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                href: "/applications",
                Icon: Inbox,
                iconBg: "bg-violet-500",
                title: "Review applications",
                desc: "Approve or reject new submissions from your website widget seamlessly.",
                cta: "Open queue",
              },
              {
                href: "/lender-match",
                Icon: Landmark,
                iconBg: "bg-cyan-500",
                title: "Lender match",
                desc: "AI-powered ranking of lenders against client profiles with auto-drafting.",
                cta: "Start matching",
              },
              {
                href: "/embed-widget",
                Icon: Link2,
                iconBg: "bg-indigo-500",
                title: "Embed widget",
                desc: "Get the iframe snippet to start capturing leads directly on your partner sites.",
                cta: "Copy code",
              },
            ].map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card-hover rounded-2xl border border-[var(--border)] bg-white p-5 flex flex-col gap-3 group"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-primary)] text-sm">{item.title}</div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] mt-auto">
                    {item.cta}
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI + Analytics row */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/ai-tools"
            className="card-hover rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary-light)] p-5 flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-md shadow-[var(--primary)]/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[var(--text-primary)] text-sm">AI Tools</div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">Lead scoring, document summarisation & email drafting</p>
            </div>
            <ChevronRight size={14} className="text-[var(--primary)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/analytics"
            className="card-hover rounded-2xl border border-[var(--border)] bg-white p-5 flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[var(--text-primary)] text-sm">Analytics</div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">Deep insights into conversion funnels and revenue pipelines</p>
            </div>
            <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* AI CTA banner */}
        <div className="rounded-2xl p-6 flex items-center justify-between gap-6 overflow-hidden relative bg-[var(--text-primary)]">
          {/* Accent glow */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[var(--accent)]/25 blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Zap size={96} className="text-white" strokeWidth={1} />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="font-heading font-bold text-white text-base">AI ready · Start a new case</div>
              <div className="text-sm text-white/60 mt-0.5 font-medium">
                Your AI adviser assistant is standing by to match, score, and draft for your next client profile.
              </div>
            </div>
          </div>

          <Link
            href="/lender-match"
            className="relative z-10 shrink-0 rounded-full bg-white text-[var(--text-primary)] text-sm font-bold px-6 py-2.5 hover:bg-white/90 transition"
          >
            Get started →
          </Link>
        </div>

      </div>
    </>
  );
}
