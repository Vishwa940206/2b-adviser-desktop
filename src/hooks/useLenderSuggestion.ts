"use client";

import { useState } from "react";

import type { Lender } from "@/data/lenders";
import type { Client } from "@/types/database";

export interface LenderRecommendation {
  lenderId: string;
  lender: Lender;
  fitScore: number;
  reasoning: string;
  indicativeRate: string;
  warnings: string[];
}

export interface LiveRates {
  baseRate: number;
  twoYearFixed: number;
  fiveYearFixed: number;
  asOf: string;
  isLive: boolean;
}

export interface LenderSuggestionResult {
  recommendations: LenderRecommendation[];
  summary: string;
  source: "openai" | "heuristic";
  aiError?: string;
  liveRates?: LiveRates | null;
}

export interface ApplicationSnapshot {
  client: Client | null;
  income: number | null;
  loanAmount: number | null;
  propertyValue: number | null;
  employment: string | null;
  creditNotes: string | null;
  intent: string | null;
  caseType: string | null;
  isFirstTimeBuyer: boolean;
  propertyType: string | null;
}

export function useLenderSuggestion() {
  const [data, setData] = useState<LenderSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (snapshot: ApplicationSnapshot) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lender-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: snapshot.income,
          loanAmount: snapshot.loanAmount,
          propertyValue: snapshot.propertyValue,
          employment: snapshot.employment,
          creditNotes: snapshot.creditNotes,
          intent: snapshot.intent,
          caseType: snapshot.caseType,
          isFirstTimeBuyer: snapshot.isFirstTimeBuyer,
          propertyType: snapshot.propertyType,
          clientName: snapshot.client?.full_name ?? null,
          clientRiskProfile: snapshot.client?.risk_profile ?? null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? `Server error ${res.status}`);
      }

      const result = await res.json() as LenderSuggestionResult;
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, run, reset: () => setData(null) };
}
