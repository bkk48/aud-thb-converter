import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const bust = Date.now();

  // Try 1: jsDelivr
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aud.json?cb=${bust}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data?.aud?.thb > 0) {
      return NextResponse.json(
        { rate: data.aud.thb, source: "jsDelivr", error: null },
        { headers: { "Cache-Control": "no-store, no-cache" } }
      );
    }
  } catch { /* next */ }

  // Try 2: Frankfurter
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=AUD&to=THB`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data?.rates?.THB > 0) {
      return NextResponse.json(
        { rate: data.rates.THB, source: "Frankfurter", error: null },
        { headers: { "Cache-Control": "no-store, no-cache" } }
      );
    }
  } catch { /* next */ }

  // Try 3: exchangerate-api
  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/AUD`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data?.rates?.THB > 0) {
      return NextResponse.json(
        { rate: data.rates.THB, source: "ExchangeRate-API", error: null },
        { headers: { "Cache-Control": "no-store, no-cache" } }
      );
    }
  } catch { /* all failed */ }

  return NextResponse.json(
    { rate: null, source: null, error: "ดึงอัตราไม่ได้" },
    { headers: { "Cache-Control": "no-store" } }
  );
}