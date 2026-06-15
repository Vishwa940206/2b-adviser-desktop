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
  { href: "/dashboard",    label: "Dashboard",    Icon: Home     },
  { href: "/applications", label: "Applications", Icon: Inbox    },
  { href: "/clients",      label: "Clients",      Icon: Users    },
  { href: "/pipeline",     label: "Pipeline",     Icon: Briefcase},
  { href: "/lender-match", label: "Lender Match", Icon: Landmark },
  { href: "/embed-widget", label: "Embed Widget", Icon: Link2    },
];

const MORE = [
  { href: "/calendar",  label: "Calendar",  Icon: CalendarIcon },
  { href: "/documents", label: "Documents", Icon: FileText     },
  { href: "/ai-tools",  label: "AI Tools",  Icon: Sparkles     },
  { href: "/analytics", label: "Analytics", Icon: BarChart3    },
  { href: "/profile",   label: "Settings",  Icon: Settings     },
];

export function Sidebar() {
  const path = usePathname();
  const { email, fullName, signOut } = useUser();

  const displayName = fullName ?? email?.split("@")[0] ?? "Adviser";
  const initials = (fullName ?? email ?? "AD")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0 bg-white border-r border-[var(--border)]">

      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden shadow shadow-[var(--primary)]/30">
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B5CF6"/>
                <stop offset="100%" stopColor="#4F35CC"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="9" fill="url(#sg)"/>
            <text x="18" y="24" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="13" fill="#fff" letterSpacing="-0.5">MG</text>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-[var(--text-primary)] text-sm leading-tight tracking-tight">MortgageGPT</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">AI mortgage adviser</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        <NavGroup items={PRIMARY} path={path} />

        <div className="pt-5 pb-1.5 px-2">
          <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--text-muted)]">More</span>
        </div>
        <NavGroup items={MORE} path={path} />
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow shadow-[var(--primary)]/30">
            {initials}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[var(--text-primary)] truncate leading-tight">{displayName}</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{email ?? "—"}</div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
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
      {items.map(({ href, label, Icon }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all relative group ${
              active
                ? "bg-[var(--primary-light)] text-[var(--primary-dark)] font-semibold"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)]"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[var(--primary)]" />
            )}
            <Icon
              size={15}
              className={active ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors"}
            />
            {label}
          </Link>
        );
      })}
    </>
  );
}
