import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 8;

async function tryFetch(url: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    return res.ok ? res : null;
  } catch { return null; }
}

export async function GET() {
  const bust = Date.now();

  // Source 1
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aud.json?cb=${bust}`,
      { signal: controller.signal, cache: "no-store" }
    );
    if (res.ok) {
      const d = await res.json();
      if (d?.aud?.thb > 0) return NextResponse.json({ rate: d.aud.thb, source: "jsDelivr", error: null },
        { headers: { "Cache-Control": "no-store" } });
    }
  } catch { /* next */ }

  // Source 2
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=AUD&to=THB",
      { signal: controller.signal, cache: "no-store" }
    );
    if (res.ok) {
      const d = await res.json();
      if (d?.rates?.THB > 0) return NextResponse.json({ rate: d.rates.THB, source: "Frankfurter", error: null },
        { headers: { "Cache-Control": "no-store" } });
    }
  } catch { /* next */ }

  // Source 3
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/AUD",
      { signal: controller.signal, cache: "no-store" }
    );
    if (res.ok) {
      const d = await res.json();
      if (d?.rates?.THB > 0) return NextResponse.json({ rate: d.rates.THB, source: "ExchangeRate-API", error: null },
        { headers: { "Cache-Control": "no-store" } });
    }
  } catch { /* all failed */ }

  return NextResponse.json({ rate: null, source: null, error: "ดึงอัตราไม่ได้" },
    { headers: { "Cache-Control": "no-store" } });
}