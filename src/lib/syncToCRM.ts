// CRM base URL — override in .env.local when deploying.
// In dev, the CRM runs on :3001 while this app runs on :3000.
const CRM_URL =
  process.env.NEXT_PUBLIC_CRM_SYNC_URL ?? "http://localhost:3001/api/sync/advisor";

const CRM_SECRET =
  process.env.NEXT_PUBLIC_CRM_SYNC_SECRET ?? "mortgagecrm-sync-2026";

export interface AdvisorSyncPayload {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  avatar_url?: string | null;
}

/**
 * Fire-and-forget push of an advisor profile to MortgageCRM.
 * Never throws, never blocks the caller.
 */
export async function syncAdvisorToCRM(advisor: AdvisorSyncPayload): Promise<void> {
  if (!advisor.email) return;
  try {
    await fetch(CRM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CRM_SECRET}`,
      },
      body: JSON.stringify(advisor),
    });
  } catch (err) {
    console.error("[syncToCRM] Failed:", err);
  }
}
