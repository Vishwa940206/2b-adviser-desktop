import { NextRequest, NextResponse } from "next/server";

import { LENDERS, lenderById, lendersByCaseType, type CaseType } from "@/data/lenders";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Accepts OPENAI_API_KEY (preferred, server-only) or falls back to NEXT_PUBLIC_OPENAI_API_KEY
function getApiKey(): string | null {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    null
  );
}

const SYSTEM_PROMPT = `You are a specialist UK mortgage adviser's lender-matching assistant with deep knowledge of the UK intermediary mortgage market as of 2026.

Your task: given a client application snapshot and a lender knowledge base, identify the THREE best-fit lenders and explain exactly why they match — or why the case may face challenges.

Return ONLY valid JSON matching this exact shape:
{
  "summary": "one concise paragraph overall recommendation for the adviser",
  "recommendations": [
    {
      "lenderId": "<id from knowledge base>",
      "fitScore": <0-100>,
      "reasoning": "<2-3 sentences: why this lender fits this specific case>",
      "indicativeRate": "<e.g. 2yr fixed ~4.05% / 5yr fixed ~3.89%>",
      "warnings": ["<specific concern or condition the client must meet>"]
    }
  ]
}

Scoring guidance:
- 90-100: Excellent fit — lender is a natural choice, no significant issues
- 70-89: Good fit — minor concerns but should be acceptable
- 50-69: Possible — lender could work but there are notable risks
- Below 50: Not recommended — include only if no better options exist

Use lenderId values EXACTLY as provided in the knowledge base. Do not invent lenders.
Consider case type above all else — never recommend a residential lender for a BTL case and vice versa.
Factor in LTV, income multiple, employment type, credit history, and case type simultaneously.`;

function buildPrompt(snapshot: {
  income: number | null;
  loanAmount: number | null;
  propertyValue: number | null;
  employment: string | null;
  creditNotes: string | null;
  intent: string | null;
  caseType: string | null;
  isFirstTimeBuyer: boolean;
  propertyType: string | null;
  clientName?: string | null;
  clientRiskProfile?: string | null;
}): string {
  const ltv =
    snapshot.loanAmount && snapshot.propertyValue
      ? Math.round((snapshot.loanAmount / snapshot.propertyValue) * 100)
      : null;

  const lti =
    snapshot.income && snapshot.loanAmount
      ? (snapshot.loanAmount / snapshot.income).toFixed(2)
      : null;

  const caseType = snapshot.caseType as CaseType | null;
  const relevantLenders = caseType
    ? lendersByCaseType(caseType)
    : LENDERS;

  return [
    "## Application Snapshot",
    snapshot.clientName ? `Client: ${snapshot.clientName}` : "",
    `Case type: ${snapshot.caseType ?? "residential purchase"}`,
    `First-time buyer: ${snapshot.isFirstTimeBuyer ? "Yes" : "No"}`,
    `Annual income: ${snapshot.income ? `£${snapshot.income.toLocaleString()}` : "not stated"}`,
    `Loan amount: £${snapshot.loanAmount?.toLocaleString() ?? "not stated"}`,
    `Property value: £${snapshot.propertyValue?.toLocaleString() ?? "not stated"}`,
    `LTV: ${ltv != null ? `${ltv}%` : "unknown"}`,
    `Income multiple (LTI): ${lti ?? "unknown"}×`,
    `Employment: ${snapshot.employment ?? "not stated"}`,
    `Property type: ${snapshot.propertyType ?? "standard residential"}`,
    `Credit notes: ${snapshot.creditNotes || "clean — no adverse disclosed"}`,
    `Intent / notes: ${snapshot.intent || "none"}`,
    snapshot.clientRiskProfile ? `Client risk profile: ${snapshot.clientRiskProfile}` : "",
    "",
    "## Lender Knowledge Base (relevant to this case type)",
    JSON.stringify(relevantLenders, null, 2),
  ]
    .filter(Boolean)
    .join("\n");
}

