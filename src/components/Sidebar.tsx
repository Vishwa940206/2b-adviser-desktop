"use client";

import {
  BarChart3,
  Briefcase,
  Calendar as CalendarIcon,
  FileText,
  Home,
  Inbox,
  Landmark,
  Link2,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUser } from "@/hooks/useUser";

const PRIMARY = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/applications", label: "Applications", Icon: Inbox },
  { href: "/clients", label: "Clients", Icon: Users },
  { href: "/pipeline", label: "Pipeline", Icon: Briefcase },
  { href: "/lender-match", label: "Lender Match", Icon: Landmark },
  { href: "/embed-widget", label: "Embed Widget", Icon: Link2 },
];

const MORE = [
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/documents", label: "Documents", Icon: FileText },
  { href: "/ai-tools", label: "AI Tools", Icon: Sparkles },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/profile", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  const { email, fullName, signOut } = useUser();

  const onSignOut = () => signOut();

  const displayName = fullName ?? email?.split("@")[0] ?? "Adviser";
  const initials = (fullName ?? email ?? "AD")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 shrink-0 bg-white/80 backdrop-blur border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-[var(--border)] flex items-center gap-3">
        {/* MG logo mark */}
        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow-md shadow-[var(--primary)]/30">
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B5CF6"/>
                <stop offset="100%" stopColor="#4F35CC"/>
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="10" fill="url(#sg)"/>
            <ellipse cx="17" cy="12" rx="9" ry="5" fill="rgba(255,255,255,0.18)" transform="rotate(-15 17 12)"/>
            <text x="20" y="26" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" letterSpacing="-0.5">MG</text>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[var(--text-primary)] text-sm leading-tight">MortgageGPT</div>
          <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
            Your AI mortgage adviser
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavGroup items={PRIMARY} path={path} />

        <div className="pt-4 pb-2 px-3 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-secondary)]">
          More
        </div>
        <NavGroup items={MORE} path={path} />
      </nav>

      <div className="px-3 py-3 border-t border-[var(--border)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow shadow-[var(--primary)]/30">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{displayName}</div>
          <div className="text-xs text-[var(--text-secondary)] truncate">{email ?? "—"}</div>
        </div>
        <button
          onClick={onSignOut}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-red-50 transition"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

function NavGroup({
  items,
  path,
}: {
  items: { href: string; label: string; Icon: typeof Home }[];
  path: string;
}) {
  return (
    <>
      {items.map((item) => {
        const active = path === item.href || path.startsWith(item.href + "/");
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition relative ${
              active
                ? "bg-gradient-to-r from-[var(--primary-light)] to-transparent text-[var(--primary-dark)]"
                : "text-[var(--text-primary)] hover:bg-[var(--primary-light)]/60"
            }`}
          >
            {active ? (
              <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--primary)]" />
            ) : null}
            <Icon size={16} className={active ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
