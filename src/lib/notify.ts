import type { SupabaseClient } from "@supabase/supabase-js";

import type { NotificationType } from "@/types/database";

export interface NotifyParams {
  adviserId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Fire-and-forget notification insert. Never throws — a failed notification
 * should never block the action that triggered it.
 */
export async function notify(client: SupabaseClient, params: NotifyParams): Promise<void> {
  try {
    await client.from("notifications").insert({
      adviser_id: params.adviserId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
    });
  } catch (err) {
    console.error("[notify] Failed:", err);
  }
}
