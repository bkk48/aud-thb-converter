import { NextResponse } from "next/server";

const GOOGLE_FINANCE_URL = "https://www.google.com/finance/quote/AUD-THB";
const FALLBACK_API_URL =
  "https://api.exchangerate-api.com/v4/latest/AUD";

export const dynamic = "force-dynamic"; // Never cache — always fetch fresh rate

/**
 * Attempt to extract AUDTHB rate from Google Finance HTML.
 * Google Finance embeds the price in elements with class "YMlKec fxKbKc".
 * This is fragile (class names can change) — fallback is in place.
 */
async function fetchFromGoogleFinance(): Promise<number | null> {
  try {
    const res = await fetch(GOOGLE_FINANCE_URL, {
      headers: {
        // Mimic a real browser to avoid bot-detection blocks
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      // 8-second timeout via AbortSignal
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Strategy 1: JSON-LD or structured data in script tags
    // Google embeds AF_initDataCallback with the price
    const jsonMatch = html.match(/"(?:price|regularMarketPrice)":\s*([\d.]+)/);
    if (jsonMatch) {
      const rate = parseFloat(jsonMatch[1]);
      if (rate > 0 && rate < 10000) return rate;
    }

    // Strategy 2: Look for the price div class (YMlKec fxKbKc is common)
    const classMatch = html.match(/class="YMlKec fxKbKc"[^>]*>([\d,]+\.[\d]+)/);
    if (classMatch) {
      const rate = parseFloat(classMatch[1].replace(/,/g, ""));
      if (rate > 0 && rate < 10000) return rate;
    }

    // Strategy 3: Scan for the numeric pattern near "THB" in the HTML
    // Typical AUDTHB rate is in the range 20–35
    const ratePattern = html.match(/>(2[0-9]\.[0-9]{3,6}|3[0-5]\.[0-9]{3,6})</);
    if (ratePattern) {
      const rate = parseFloat(ratePattern[1]);
      if (rate > 0 && rate < 10000) return rate;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fallback: exchangerate-api.com (free tier, no key required, reliable)
 */
async function fetchFromFallbackApi(): Promise<number | null> {
  try {
    const res = await fetch(FALLBACK_API_URL, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.THB;
    if (typeof rate === "number" && rate > 0) return rate;
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  // 1. Try Google Finance first
  const googleRate = await fetchFromGoogleFinance();
  if (googleRate !== null) {
    return NextResponse.json({
      rate: googleRate,
      source: "Google Finance",
      sourceUrl: GOOGLE_FINANCE_URL,
      fetchedAt: new Date().toISOString(),
      error: null,
    });
  }

  // 2. Fallback to exchangerate-api.com
  const fallbackRate = await fetchFromFallbackApi();
  if (fallbackRate !== null) {
    return NextResponse.json({
      rate: fallbackRate,
      source: "exchangerate-api.com (fallback)",
      sourceUrl: GOOGLE_FINANCE_URL, // still link user to Google Finance
      fetchedAt: new Date().toISOString(),
      error: null,
    });
  }

  // 3. Both failed — return structured error so UI can show manual input
  return NextResponse.json(
    {
      rate: null,
      source: null,
      sourceUrl: GOOGLE_FINANCE_URL,
      fetchedAt: new Date().toISOString(),
      error:
        "ไม่สามารถดึงอัตราแลกเปลี่ยนอัตโนมัติได้ กรุณากรอกอัตราด้วยตนเอง",
    },
    { status: 200 } // Return 200 so UI handles gracefully instead of crashing
  );
}
