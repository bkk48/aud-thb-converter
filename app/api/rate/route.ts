import { NextResponse } from "next/server";

const GOOGLE_FINANCE_URL = "https://www.google.com/finance/quote/AUD-THB";

export const dynamic = "force-dynamic"; // Never cache — always fetch fresh rate

interface RateResult {
  rate: number;
  source: string;
}

/**
 * Source 1: open.er-api.com — free, no key, very reliable
 */
async function fetchFromOpenER(): Promise<RateResult | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/AUD", {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.THB;
    if (typeof rate === "number" && rate > 0) {
      return { rate, source: "open.er-api.com" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Source 2: Frankfurter API — ECB data, free, no key
 */
async function fetchFromFrankfurter(): Promise<RateResult | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=AUD&to=THB",
      {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.THB;
    if (typeof rate === "number" && rate > 0) {
      return { rate, source: "Frankfurter (ECB)" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Source 3: exchangerate-api.com — free tier, no key
 */
async function fetchFromExchangeRateApi(): Promise<RateResult | null> {
  try {
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/AUD",
      {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.THB;
    if (typeof rate === "number" && rate > 0) {
      return { rate, source: "exchangerate-api.com" };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  // Try all 3 sources in parallel for speed, use first success
  const [er, frankfurter, exchangeRate] = await Promise.allSettled([
    fetchFromOpenER(),
    fetchFromFrankfurter(),
    fetchFromExchangeRateApi(),
  ]);

  // Pick first successful result
  for (const result of [er, frankfurter, exchangeRate]) {
    if (result.status === "fulfilled" && result.value !== null) {
      return NextResponse.json({
        rate: result.value.rate,
        source: result.value.source,
        sourceUrl: GOOGLE_FINANCE_URL,
        fetchedAt: new Date().toISOString(),
        error: null,
      });
    }
  }

  // All failed
  return NextResponse.json({
    rate: null,
    source: null,
    sourceUrl: GOOGLE_FINANCE_URL,
    fetchedAt: new Date().toISOString(),
    error: "ไม่สามารถดึงอัตราแลกเปลี่ยนได้ กรุณากรอกอัตราด้วยตนเอง",
  });
}