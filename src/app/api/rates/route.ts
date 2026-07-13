import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { notify } from "@/lib/notify";

const FALLBACK = {
  baseRate: 4.25,
  twoYearFixed: 5.83,
  fiveYearFixed: 5.37,
  svr: 7.99,
  trackerRate: 5.15,
  asOf: "Jun 2025",
  isLive: false,
};

// BoE IADB base URL
const BOE_BASE =
  "https://www.bankofengland.co.uk/boeapps/database/_iadb-FromShowColumns.asp?csv.x=yes&Datefrom=01/Jan/2025&Dateto=now&CSVF=TN&UsingCodes=Y";

function boeUrl(series: string) {
  return `${BOE_BASE}&SeriesCodes=${series}`;
}

async function fetchSingleSeries(series: string): Promise<{ value: number; dateStr: string } | null> {
  try {
    const res = await fetch(boeUrl(series), {
      headers: { Accept: "text/csv" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith("DATE"));
    if (lines.length === 0) return null;
    const last = lines[lines.length - 1];
    const [dateStr, rateStr] = last.split(",");
    const value = parseFloat(rateStr?.trim() ?? "");
    if (isNaN(value) || value <= 0) return null;
    return { value, dateStr: dateStr?.trim() ?? "" };
  } catch {
    return null;
  }
}

async function fetchMultiSeries(
  seriesCodes: string[]
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  seriesCodes.forEach((c) => (result[c] = null));

  try {
    const res = await fetch(boeUrl(seriesCodes.join(",")), {
      headers: { Accept: "text/csv" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return result;

    const text = await res.text();
    const lines = text
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const headerLine = lines.find((l) => l.toUpperCase().startsWith("DATE"));
    if (!headerLine) return result;

    const headers = headerLine.split(",").map((h) => h.trim());
    const dataLines = lines.filter((l) => !l.toUpperCase().startsWith("DATE"));
    if (dataLines.length === 0) return result;

    // Walk backwards to find the last row with actual data for each series
    const pending = new Set(seriesCodes);
    for (let i = dataLines.length - 1; i >= 0 && pending.size > 0; i--) {
      const cols = dataLines[i].split(",").map((c) => c.trim());
      for (const code of [...pending]) {
        const idx = headers.indexOf(code);
        if (idx < 0 || idx >= cols.length) continue;
        const v = parseFloat(cols[idx]);
        if (!isNaN(v) && v > 0) {
          result[code] = v;
          pending.delete(code);
        }
      }
    }
  } catch {
    // return whatever we have
  }

  return result;
}

async function broadcastRateChange(newBase: number): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return; // optional — silently skip if not configured

  try {
    const admin = createClient(url, serviceKey);
    const { data: state } = await admin.from("rate_state").select("base_rate").eq("id", 1).maybeSingle();
    const previous = state?.base_rate as number | null | undefined;

    if (previous != null && previous !== newBase) {
      const { data: advisers } = await admin.from("profiles").select("id");
      const direction = newBase > previous ? "risen" : "fallen";
      await Promise.all(
        (advisers ?? []).map((a) =>
          notify(admin, {
            adviserId: a.id,
            type: "rate_change",
            title: `BoE base rate has ${direction} to ${newBase}%`,
            body: `Previously ${previous}%`,
            link: "/dashboard",
          })
        )
      );
    }

    if (previous !== newBase) {
      await admin.from("rate_state").update({ base_rate: newBase, updated_at: new Date().toISOString() }).eq("id", 1);
    }
  } catch (err) {
    console.error("[rates] broadcastRateChange failed:", err);
  }
}

export async function GET() {
  try {
    // Fetch BoE base rate (daily, instantly updated) + quoted mortgage rates (monthly) in parallel
    // BoE quoted household mortgage rates (75% LTV, new business):
    //   IUMBV42 = 2yr fixed  |  IUMBV45 = 5yr fixed  |  IUMBV34 = standard variable rate
    const [baseResult, quotedRates] = await Promise.all([
      fetchSingleSeries("IUMABEDR"),
      fetchMultiSeries(["IUMBV42", "IUMBV45", "IUMBV34"]),
    ]);

    if (!baseResult) return NextResponse.json(FALLBACK);

    const { value: base, dateStr } = baseResult;

    // Use real BoE quoted rates where available, fall back to spread-derived estimates
    const twoYearFixed =
      quotedRates["IUMBV42"] ?? Math.round((base + 1.58) * 100) / 100;
    const fiveYearFixed =
      quotedRates["IUMBV45"] ?? Math.round((base + 1.12) * 100) / 100;
    const svr =
      quotedRates["IUMBV34"] ?? Math.round((base + 3.74) * 100) / 100;
    const trackerRate = Math.round((base + 0.9) * 100) / 100; // BoE doesn't publish a tracker series

    const hasRealRates =
      quotedRates["IUMBV42"] !== null || quotedRates["IUMBV45"] !== null;

    // Fire-and-forget — never block the response on the notification check
    broadcastRateChange(base);

    return NextResponse.json({
      baseRate: base,
      twoYearFixed,
      fiveYearFixed,
      svr,
      trackerRate,
      asOf: dateStr,
      isLive: true,
      // Surface whether we got real market data or spread estimates
      quotedRatesSource: hasRealRates ? "boe_quoted" : "derived",
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
