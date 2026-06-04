"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/PageHeader";

interface GCalEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  colorId?: string;
  htmlLink: string;
}

const GCAL_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_KEY = "gcal_access_token";
const EXPIRY_KEY = "gcal_token_expiry";

function buildAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function fetchEventsForDay(token: string, date: Date): Promise<GCalEvent[]> {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    timeMin: start.toISOString(), timeMax: end.toISOString(),
    singleEvents: "true", orderBy: "startTime", maxResults: "25",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(res.status === 401 ? "UNAUTHORIZED" : "error");
  const json = await res.json() as { items?: Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string; colorId?: string; htmlLink?: string }> };
  return (json.items ?? []).map((ev) => ({
    id: ev.id, summary: ev.summary ?? "(No title)",
    start: ev.start?.dateTime ?? ev.start?.date ?? "",
    end: ev.end?.dateTime ?? ev.end?.date ?? "",
    location: ev.location, colorId: ev.colorId, htmlLink: ev.htmlLink ?? "",
  }));
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const isConfigured = CLIENT_ID.length > 0;

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (stored && expiry && Date.now() < Number(expiry)) setToken(stored);
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "gcal_token") return;
      const { access_token, expires_in } = e.data;
      const expiry = Date.now() + Number(expires_in ?? 3600) * 1000;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(EXPIRY_KEY, String(expiry));
      setToken(access_token); setConnecting(false); setError(null);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!token) { setEvents([]); return; }
    let cancelled = false;
    setEventsLoading(true);
    fetchEventsForDay(token, selected)
      .then((evs) => { if (!cancelled) setEvents(evs); })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err.message === "UNAUTHORIZED") {
          localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EXPIRY_KEY); setToken(null);
        }
        setEvents([]);
      })
      .finally(() => { if (!cancelled) setEventsLoading(false); });
    return () => { cancelled = true; };
  }, [token, selected]);

  const connect = useCallback(() => {
    if (!isConfigured) { setError("Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local"); return; }
    const redirect = `${window.location.origin}/oauth-callback`;
    setConnecting(true);
    const popup = window.open(buildAuthUrl(redirect), "gcal_auth", "width=500,height=600,left=200,top=100");
    popupRef.current = popup;
    const t = setInterval(() => { if (popup?.closed) { clearInterval(t); setConnecting(false); } }, 500);
  }, [isConfigured]);

  const disconnect = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EXPIRY_KEY);
    setToken(null); setEvents([]);
  };

  const monthStart = startOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) });

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Your schedule at a glance"
        actions={
          token ? (
            <button onClick={disconnect} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--error)] border border-[var(--border)] rounded-lg px-3 py-1.5 transition">
              <LogOut size={14} /> Disconnect Google
            </button>
          ) : isConfigured ? (
            <button onClick={connect} disabled={connecting} className="flex items-center gap-2 text-sm bg-[var(--primary)] text-white rounded-lg px-4 py-2 hover:bg-[var(--primary-dark)] disabled:opacity-60 transition">
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              {connecting ? "Connecting…" : "Connect Google Calendar"}
            </button>
          ) : null
        }
      />

      {error && (
        <div className="mx-8 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Only show setup warning in dev, not to real users */}
      {!isConfigured && process.env.NODE_ENV === "development" && (
        <div className="mx-8 mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <strong>Dev only:</strong> Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code className="bg-amber-100 px-1 rounded">.env.local</code>.{" "}
            <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console →</a>
          </div>
        </div>
      )}

      <div className="p-8 grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* Month grid */}
        <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--primary-light)] transition">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-bold text-[var(--text-primary)] text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--primary-light)] transition">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((day: Date) => {
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selected);
              const todayDay = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelected(day); setCurrentMonth(day); }}
                  className={`min-h-[52px] flex flex-col items-center justify-center text-sm border-b border-r border-[var(--border)] transition relative
                    ${!inMonth ? "text-[var(--text-secondary)]/30" : ""}
                    ${isSelected ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--primary-light)]"}
                  `}
                >
                  <span className={`font-semibold ${todayDay && !isSelected ? "text-[var(--primary)]" : ""}`}>{format(day, "d")}</span>
                  {todayDay && !isSelected && <span className="w-1 h-1 rounded-full bg-[var(--primary)] mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day panel */}
        <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="font-bold text-[var(--text-primary)]">{format(selected, "EEEE")}</div>
              <div className="text-sm text-[var(--text-secondary)]">{format(selected, "d MMMM yyyy")}</div>
            </div>
            {token && (
              <button
                onClick={() => {
                  setEventsLoading(true);
                  fetchEventsForDay(token, selected).then(setEvents).catch(() => setEvents([])).finally(() => setEventsLoading(false));
                }}
                className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center hover:bg-[var(--primary-light)] transition"
              >
                {eventsLoading ? <Loader2 size={14} className="animate-spin text-[var(--primary)]" /> : <RefreshCw size={14} className="text-[var(--text-secondary)]" />}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!token && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-4">📅</div>
                <div className="font-semibold text-[var(--text-primary)] mb-1">Connect Google Calendar</div>
                <div className="text-sm text-[var(--text-secondary)] mb-4">See your events alongside your cases</div>
                <button onClick={connect} disabled={connecting || !isConfigured} className="text-sm bg-[var(--primary)] text-white rounded-xl px-5 py-2 hover:bg-[var(--primary-dark)] disabled:opacity-50 transition">
                  {connecting ? "Connecting…" : "Connect"}
                </button>
              </div>
            )}

            {token && eventsLoading && events.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[var(--primary)]" />
              </div>
            )}

            {token && !eventsLoading && events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar size={28} className="text-[var(--text-secondary)] mb-3 opacity-40" />
                <div className="text-sm text-[var(--text-secondary)]">No events on this day</div>
              </div>
            )}

            {events.map((ev) => {
              const color = GCAL_COLORS[ev.colorId ?? ""] ?? "#4285F4";
              const isAllDay = !ev.start.includes("T");
              const startStr = isAllDay ? "All day" : format(new Date(ev.start), "h:mm a");
              const endStr = !isAllDay && ev.end.includes("T") ? format(new Date(ev.end), "h:mm a") : null;
              return (
                <a key={ev.id} href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                  className="block rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)]/30 transition group">
                  <div className="flex items-start gap-3">
                    <div className="w-1 rounded-full self-stretch" style={{ backgroundColor: color, minWidth: 4 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] text-sm truncate">{ev.summary}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">{startStr}{endStr ? ` – ${endStr}` : ""}</div>
                      {ev.location && (
                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mt-1">
                          <MapPin size={10} /><span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                    <ExternalLink size={12} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition shrink-0 mt-0.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <div className="mx-8 mb-8 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-[var(--primary)]" />
          Google Calendar Setup
        </h3>
        <ol className="space-y-2 text-sm text-[var(--text-secondary)] list-decimal list-inside">
          <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Google Cloud Console</a> → create or select a project.</li>
          <li>Enable the <strong className="text-[var(--text-primary)]">Google Calendar API</strong>.</li>
          <li>Credentials → Create OAuth 2.0 Client ID → <strong className="text-[var(--text-primary)]">Web application</strong>.</li>
          <li>Add authorised redirect URI: <code className="bg-[var(--bg)] px-1.5 py-0.5 rounded text-xs">http://localhost:3000/oauth-callback</code> (and your Vercel URL for production).</li>
          <li>Add to <code className="bg-[var(--bg)] px-1.5 py-0.5 rounded text-xs">.env.local</code>:
            <pre className="bg-[var(--bg)] rounded-lg p-3 mt-1.5 text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</pre>
          </li>
          <li>Add same value as <code className="bg-[var(--bg)] px-1.5 py-0.5 rounded text-xs">EXPO_PUBLIC_GOOGLE_CLIENT_ID</code> to mobile <code className="bg-[var(--bg)] px-1.5 py-0.5 rounded text-xs">.env</code>.</li>
        </ol>
      </div>
    </>
  );
}
