import { NextResponse } from "next/server";

const FALLBACK = {
  baseRate: 4.25,
  twoYearFixed: 5.83,
  fiveYearFixed: 5.37,
  svr: 7.99,
  trackerRate: 5.15,
  asOf: "Jun 2025",
  isLive: false,
};

function deriveRates(baseRate: number, asOf: string) {
  return {
    baseRate,
    twoYearFixed: Math.round((baseRate + 1.58) * 100) / 100,
    fiveYearFixed: Math.round((baseRate + 1.12) * 100) / 100,
    svr: Math.round((baseRate + 3.74) * 100) / 100,
    trackerRate: Math.round((baseRate + 0.9) * 100) / 100,
    asOf,
    isLive: true,
  };
}

export async function GET() {
  try {
    const url =
      "https://www.bankofengland.co.uk/boeapps/database/_iadb-FromShowColumns.asp?csv.x=yes&Datefrom=01/Jan/2025&Dateto=now&SeriesCodes=IUMABEDR&CSVF=TN&UsingCodes=Y";

    const res = await fetch(url, {
      headers: { Accept: "text/csv" },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) throw new Error("BoE fetch failed");

    const text = await res.text();
    const lines = text
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith("DATE"));

    if (lines.length === 0) throw new Error("No data rows");

    const last = lines[lines.length - 1];
    const [dateStr, rateStr] = last.split(",");
    const rate = parseFloat(rateStr?.trim() ?? "");

    if (isNaN(rate)) throw new Error("Parse error");

    return NextResponse.json(deriveRates(rate, dateStr?.trim() ?? ""));
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
