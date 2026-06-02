"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export default function EmbedWidgetPage() {
  const [adviserId, setAdviserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdviserId(data.user?.id ?? null);
    });
  }, []);

  const widgetUrl =
    adviserId && SUPABASE_URL
      ? `${SUPABASE_URL}/functions/v1/widget?adviser=${adviserId}`
      : "";
  const snippet = widgetUrl
    ? `<iframe\n  src="${widgetUrl}"\n  style="width:100%;height:780px;border:0"\n  loading="lazy"\n></iframe>`
    : "";

  const copy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
  };

  return (
    <>
      <PageHeader
        title="Embed Widget"
        subtitle="Customer application form your B2B clients paste into their websites"
        actions={
          <button
            onClick={copy}
            disabled={!snippet}
            className="rounded-lg bg-[var(--primary)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            Copy snippet
          </button>
        }
      />
      <div className="p-8 space-y-6">
        {!adviserId ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Sign in to see your personalised embed snippet.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-2">
                iframe snippet
              </h2>
              <pre className="bg-[#0F2A4A] text-[#9DD2FF] text-xs p-4 rounded-xl overflow-x-auto whitespace-pre">
                {snippet}
              </pre>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-sm uppercase tracking-wide text-[var(--text-secondary)] font-semibold mb-2">
                Live preview
              </h2>
              <iframe
                src={widgetUrl}
                className="w-full h-[780px] rounded-xl border border-[var(--border)]"
                loading="lazy"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
