import { NextRequest, NextResponse } from "next/server";

import { LENDERS, type Lender } from "@/data/lenders";
import { applyLiveMarketOffset, fetchLiveMarketRates } from "@/lib/liveLenderRates";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function getApiKey(): string | null {
  return process.env.OPENAI_API_KEY ?? process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? null;
}

const SYSTEM_PROMPT = `You are an expert UK mortgage criteria assistant embedded in a professional broker platform. You have comprehensive knowledge of the UK intermediary mortgage market and access to a database of 30 lenders.

Your goals:
1. Answer the broker's question accurately and professionally
2. Identify the best-matching lenders with specific reasoning
3. Highlight critical criteria points (max LTV, income multiples, credit requirements)
4. Flag potential pitfalls or underwriting challenges
5. Suggest intelligent follow-up questions

Return ONLY valid JSON:
{
  "answer": "<2-4 sentence professional answer. Mention the best 1-2 lenders by name. Reference specific criteria such as LTVs, income multiples, or employment acceptance>",
  "matchedLenders": [
    {
      "lenderId": "<exact id from knowledge base>",
      "relevance": "high" | "medium" | "low",
      "matchReason": "<1-2 sentences: the exact criteria that makes this lender suitable for this scenario>",
      "fitScore": <0-100>,
      "warnings": ["<specific underwriting watch-point>"]
    }
  ],
  "keyPoints": [
    "<actionable insight — e.g. specific income multiple, documentation requirement, or timing consideration>"
  ],
  "followUpSuggestions": [
    "<relevant follow-up question a broker might ask next>",
    "<another follow-up>",
    "<another follow-up>"
  ]
}

Strict rules:
- Only use lenderId values from the knowledge base. Never invent lenders.
- Order matchedLenders by fitScore descending. Include up to 8.
- Be specific: quote exact figures (e.g. "up to 5.5× LTI", "max 85% LTV", "satisfied CCJ over 3 years").
- If the scenario has no good lender matches, say so honestly and explain why.
- followUpSuggestions should feel natural — things a real broker would genuinely want to know next.`;

function buildPrompt(query: string, history: Array<{ q: string; a: string }>, pool: Lender[]): string {
  const historyBlock = history.length > 0
    ? `## Previous questions in this session\n${history.map((h) => `Q: ${h.q}\nA: ${h.a}`).join("\n\n")}\n\n`
    : "";

  return [
    historyBlock,
    `## Current broker question\n${query}`,
    "",
    "## Lender Knowledge Base (30 UK lenders)",
    JSON.stringify(
      pool.map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category,
        maxLTV: l.maxLTV,
        minIncome: l.minIncome,
        minCredit: l.minCredit,
        maxIncomeMultiple: l.maxIncomeMultiple,
        employment: l.employment,
        caseTypes: l.caseTypes,
        specialties: l.specialties,
        exclusions: l.exclusions,
        rate2yr: l.rate2yr,
        rate5yr: l.rate5yr,
        maxLoanSize: l.maxLoanSize,
        processingDays: l.processingDays,
        notes: l.notes,
      })),
      null,
      2
    ),
  ].filter(Boolean).join("\n");
}

