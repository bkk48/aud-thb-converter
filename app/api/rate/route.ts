import { NextResponse } from "next/server";

const GOOGLE_FINANCE_URL = "https://www.google.com/finance/quote/AUD-THB";

export const dynamic = "force-dynamic";

interface RateResult {
  rate: number;
  source: string;
}

/**
 * Source 1: fawazahmed0 currency API — CDN hosted on jsDelivr, no key, very reliable
 */
async function fetchFromCDN(): Promise<RateResult | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aud.json",
      { signal: AbortSignal.timeout(6000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.aud?.thb;
    if (typeof rate === "number" && rate > 0) {
      return { rate, source: "jsDelivr CDN" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Source 2: fallback mirror of same API
 */
async function fetchFromCDNFallback(): Promise<RateResult | null> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${today}/v1/currencies/aud.json`,
      { signal: AbortSignal.timeout(6000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.aud?.thb;
    if (typeof rate === "number" && rate > 0) {
      return { rate, source: "jsDelivr CDN (dated)" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Source 3: Frankfurter — ECB data, free, no key
 */
async function fetchFromFrankfurter(): Promise<RateResult | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=AUD&to=THB",
      { signal: AbortSignal.timeout(6000), cache: "no-store" }
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

export async function GET() {
  // Try all sources in parallel
  const results = await Promise.allSettled([
    fetchFromCDN(),
    fetchFromCDNFallback(),
    fetchFromFrankfurter(),
  ]);

  for (const result of results) {
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

  return NextResponse.json({
    rate: null,
    source: null,
    sourceUrl: GOOGLE_FINANCE_URL,
    fetchedAt: new Date().toISOString(),
    error: "ไม่สามารถดึงอัตราแลกเปลี่ยนได้ กรุณากรอกอัตราด้วยตนเอง",
  });
}