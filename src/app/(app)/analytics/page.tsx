"use client";

import { Bot, Send, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { formatCurrencyGBP } from "@/lib/format";

const PIE_COLORS = ["#6C47FF", "#A78BFA", "#7C3AED", "#F59E0B"];

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "short" });
  return `${day} ${month}`;
}

function getMonthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleString("default", { month: "short" });
}

interface AnalyticsData {
  summary: { totalLeads: number; pipelineValue: number; conversionRate: number };
  leadsPerWeek: { week: string; leads: number }[];
  revenuePerMonth: { month: string; value: number }[];
  caseTypes: { name: string; value: number }[];
  funnel: { stage: string; count: number }[];
}

function buildAnalytics(
  apps: { submitted_at: string; status: string; loan_amount: number | null }[],
  cases: { value: number | null; type: string | null; stage: string; created_at: string }[],
): AnalyticsData {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Summary
  const recentApps = apps.filter((a) => new Date(a.submitted_at) >= thirtyDaysAgo);
  const totalLeads = recentApps.length;
  const approved = apps.filter((a) => a.status === "approved").length;
  const total = apps.filter((a) => ["approved", "rejected"].includes(a.status)).length;
  const conversionRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const pipelineValue = cases
    .filter((c) => c.stage !== "completed")
    .reduce((s, c) => s + (c.value ?? 0), 0);

  // Leads per week (last 6 weeks)
  const weekMap: Record<string, number> = {};
  const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);
  apps
    .filter((a) => new Date(a.submitted_at) >= sixWeeksAgo)
    .forEach((a) => {
      const label = getWeekLabel(a.submitted_at);
      weekMap[label] = (weekMap[label] ?? 0) + 1;
    });
  const leadsPerWeek = Object.entries(weekMap).map(([week, leads]) => ({ week, leads }));

  // Revenue per month (last 6 months)
  const monthMap: Record<string, number> = {};
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  cases
    .filter((c) => new Date(c.created_at) >= sixMonthsAgo)
    .forEach((c) => {
      const label = getMonthLabel(c.created_at);
      monthMap[label] = (monthMap[label] ?? 0) + Math.round((c.value ?? 0) / 1000);
    });
  const revenuePerMonth = Object.entries(monthMap).map(([month, value]) => ({ month, value }));

  // Case types
  const typeMap: Record<string, number> = {};
  cases.forEach((c) => {
    const t = c.type ?? "other";
    typeMap[t] = (typeMap[t] ?? 0) + 1;
  });
  const caseTypes = Object.entries(typeMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Funnel
  const funnelOrder = ["submitted", "under_review", "approved", "rejected"];
  const statusMap: Record<string, number> = {};
  apps.forEach((a) => { statusMap[a.status] = (statusMap[a.status] ?? 0) + 1; });
  const funnel = funnelOrder
    .filter((s) => statusMap[s])
    .map((s) => ({
      stage: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count: statusMap[s] ?? 0,
    }));

  return { summary: { totalLeads, pipelineValue, conversionRate }, leadsPerWeek, revenuePerMonth, caseTypes, funnel };
}

// ── AI Coach ────────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; text: string }

function useChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: "assistant",
    text: "Hi! I can see your live analytics. Ask me about your leads, conversion rate, pipeline value, or case mix.",
  }]);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.text })) }),
      });
      const data = (await res.json()) as { content?: string };
      setMessages((prev) => [...prev, { role: "assistant", text: data.content ?? "No response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Could not reach AI. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send };
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { id: adviserId, loading: authLoading } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { messages, loading: chatLoading, send } = useChat();
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatLoading]);

  useEffect(() => {
    if (authLoading || !adviserId) return;
    (async () => {
      setDataLoading(true);
      const [{ data: apps }, { data: cases }] = await Promise.all([
        supabase
          .from("b2b_applications")
          .select("submitted_at, status, loan_amount")
          .eq("adviser_id", adviserId),
        supabase
          .from("cases")
          .select("value, type, stage, created_at")
          .eq("adviser_id", adviserId),
      ]);
      setAnalytics(buildAnalytics(apps ?? [], cases ?? []));
      setDataLoading(false);
    })();
  }, [adviserId, authLoading]);

  const handleSend = () => {
    const t = input.trim();
    if (!t || chatLoading) return;
    setInput("");
    send(t);
  };

  const s = analytics?.summary;

  const summaryTiles = [
    {
      label: "Total Leads",
      value: dataLoading ? "—" : String(s?.totalLeads ?? 0),
      hint: "Last 30 days",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Pipeline Value",
      value: dataLoading ? "—" : formatCurrencyGBP(s?.pipelineValue ?? 0),
      hint: "Active cases",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Conversion Rate",
      value: dataLoading ? "—" : `${s?.conversionRate ?? 0}%`,
      hint: "Approved / closed",
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-light)]",
    },
  ];

  const empty = (label: string) => (
    <div className="flex items-center justify-center h-40 text-sm text-[var(--text-muted)]">
      No {label} data yet
    </div>
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Live performance data"
        actions={
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              chatOpen
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)]/20"
            }`}
          >
            <Sparkles size={15} />
            AI Coach
          </button>
        }
      />

      <div className="p-6 flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">

          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4">
            {summaryTiles.map((s) => (
              <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <TrendingUp size={16} className={s.color} />
                </div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)]">{s.value}</div>
                <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] mt-1">{s.label}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.hint}</div>
              </div>
            ))}
          </div>

          {/* Leads over time */}
          <ChartCard title="Applications over time">
            {dataLoading ? empty("leads") : analytics!.leadsPerWeek.length === 0 ? empty("leads") : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics!.leadsPerWeek} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DEFF" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#52526B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#52526B" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2DEFF", fontSize: 12 }} />
                  <Line type="monotone" dataKey="leads" stroke="#6C47FF" strokeWidth={2.5} dot={{ fill: "#6C47FF", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Revenue pipeline */}
          <ChartCard title="Pipeline value · £K per month">
            {dataLoading ? empty("revenue") : analytics!.revenuePerMonth.length === 0 ? empty("revenue") : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics!.revenuePerMonth} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DEFF" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#52526B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#52526B" }} tickFormatter={(v) => `£${v}K`} />
                  <Tooltip formatter={(v) => [`£${v}K`, "Value"]} contentStyle={{ borderRadius: 10, border: "1px solid #E2DEFF", fontSize: 12 }} />
                  <Bar dataKey="value" fill="#6C47FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Case types + Funnel */}
          <div className="grid grid-cols-2 gap-6">
            <ChartCard title="Case types">
              {dataLoading ? empty("case") : analytics!.caseTypes.length === 0 ? empty("case type") : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics!.caseTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {analytics!.caseTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#52526B" }}>{v}</span>} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2DEFF", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Application funnel">
              {dataLoading ? empty("funnel") : analytics!.funnel.length === 0 ? empty("funnel") : (
                <div className="space-y-3 py-2">
                  {analytics!.funnel.map((f) => {
                    const pct = Math.round((f.count / analytics!.funnel[0].count) * 100);
                    return (
                      <div key={f.stage}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-[var(--text-primary)]">{f.stage}</span>
                          <span className="text-[var(--text-secondary)]">{f.count} · {pct}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[var(--primary-light)]">
                          <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>
          </div>

        </div>

        {/* AI Coach */}
        {chatOpen && (
          <div className="w-80 shrink-0 flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden" style={{ maxHeight: 560, position: "sticky", top: 24 }}>
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--primary-light)]">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">AI Business Coach</div>
                <div className="text-xs text-[var(--text-secondary)]">Ask about your numbers</div>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--primary)] text-white rounded-br-sm" : "bg-[var(--primary-light)] text-[var(--text-primary)] rounded-bl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--primary-light)] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm outline-none focus:border-[var(--primary)] transition"
                placeholder="Ask your coach…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend} disabled={!input.trim() || chatLoading} className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--primary-dark)] transition">
                <Send size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {children}
    </div>
  );
}
