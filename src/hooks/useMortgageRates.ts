"use client";

import { useEffect, useState } from "react";

export interface MortgageRates {
  baseRate: number;
  twoYearFixed: number;
  fiveYearFixed: number;
  svr: number;
  trackerRate: number;
  asOf: string;
  isLive: boolean;
}

const FALLBACK: MortgageRates = {
  baseRate: 4.25,
  twoYearFixed: 5.83,
  fiveYearFixed: 5.37,
  svr: 7.99,
  trackerRate: 5.15,
  asOf: "Jun 2025",
  isLive: false,
};

export function useMortgageRates() {
  const [rates, setRates] = useState<MortgageRates>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((data: MortgageRates) => setRates(data))
      .catch(() => setRates(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return { rates, loading };
}
