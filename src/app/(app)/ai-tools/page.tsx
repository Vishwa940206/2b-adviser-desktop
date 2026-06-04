"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";

const TOOLS = [
  {
    id: "chat",
    label: "AI Chat Assistant",
    description: "Ask anything about mortgage products, criteria, or client scenarios.",
    Icon: MessageSquare,
    color: "from-violet-500 to-purple-600",
    light: "bg-violet-50",
    textColor: "text-violet-700",
    uses: 142,
    badge: "Most used",
  },
  {
    id: "lead",
    label: "Lead Qualifier",
    description: "Score and qualify new leads instantly based on income, LTV, and credit profile.",
    Icon: UserCheck,
    color: "from-blue-500 to-cyan-500",
    light: "bg-blue-50",
    textColor: "text-blue-700",
    uses: 38,
    badge: null,
  },
  {
    id: "doc",
    label: "Document Checker",
    description: "Upload payslips, bank statements, or IDs and let AI flag missing items.",
    Icon: FileSearch,
    color: "from-amber-400 to-orange-500",
    light: "bg-amber-50",
    textColor: "text-amber-700",
    uses: 61,
    badge: null,
  },
  {
    id: "summary",
    label: "Case Summariser",
    description: "Generate a full case narrative from your client's application data in seconds.",
    Icon: BookOpen,
    color: "from-emerald-500 to-teal-500",
    light: "bg-emerald-50",
    textColor: "text-emerald-700",
    uses: 29,
    badge: "New",
  },
  {
    id: "email",
    label: "Email Drafter",
    description: "Draft professional emails to clients or lenders from a one-line prompt.",
    Icon: Mail,
    color: "from-pink-500 to-rose-500",
    light: "bg-pink-50",
    textColor: "text-pink-700",
    uses: 54,
    badge: null,
  },
  {
    id: "compliance",
    label: "Compliance Checker",
    description: "Run your recommendation against FCA suitability rules before submitting.",
    Icon: ShieldCheck,
    color: "from-slate-500 to-gray-600",
    light: "bg-slate-50",
    textColor: "text-slate-700",
    uses: 17,
    badge: null,
  },
];

const ACTIVITY = [
  {
    id: 1,
    tool: "Email Drafter",
    Icon: Mail,
    summary: "Drafted offer congratulations email for Sarah & James Thompson",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    tool: "Lead Qualifier",
    Icon: UserCheck,
    summary: "Qualified lead: Michael Chen — Score 84/100 (Strong)",
    time: "Yesterday, 4:12 pm",
    status: "success",
  },
  {
    id: 3,
    tool: "Case Summariser",
    Icon: BookOpen,
    summary: "Case summary generated for APP-2024-089 (Emma Wilson)",
    time: "Yesterday, 11:30 am",
    status: "success",
  },
  {
    id: 4,
    tool: "Compliance Checker",
    Icon: ShieldCheck,
    summary: "Suitability check flagged 1 issue — review required for APP-2024-081",
    time: "2 days ago",
    status: "warning",
  },
  {
    id: 5,
    tool: "Document Checker",
    Icon: FileSearch,
    summary: "Missing P60 detected in David Patel's document pack",
    time: "2 days ago",
    status: "warning",
  },
  {
    id: 6,
    tool: "AI Chat Assistant",
    Icon: MessageSquare,
    summary: "Answered 3 questions about Halifax affordability criteria",
    time: "3 days ago",
    status: "success",
  },
];

const STATS = [
  { label: "AI tasks this month", value: "341", Icon: Zap, delta: "+18%" },
  { label: "Hours saved (est.)", value: "24 hrs", Icon: Clock, delta: "+6 hrs" },
  { label: "Avg. quality score", value: "4.8 / 5", Icon: Star, delta: "" },
];

const SAMPLE_CHAT = [
  {
    role: "user",
    text: "What is Halifax's maximum LTV for a first-time buyer with a 5% deposit?",
  },
  {
    role: "ai",
    text: "Halifax currently offers up to 95% LTV for first-time buyers through the standard residential range, subject to affordability. The property must be a standard construction and the applicant must pass a credit check. Note that rates above 90% LTV attract a higher-rate tier — currently starting at 5.24% (2-year fix, as of this month).",
  },
  {
    role: "user",
    text: "Can they use gifted deposit?",
  },
  {
    role: "ai",
    text: "Yes — Halifax accepts gifted deposits from immediate family members (parents, grandparents, siblings). The donor must sign a gifted deposit letter confirming the funds are a gift, not a loan, and that they have no interest in the property. Halifax may also request 3 months' bank statements from the donor to confirm the source of funds.",
  },
];

export default function AIToolsPage() {
  const [activeChat, setActiveChat] = useState(false);

  return (
    <>
      <PageHeader title="AI Tools" subtitle="Your adviser copilot" />

      <div className="p-6 space-y-8 max-w-6xl">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s) => {
            const Icon = s.Icon;
            return (
              <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-white p-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--primary-dark)]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{s.label}</div>
                  {s.delta ? <div className="text-xs text-emerald-600 font-semibold mt-0.5">{s.delta} vs last month</div> : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tool cards */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Available Tools</h2>
          <div className="grid grid-cols-3 gap-4">
            {TOOLS.map((tool) => {
              const Icon = tool.Icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => tool.id === "chat" && setActiveChat(true)}
                  className="rounded-2xl border border-[var(--border)] bg-white p-5 text-left group hover:border-[var(--primary)] hover:shadow-md transition-all card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.badge ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.light} ${tool.textColor}`}>
                          {tool.badge}
                        </span>
                      ) : null}
                      <ChevronRight size={14} className="text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition" />
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{tool.label}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{tool.description}</div>
                  <div className="mt-3 text-[10px] text-[var(--text-secondary)]">{tool.uses} uses this month</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sample chat preview */}
        {activeChat ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm">AI Chat Assistant</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs text-emerald-600">Live</span>
              </div>
              <button onClick={() => setActiveChat(false)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--error)]">Close</button>
            </div>
            <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
              {SAMPLE_CHAT.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--primary-light)] text-[var(--primary-dark)]"
                  }`}>
                    {msg.role === "user" ? "You" : <Sparkles size={12} />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-tr-sm"
                      : "bg-[var(--bg)] text-[var(--text-primary)] rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about mortgage criteria, rates, affordability…"
                  className="flex-1 rounded-full border border-[var(--border)] px-4 py-2.5 text-sm focus:border-[var(--primary)] outline-none bg-[var(--bg)]"
                />
                <button className="rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-dark)] transition">
                  Send
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-2 text-center">Powered by OpenAI · responses are indicative only</p>
            </div>
          </div>
        ) : null}

        {/* Recent activity */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-4">Recent Activity</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm divide-y divide-[var(--border)]">
            {ACTIVITY.map((item) => {
              const Icon = item.Icon;
              const StatusIcon = item.status === "success" ? CheckCircle2 : AlertCircle;
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg)] transition">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[var(--primary-dark)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-secondary)] mb-0.5">{item.tool}</div>
                    <div className="text-sm text-[var(--text-primary)] truncate">{item.summary}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusIcon
                      size={14}
                      className={item.status === "success" ? "text-emerald-500" : "text-amber-500"}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
