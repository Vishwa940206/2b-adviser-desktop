import type { Lender } from "@/data/lenders";

export interface LiveMarketRates {
  baseRate: number;
  twoYearFixed: number;
  fiveYearFixed: number;
  asOf: string;
  isLive: boolean;
}

/** Server-side fetch of the live BoE-quoted market rates, cached 1hr. */
export async function fetchLiveMarketRates(): Promise<LiveMarketRates | null> {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${origin}/api/rates`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json() as LiveMarketRates;
  } catch {
    return null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Shifts every lender's rate2yr/rate5yr/indicativeRate by the same offset so
 * the table tracks today's live BoE-quoted market average, while preserving
 * each lender's relative spread (risk pricing) from the static baseline.
 * There's no free per-lender live feed — this is the closest honest
 * approximation without a paid sourcing API (Twenty7Tec/Iress/etc).
 */
export function applyLiveMarketOffset<T extends Pick<Lender, "rate2yr" | "rate5yr" | "indicativeRate">>(
  lenders: T[],
  live: Pick<LiveMarketRates, "twoYearFixed" | "fiveYearFixed" | "isLive"> | null
): T[] {
  if (!live || !live.isLive || lenders.length === 0) return lenders;

  const avg2yr = lenders.reduce((s, l) => s + l.rate2yr, 0) / lenders.length;
  const avg5yr = lenders.reduce((s, l) => s + l.rate5yr, 0) / lenders.length;
  const offset2yr = live.twoYearFixed - avg2yr;
  const offset5yr = live.fiveYearFixed - avg5yr;

  return lenders.map((l) => ({
    ...l,
    rate2yr: round2(l.rate2yr + offset2yr),
    rate5yr: round2(l.rate5yr + offset5yr),
    indicativeRate: round2(l.indicativeRate + (offset2yr + offset5yr) / 2),
  }));
}
