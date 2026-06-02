"use client";

import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/PageHeader";

// ── Dummy data ──────────────────────────────────────────────────────────────
const LEADS_DATA = [
  { week: "3 May", leads: 3 },
  { week: "10 May", leads: 7 },
  { week: "17 May", leads: 5 },
  { week: "24 May", leads: 12 },
  { week: "31 May", leads: 8 },
  { week: "7 Jun", leads: 11 },
];

const REVENUE_DATA = [
  { month: "Jan", value: 45 },
  { month: "Feb", value: 62 },
  { month: "Mar", value: 38 },
  { month: "Apr", value: 71 },
  { month: "May", value: 89 },
  { month: "Jun", value: 54 },
];

const CASE_TYPE_DATA = [
  { name: "Mortgage", value: 12 },
  { name: "Investment", value: 5 },
  { name: "Insurance", value: 3 },
  { name: "Pension", value: 2 },
];
const PIE_COLORS = ["#6C47FF", "#A78BFA", "#7C3AED", "#F59E0B"];

const FUNNEL_DATA = [
  { stage: "New", count: 18 },
  { stage: "Qualified", count: 12 },
  { stage: "Assigned", count: 7 },
  { stage: "Converted", count: 4 },
];

const SUMMARY = [
  { label: "Total Leads", value: "18", hint: "Last 30 days", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Pipeline", value: "£425K", hint: "Active cases", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Conversion", value: "22%", hint: "Industry avg 18%", icon: TrendingUp, color: "text-[var(--primary)]", bg: "bg-[var(--primary-light)]" },
];

// ── Chat ────────────────────────────────────────────────────────────────────
const FALLBACKS = [
  "Your Thursday–Friday lead surge suggests these days are your strongest for outreach. Schedule follow-up calls on Mondays to convert the weekend interest.",
  "With a 22% conversion rate above the 18% industry average, focus on shortening your 18→12 qualified lead drop. A 24-hour callback SLA could add 2–3 extra conversions monthly.",
  "Your mortgage-heavy case mix (55%) is solid but adding investment cases could raise your average case value by ~35%. Cross-sell to clients approaching remortgage windows.",
  "May showed your strongest revenue month at £89K. Replicate that by identifying what drove May's lead volume — likely a referral campaign or seasonal demand.",
];
let fallbackIdx = 0;

interface ChatMsg { role: "user" | "assistant"; text: string }

function useChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      text: "Hi! I've analysed your performance data. Your 22% conversion rate beats the industry average. Would you like tips on lead volume, closing rates, or case mix?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const userMsg: ChatMsg = { role: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      const reply = data.content ?? FALLBACKS[fallbackIdx++ % FALLBACKS.length];
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: FALLBACKS[fallbackIdx++ % FALLBACKS.length] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send };
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { messages, loading, send } = useChat();
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    send(t);
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Performance · insights"
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

      <div className="p-8 flex gap-6">
        {/* Charts column */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4">
            {SUMMARY.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <TrendingUp size={16} className={s.color} />
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mt-1">
                  {s.label}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.hint}</div>
              </div>
            ))}
          </div>

          {/* Leads over time */}
          <ChartCard title="Leads over time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={LEADS_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD6FE" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #DDD6FE", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#6C47FF"
                  strokeWidth={2.5}
                  dot={{ fill: "#6C47FF", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue pipeline */}
          <ChartCard title="Revenue pipeline · £K per month">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={REVENUE_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD6FE" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} unit="K" tickFormatter={(v) => `£${v}`} />
                <Tooltip
                  formatter={(v) => [`£${v}K`, "Revenue"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #DDD6FE", fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#6C47FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Case types + Funnel row */}
          <div className="grid grid-cols-2 gap-6">
            <ChartCard title="Case types">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={CASE_TYPE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {CASE_TYPE_DATA.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ fontSize: 11, color: "#6B7280" }}>{v}</span>}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #DDD6FE", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Lead conversion funnel">
              <div className="space-y-3 py-2">
                {FUNNEL_DATA.map((f) => {
                  const pct = Math.round((f.count / FUNNEL_DATA[0].count) * 100);
                  return (
                    <div key={f.stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-[var(--text-primary)]">{f.stage}</span>
                        <span className="text-[var(--text-secondary)]">{f.count} · {pct}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--primary-light)]">
                        <div
                          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        </div>

        {/* AI Coach panel */}
        {chatOpen && (
          <div className="w-80 shrink-0 flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden" style={{ height: "fit-content", position: "sticky", top: 24 }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--primary-light)]">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">AI Business Coach</div>
                <div className="text-xs text-[var(--text-secondary)]">Ask about your numbers</div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ maxHeight: 380 }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-[var(--primary)] text-white rounded-br-sm"
                        : "bg-[var(--primary-light)] text-[var(--text-primary)] rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--primary-light)] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm outline-none focus:border-[var(--primary)] transition"
                placeholder="Ask your coach…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--primary-dark)] transition"
              >
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
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {children}
    </div>
  );
}
