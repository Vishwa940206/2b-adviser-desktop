"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Bell,
  BellPlus,
  CheckCheck,
  FileText,
  Inbox,
  Landmark,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useDesktopNotifications } from "@/hooks/useDesktopNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification, NotificationType } from "@/types/database";

const ICONS: Record<NotificationType, typeof Bell> = {
  new_application: Inbox,
  application_status: RefreshCw,
  document_uploaded: FileText,
  rate_change: Landmark,
};

export function NotificationBell() {
  const { data, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { permission, requestPermission } = useDesktopNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text-primary)] transition-colors shrink-0"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 max-h-[26rem] overflow-y-auto rounded-xl border border-[var(--border)] bg-white shadow-lg z-50">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border)] sticky top-0 bg-white">
            <span className="text-[12px] font-bold text-[var(--text-primary)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--primary)] hover:text-[var(--primary-dark)]"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {permission === "default" && (
            <button
              onClick={() => requestPermission()}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--border)] text-[11px] font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]/40 transition-colors"
            >
              <BellPlus size={13} />
              Enable desktop notifications for this app
            </button>
          )}

          {loading && data.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[12px] text-[var(--text-muted)]">Loading…</div>
          ) : data.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[12px] text-[var(--text-muted)]">
              No notifications yet
            </div>
          ) : (
            <ul>
              {data.map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={() => markAsRead(n.id)} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: Notification;
  onRead: () => void;
  onNavigate: () => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;
  const unread = !notification.read_at;

  const content = (
    <div
      className={`flex gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)] last:border-b-0 transition-colors ${
        unread ? "bg-[var(--primary-light)]/40" : "hover:bg-[var(--bg)]"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          unread ? "bg-[var(--primary)] text-white" : "bg-[var(--bg)] text-[var(--text-muted)]"
        }`}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-[var(--text-primary)] leading-snug">{notification.title}</div>
        {notification.body && (
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug line-clamp-2">{notification.body}</div>
        )}
        <div className="text-[10px] text-[var(--text-muted)] mt-1">
          {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
        </div>
      </div>
      {unread && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />}
    </div>
  );

  const handleClick = () => {
    if (unread) onRead();
    onNavigate();
  };

  if (notification.link) {
    return (
      <li>
        <Link href={notification.link} onClick={handleClick} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li onClick={handleClick} className="cursor-pointer">
      {content}
    </li>
  );
}
