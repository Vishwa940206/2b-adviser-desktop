"use client";

import { useState } from "react";

import { LENDERS, lenderById, type Lender } from "@/data/lenders";
import { chatJSON, isOpenAIConfigured } from "@/lib/openai";
import type { Client } from "@/types/database";

export interface LenderRecommendation {
  lenderId: string;
  lender: Lender;
  fitScore: number;
  reasoning: string;
  warnings: string[];
}

export interface LenderSuggestionResult {
  recommendations: LenderRecommendation[];
  summary: string;
  source: "openai" | "heuristic";
}

export interface ApplicationSnapshot {
  client: Client | null;
  income: number | null;
  loanAmount: number | null;
  propertyValue: number | null;
  employment: string | null;
  creditNotes: string | null;
  intent: string | null;
}

const SYSTEM_PROMPT = `You are a UK mortgage adviser's lender-matching assistant.
Given a client application and a knowledge base of lenders, return the top
three lenders that fit the application best. For each, score 0-100 (fitScore),
explain in 1-2 sentences why they fit, and list any warnings (criteria the
client doesn't yet meet). Reply ONLY as JSON matching this shape:
{
  "summary": "one-line overall recommendation",
  "recommendations": [
    {"lenderId": "<id from KB>", "fitScore": 0-100, "reasoning": "...", "warnings": ["..."]}
  ]
}
Use lenderId values exactly as provided. Do not invent lenders.`;

function buildUserPrompt(s: ApplicationSnapshot): string {
  const ltv =
    s.loanAmount && s.propertyValue
      ? Math.round((s.loanAmount / s.propertyValue) * 100)
      : null;
  return [
    "## Client application",
    `Name: ${s.client?.full_name ?? "(unknown)"}`,
    `Risk profile: ${s.client?.risk_profile ?? "n/a"}`,
    `Annual income: ${s.income ? `£${s.income.toLocaleString()}` : "unknown"}`,
    `Loan amount: ${s.loanAmount ? `£${s.loanAmount.toLocaleString()}` : "unknown"}`,
    `Property value: ${s.propertyValue ? `£${s.propertyValue.toLocaleString()}` : "unknown"}`,
    `LTV: ${ltv != null ? `${ltv}%` : "unknown"}`,
    `Employment: ${s.employment ?? "unknown"}`,
    `Credit notes: ${s.creditNotes ?? "none disclosed"}`,
    `Intent: ${s.intent ?? "unspecified"}`,
    "",
    "## Lender knowledge base",
    JSON.stringify(LENDERS),
  ].join("\n");
}

interface OpenAIShape {
  summary: string;
  recommendations: {
    lenderId: string;
    fitScore: number;
    reasoning: string;
    warnings?: string[];
  }[];
}

function heuristicMatch(s: ApplicationSnapshot): LenderSuggestionResult {
  const income = s.income ?? 0;
  const ltv =
    s.loanAmount && s.propertyValue ? (s.loanAmount / s.propertyValue) * 100 : null;

  const ranked = LENDERS.map((lender) => {
    let score = 50;
    const warnings: string[] = [];
    if (income >= lender.minIncome) score += 15;
    else {
      score -= 20;
      warnings.push(`Income below £${lender.minIncome.toLocaleString()} minimum.`);
    }
    if (ltv != null) {
      if (ltv <= lender.maxLTV) score += 15;
      else {
        score -= 25;
        warnings.push(`LTV ${ltv.toFixed(0)}% exceeds ${lender.maxLTV}% cap.`);
      }
    }
    if (
      s.employment &&
      lender.employment.some((e) => s.employment!.toLowerCase().includes(e.replace("_", " ")))
    ) {
      score += 10;
    }
    return {
      lenderId: lender.id,
      lender,
      fitScore: Math.max(0, Math.min(100, score)),
      reasoning: `${lender.name} fits on income (£${lender.minIncome.toLocaleString()} min, ${lender.maxIncomeMultiple}× LTI) and ${lender.specialties[0]}.`,
      warnings,
    };
  })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 3);

  return {
    recommendations: ranked,
    summary: "Heuristic match (OpenAI key not configured). Top 3 by KB criteria.",
    source: "heuristic",
  };
}

export function useLenderSuggestion() {
  const [data, setData] = useState<LenderSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (snapshot: ApplicationSnapshot) => {
    setLoading(true);
    setError(null);
    try {
      if (!isOpenAIConfigured()) {
        setData(heuristicMatch(snapshot));
        return;
      }
      const result = await chatJSON<OpenAIShape>([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(snapshot) },
      ]);
      const recs: LenderRecommendation[] = (result.recommendations ?? [])
        .map((r) => {
          const lender = lenderById(r.lenderId);
          if (!lender) return null;
          return {
            lenderId: r.lenderId,
            lender,
            fitScore: r.fitScore,
            reasoning: r.reasoning,
            warnings: r.warnings ?? [],
          };
        })
        .filter((r): r is LenderRecommendation => r !== null)
        .slice(0, 3);
      setData({ recommendations: recs, summary: result.summary, source: "openai" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, run, reset: () => setData(null) };
}