function heuristicMatch(snapshot: Parameters<typeof buildPrompt>[0]) {
  const income = snapshot.income ?? 0;
  const ltv =
    snapshot.loanAmount && snapshot.propertyValue
      ? (snapshot.loanAmount / snapshot.propertyValue) * 100
      : null;

  const caseType = snapshot.caseType as CaseType | null;
  const pool = caseType ? lendersByCaseType(caseType) : LENDERS;

  const ranked = pool
    .map((lender) => {
      let score = 50;
      const warnings: string[] = [];

      if (income >= lender.minIncome) score += 15;
      else { score -= 20; warnings.push(`Income below £${lender.minIncome.toLocaleString()} minimum.`); }

      if (ltv != null) {
        if (ltv <= lender.maxLTV) score += 15;
        else { score -= 30; warnings.push(`LTV ${ltv.toFixed(0)}% exceeds ${lender.maxLTV}% cap.`); }
      }

      const emp = (snapshot.employment ?? "").toLowerCase().replace("-", "_");
      if (lender.employment.some((e) => emp.includes(e.replace("_", " ")) || emp.includes(e))) {
        score += 10;
      } else {
        warnings.push(`Employment type may not be accepted — verify with lender.`);
      }

      const lti = income > 0 && snapshot.loanAmount ? snapshot.loanAmount / income : null;
      if (lti && lti > lender.maxIncomeMultiple) {
        score -= 20;
        warnings.push(`Income multiple ${lti.toFixed(2)}× exceeds ${lender.maxIncomeMultiple}× limit.`);
      }

      if (snapshot.creditNotes && snapshot.creditNotes.toLowerCase() !== "clean" && lender.minCredit === "excellent") {
        score -= 15;
        warnings.push("Lender requires clean credit — verify adverse history is acceptable.");
      }

      return {
        lenderId: lender.id,
        lender,
        fitScore: Math.max(0, Math.min(100, score)),
        reasoning: `${lender.name} accepts ${lender.employment.join("/")} employment, up to ${lender.maxLTV}% LTV and ${lender.maxIncomeMultiple}× LTI. Specialises in: ${lender.specialties[0]}.`,
        indicativeRate: `2yr fixed ~${lender.rate2yr}% / 5yr fixed ~${lender.rate5yr}%`,
        warnings,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  return {
    recommendations: ranked,
    summary: `Heuristic match (OpenAI not configured). Top ${ranked.length} lenders ranked by KB criteria for ${snapshot.caseType ?? "residential"} case.`,
    source: "heuristic" as const,
  };
}

export async function POST(req: NextRequest) {
  try {
    const snapshot = await req.json();
    const apiKey = getApiKey();

    if (!apiKey) {
      const result = heuristicMatch(snapshot);
      return NextResponse.json({ ...result, source: "heuristic" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(snapshot) },
    ];

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Fall back to heuristic on API error
      const result = heuristicMatch(snapshot);
      return NextResponse.json({ ...result, aiError: `OpenAI error ${res.status}: ${text.slice(0, 200)}` });
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(heuristicMatch(snapshot));
    }

    const parsed = JSON.parse(content) as {
      summary: string;
      recommendations: {
        lenderId: string;
        fitScore: number;
        reasoning: string;
        indicativeRate?: string;
        warnings?: string[];
      }[];
    };

    const recommendations = (parsed.recommendations ?? [])
      .map((r) => {
        const lender = lenderById(r.lenderId);
        if (!lender) return null;
        return {
          lenderId: r.lenderId,
          lender,
          fitScore: r.fitScore,
          reasoning: r.reasoning,
          indicativeRate: r.indicativeRate ?? `2yr ~${lender.rate2yr}% / 5yr ~${lender.rate5yr}%`,
          warnings: r.warnings ?? [],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .slice(0, 3);

    return NextResponse.json({
      recommendations,
      summary: parsed.summary,
      source: "openai",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
