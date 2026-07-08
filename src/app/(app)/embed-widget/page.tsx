"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { useUser } from "@/hooks/useUser";

export default function EmbedWidgetPage() {
  const { id: adviserId, loading } = useUser();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const widgetUrl = adviserId ? `${origin}/apply/${adviserId}` : "";

  const snippet = widgetUrl
    ? `<iframe\n  src="${widgetUrl}"\n  style="width:100%;height:780px;border:0"\n  loading="lazy"\n></iframe>`
    : "";

  const copy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Embed Widget"
        actions={
          <button
            onClick={copy}
            disabled={!snippet || loading}
            className="flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy snippet"}
          </button>
        }
      />

      <div className="p-6 space-y-6 max-w-4xl">

        {/* Info banner */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--primary-light)] p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0">
            <Copy size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">How it works</div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-medium">
              Paste the iframe snippet below into any webpage. The widget lets clients fill in their
              mortgage application which is then sent directly into your Applications queue.
              Your unique adviser ID is embedded in the URL so every submission is linked to your account.
            </p>
          </div>
        </div>

        {/* Snippet */}
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)]">iframe snippet</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                Copy and paste this into your website HTML
              </div>
            </div>
            <button
              onClick={copy}
              disabled={!snippet || loading}
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-40"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="bg-[#0F2A4A] rounded-xl p-4 text-[#9DD2FF] text-xs animate-pulse">
                Loading your snippet…
              </div>
            ) : (
              <pre className="bg-[#0F2A4A] text-[#9DD2FF] text-xs p-4 rounded-xl overflow-x-auto whitespace-pre select-all">
                {snippet}
              </pre>
            )}
          </div>
        </div>

        {/* Adviser ID */}
        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm p-5">
          <div className="font-bold text-sm text-[var(--text-primary)] mb-3">Your adviser details</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Adviser ID</div>
              <div className="font-mono text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] select-all">
                {loading ? "Loading…" : adviserId ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Widget URL</div>
              <div className="font-mono text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-secondary)] truncate select-all">
                {loading ? "Loading…" : widgetUrl || "Configure Supabase URL"}
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        {widgetUrl && (
          <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <div className="font-bold text-sm text-[var(--text-primary)]">Live preview</div>
              <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                This is exactly what your clients will see
              </div>
            </div>
            <iframe
              src={widgetUrl}
              className="w-full h-[780px]"
              loading="lazy"
            />
          </div>
        )}

      </div>
    </>
  );
}
