import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AI business coach for Agentic Advisor, a mortgage adviser platform.
Current performance snapshot (last 30 days):
- Leads: 18 (↑12% vs prior period)
- Pipeline: £425,000 across 22 active cases
- Conversion rate: 22% (industry avg 18%)
- Case mix: 55% mortgages, 23% investments, 14% insurance, 9% pensions
- Lead funnel: 18 new → 12 qualified → 7 assigned → 4 converted
- Peak lead days: Thursdays and Fridays
- Revenue trend: strong upward trajectory May–Jun
Give concise, direct, actionable advice in 2–3 sentences.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured." }, { status: 503 });
  }

  const { messages } = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.75,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: text.slice(0, 200) }, { status: res.status });
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ content });
}
