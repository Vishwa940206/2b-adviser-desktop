"use client";

import {
  BarChart3,
  Briefcase,
  CheckCircle2,
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
      label: "New applications",
      value: stats.loading ? "—" : String(stats.newApplications),
      hint: "Submitted via widget",
      href: "/applications",
      Icon: Inbox,
      tint: "from-violet-400/15 to-transparent",
      iconBg: "bg-violet-50",
      iconColor: "text-[var(--primary)]",
    },
    {
      label: "Active cases",
      value: stats.loading ? "—" : String(stats.activeCases),
      hint: "In pipeline",
      href: "/pipeline",
      Icon: Briefcase,
      tint: "from-purple-400/15 to-transparent",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Tasks due today",
      value: stats.loading ? "—" : String(stats.tasksDueToday),
      hint: "Action required",
      href: "/pipeline",
      Icon: CheckCircle2,
      tint: "from-amber-400/15 to-transparent",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Pipeline value",
      value: stats.loading ? "—" : formatCurrencyGBP(stats.pipelineValue),
      hint: "Open cases",
      href: "/pipeline",
      Icon: TrendingUp,
      tint: "from-emerald-400/15 to-transparent",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  const rateCards = [
    {
      label: "Base Rate",
      value: rates.baseRate,
      note: rates.isLive ? "BoE · Live" : "Indicative",
      live: rates.isLive,
      highlight: true,
    },
    { label: "2yr Fixed", value: rates.twoYearFixed, note: "avg indicative" },
    { label: "5yr Fixed", value: rates.fiveYearFixed, note: "avg indicative" },
    { label: "Tracker", value: rates.trackerRate, note: "base + 0.90%" },
    { label: "SVR", value: rates.svr, note: "avg indicative", warning: true },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${displayName}`}
        subtitle="Here's your business at a glance"
      />

      <div className="p-8 space-y-8">
        {/* KPI cards */}
        <section className="grid grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.Icon;
            return (
              <Link
                key={k.label}
                href={k.href}
                className={`card-hover rounded-2xl border border-[var(--border)] bg-gradient-to-br ${k.tint} bg-white p-5 relative overflow-hidden group`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${k.iconBg} border border-[var(--border)] flex items-center justify-center`}
                >
                  <Icon size={18} className={k.iconColor} />
                </div>
                <div className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {k.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mt-1">
                  {k.label}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{k.hint}</div>
              </Link>
            );
          })}
        </section>

        {/* Live market rates */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Market Rates</h2>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${ratesLoading ? "bg-[var(--text-secondary)]" : rates.isLive ? "bg-[var(--success)]" : "bg-[var(--text-secondary)]"}`}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {ratesLoading ? "Loading…" : rates.isLive ? `Live · BoE · ${rates.asOf}` : "Indicative"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {rateCards.map((r) => (
              <div
                key={r.label}
                className={`rounded-2xl border p-4 ${
                  r.highlight
                    ? "border-[var(--primary)]/30 bg-[var(--primary-light)]"
                    : r.warning
                      ? "border-amber-200 bg-amber-50"
                      : "border-[var(--border)] bg-white"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
                  {r.label}
                </div>
                <div
                  className={`text-2xl font-bold tracking-tight ${
                    r.highlight
                      ? "text-[var(--primary)]"
                      : r.warning
                        ? "text-amber-700"
                        : "text-[var(--text-primary)]"
                  }`}
                >
                  {ratesLoading ? "—" : `${r.value.toFixed(2)}%`}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {r.live && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block" />
                  )}
                  <span className="text-[10px] text-[var(--text-secondary)]">{r.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quick actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <QuickCard
              href="/applications"
              Icon={Inbox}
              title="Review applications"
              description="See new submissions from your widget and approve or reject them."
              color="violet"
            />
            <QuickCard
              href="/lender-match"
              Icon={Landmark}
              title="Lender match"
              description="AI ranks lenders against a client profile and composes the outreach email."
              color="purple"
            />
            <QuickCard
              href="/embed-widget"
              Icon={Link2}
              title="Embed widget"
              description="Copy the iframe snippet to embed application forms on partner websites."
              color="indigo"
            />
          </div>
        </section>

        {/* AI + Analytics row */}
        <section className="grid grid-cols-2 gap-4">
          <Link
            href="/ai-tools"
            className="card-hover rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary-light)] to-white p-5 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow shadow-[var(--primary)]/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">AI Tools</div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Lead scoring, email drafting, document summarisation — all AI-powered.
              </p>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="card-hover rounded-2xl border border-[var(--border)] bg-white p-5 flex items-start gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <BarChart3 size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">Analytics</div>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Leads over time, revenue pipeline, case mix, and conversion funnel.
              </p>
            </div>
          </Link>
        </section>

        {/* AI insight banner */}
        <section className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)] to-purple-500 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white">AI ready · Start a new case</div>
              <div className="text-sm text-white/80 mt-0.5">
                Your AI adviser assistant is standing by to match, score, and draft.
              </div>
            </div>
          </div>
          <Link
            href="/lender-match"
            className="rounded-xl bg-white text-[var(--primary)] text-sm font-bold px-5 py-2.5 hover:bg-white/90 transition shrink-0"
          >
            Get started →
          </Link>
        </section>
      </div>
    </>
  );
}

function QuickCard({
  href,
  Icon,
  title,
  description,
  color,
}: {
  href: string;
  Icon: typeof Inbox;
  title: string;
  description: string;
  color: "violet" | "purple" | "indigo";
}) {
  const palette = {
    violet: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100" },
  }[color];

  return (
    <Link
      href={href}
      className={`card-hover rounded-2xl border ${palette.border} bg-white p-5 block`}
    >
      <div className={`w-10 h-10 rounded-xl ${palette.bg} flex items-center justify-center`}>
        <Icon size={18} className={palette.icon} />
      </div>
      <div className="font-bold mt-3 text-[var(--text-primary)]">{title}</div>
      <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{description}</p>
    </Link>
  );
}