function keywordFallback(query: string, pool: Lender[]): {
  answer: string;
  matchedLenders: { lender: Lender; relevance: "high" | "medium" | "low"; matchReason: string; fitScore: number; warnings: string[] }[];
  keyPoints: string[];
  followUpSuggestions: string[];
  source: "keyword";
} {
  const q = query.toLowerCase();

  const scored = pool.map((l) => {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if ((q.includes("contractor")) && l.employment.includes("contractor")) { score += 30; reasons.push(`Accepts contractor day-rate income (${l.maxIncomeMultiple}× max).`); }
    if ((q.includes("self employed") || q.includes("self-employed")) && l.employment.includes("self_employed")) { score += 30; reasons.push("Accepts self-employed applicants."); }
    if ((q.includes("ccj") || q.includes("default") || q.includes("adverse") || q.includes("bad credit")) && (l.minCredit === "fair" || l.minCredit === "thin")) { score += 35; reasons.push(`Accepts ${l.minCredit} credit profiles including adverse history.`); }
    if ((q.includes("btl") || q.includes("buy to let") || q.includes("buy-to-let")) && l.caseTypes.includes("buy_to_let")) { score += 30; reasons.push("Accepts buy-to-let cases."); }
    if ((q.includes("ftb") || q.includes("first time") || q.includes("first-time")) && l.caseTypes.includes("ftb")) { score += 25; reasons.push(`FTB accepted up to ${l.maxLTV}% LTV.`); }
    if (q.includes("hmo") && l.caseTypes.includes("hmo")) { score += 35; reasons.push("HMO specialist."); }
    if ((q.includes("ltd") || q.includes("limited company") || q.includes("spv")) && l.caseTypes.includes("limited_company_btl")) { score += 35; reasons.push("Limited company / SPV BTL accepted."); }
    if ((q.includes("equity release") || q.includes("lifetime")) && l.caseTypes.includes("equity_release")) { score += 40; reasons.push("Offers equity release / lifetime mortgage products."); }
    if (q.includes("remortgage") && l.caseTypes.includes("remortgage")) { score += 15; reasons.push("Accepts remortgage cases."); }
    if (q.includes("shared ownership") && l.caseTypes.includes("shared_ownership")) { score += 30; reasons.push("Shared ownership specialist."); }
    if ((q.includes("right to buy")) && l.caseTypes.includes("right_to_buy")) { score += 30; reasons.push("Right-to-buy accepted."); }
    if ((q.includes("95%") || q.includes("5% deposit")) && l.maxLTV >= 95) { score += 25; reasons.push(`Up to ${l.maxLTV}% LTV — suitable for low-deposit cases.`); }
    if ((q.includes("100%") || q.includes("no deposit")) && l.maxLTV >= 100) { score += 40; reasons.push(`${l.maxLTV}% LTV available.`); }
    if ((q.includes("director") || q.includes("dividend")) && l.employment.includes("company_director")) { score += 25; reasons.push("Company director / dividend income accepted."); }
    if ((q.includes("portfolio") || q.includes("multiple properties")) && l.specialties.some((s) => s.toLowerCase().includes("portfolio"))) { score += 20; reasons.push("Portfolio landlord specialist."); }
    if ((q.includes("1 year") || q.includes("one year")) && l.specialties.some((s) => s.toLowerCase().includes("1-year"))) { score += 25; reasons.push("Accepts self-employed with 1-year accounts."); }
    if ((q.includes("foreign") || q.includes("expat") || q.includes("non uk")) && l.specialties.some((s) => s.toLowerCase().includes("foreign"))) { score += 30; reasons.push("Accepts foreign nationals / non-UK residents."); }

    if (l.minCredit === "excellent" && q.includes("ccj")) { score -= 20; warnings.push("Requires clean credit — CCJ likely to decline."); }
    if (score < 0) score = 0;

    const reason = reasons[0] ?? `Potential match — see criteria for details.`;
    const relevance: "high" | "medium" | "low" = score >= 25 ? "high" : score >= 10 ? "medium" : "low";
    return { lender: l, score, relevance, matchReason: reason, fitScore: Math.min(score, 100), warnings };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    answer: scored.length > 0
      ? `Found ${scored.length} lenders potentially matching your query. ${scored[0] ? `${scored[0].lender.name} appears the strongest match — ${scored[0].matchReason}` : ""} Always verify live criteria directly.`
      : "No specific lenders matched — try a broader search or contact lenders directly.",
    matchedLenders: scored,
    keyPoints: [
      "Always verify criteria on your sourcing system before submission.",
      "Criteria can change — contact the lender BDM for complex cases.",
    ],
    followUpSuggestions: [
      "What income multiples are available?",
      "Which lenders are fastest to process?",
      "Any adverse credit-friendly options?",
    ],
    source: "keyword",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query, history = [] } = await req.json() as {
      query: string;
      history?: Array<{ q: string; a: string }>;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required." }, { status: 400 });
    }

    // Shift the static lender rate book to track the live BoE-quoted market
    // average — there's no free per-lender live feed.
    const liveRates = await fetchLiveMarketRates();
    const liveLenders = applyLiveMarketOffset(LENDERS, liveRates);
    const liveById = new Map(liveLenders.map((l) => [l.id, l]));

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ ...keywordFallback(query, liveLenders), source: "keyword", liveRates });
    }

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(query, history.slice(-3), liveLenders) },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ...keywordFallback(query, liveLenders), source: "keyword", aiError: `OpenAI ${res.status}`, liveRates });
    }

    const json = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as {
      answer: string;
      matchedLenders: {
        lenderId: string;
        relevance: "high" | "medium" | "low";
        matchReason: string;
        fitScore?: number;
        warnings?: string[];
      }[];
      keyPoints: string[];
      followUpSuggestions?: string[];
    };

    const matchedLenders = (parsed.matchedLenders ?? [])
      .map((r) => {
        const lender = liveById.get(r.lenderId);
        if (!lender) return null;
        return {
          lender,
          relevance: r.relevance,
          matchReason: r.matchReason,
          fitScore: r.fitScore ?? (r.relevance === "high" ? 85 : r.relevance === "medium" ? 60 : 35),
          warnings: r.warnings ?? [],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return NextResponse.json({
      answer: parsed.answer,
      matchedLenders,
      keyPoints: parsed.keyPoints ?? [],
      followUpSuggestions: parsed.followUpSuggestions ?? [],
      source: "ai",
      liveRates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
