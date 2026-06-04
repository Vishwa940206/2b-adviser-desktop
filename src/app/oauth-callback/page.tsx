"use client";

import { useEffect } from "react";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const expires_in = params.get("expires_in");

    if (access_token && window.opener) {
      window.opener.postMessage(
        { type: "gcal_token", access_token, expires_in },
        window.location.origin
      );
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-[var(--text-secondary)] text-sm">Connecting to Google Calendar…</p>
      </div>
    </div>
  );
}
