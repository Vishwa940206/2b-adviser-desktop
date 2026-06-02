/**
 * OpenAI chat completion wrapper, mirrors the mobile app's lib/openai.ts.
 * SAME PRODUCTION WARNING: NEXT_PUBLIC_* keys are bundled into client code
 * and visible to anyone with the app. Move into a Next.js API route or
 * Supabase Edge Function before going live.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "OpenAIError";
  }
}

function getApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  return key && key.length > 0 ? key : null;
}

export function isOpenAIConfigured(): boolean {
  return getApiKey() !== null;
}

export async function chatText(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new OpenAIError("OpenAI API key not configured.");
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      temperature: options?.temperature ?? 0.75,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenAIError(`OpenAI request failed (${res.status}): ${text.slice(0, 240)}`, res.status);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new OpenAIError("OpenAI returned an empty response.");
  return content;
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number }
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new OpenAIError(
      "OpenAI API key is not configured. Add NEXT_PUBLIC_OPENAI_API_KEY to .env.local."
    );
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      temperature: options?.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenAIError(
      `OpenAI request failed (${res.status}): ${text.slice(0, 240)}`,
      res.status
    );
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new OpenAIError("OpenAI returned an empty response.");

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new OpenAIError("OpenAI returned non-JSON content.");
  }
}
