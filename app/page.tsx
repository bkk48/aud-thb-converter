"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface RateData {
  rate: number | null;
  source: string | null;
  fetchedAt: string;
  error: string | null;
}

const fmt = (n: number, decimals: number) =>
  n.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const formatTime = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Bangkok",
    }).format(new Date(iso));
  } catch { return iso; }
};

/** Fetch AUDTHB rate directly from browser — no server cache issues */
async function fetchRateDirectly(): Promise<RateData> {
  const now = new Date().toISOString();
  const bust = Date.now();

  // Source 1: fawazahmed0 CDN
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/aud.json?cb=${bust}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.aud?.thb;
      if (typeof rate === "number" && rate > 0) {
        return { rate, source: "jsDelivr CDN", fetchedAt: now, error: null };
      }
    }
  } catch { /* try next */ }

  // Source 2: Frankfurter ECB
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=AUD&to=THB&_=${bust}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.THB;
      if (typeof rate === "number" && rate > 0) {
        return { rate, source: "Frankfurter (ECB)", fetchedAt: now, error: null };
      }
    }
  } catch { /* try next */ }

  // Source 3: exchangerate-api
  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/AUD`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.THB;
      if (typeof rate === "number" && rate > 0) {
        return { rate, source: "ExchangeRate-API", fetchedAt: now, error: null };
      }
    }
  } catch { /* all failed */ }

  return {
    rate: null, source: null, fetchedAt: now,
    error: "ไม่สามารถดึงอัตราแลกเปลี่ยนได้ กรุณากรอกอัตราด้วยตนเอง",
  };
}

export default function ConverterPage() {
  const [aud, setAud] = useState<string>("1000");
  const [fee, setFee] = useState<string>("1.5");
  const [manualRate, setManualRate] = useState<string>("");
  const [rateData, setRateData] = useState<RateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const fetchRef = useRef(false);

  const fetchRate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchRateDirectly();
      setRateData(data);
      if (data.rate !== null) setManualRate("");
    } catch {
      setRateData({
        rate: null, source: null,
        fetchedAt: new Date().toISOString(),
        error: "เชื่อมต่อไม่ได้ กรุณากรอกอัตราด้วยตนเอง",
      });
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, [loading]);

  useEffect(() => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    fetchRate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const audNum = parseFloat(aud) || 0;
  const feeNum = parseFloat(fee) || 0;
  const activeRate =
    rateData?.rate !== null && rateData?.rate !== undefined
      ? rateData.rate
      : parseFloat(manualRate) || null;
  const netAud = audNum * (1 - feeNum / 100);
  const thb = activeRate !== null ? netAud * activeRate : null;
  const audValid = audNum >= 0 && !isNaN(audNum);
  const feeValid = feeNum >= 0 && !isNaN(feeNum);
  const feeHighWarning = feeNum > 10;
  const GOOGLE_FINANCE_URL = "https://www.google.com/finance/quote/AUD-THB";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1f1c14 0%, #0f0e0c 70%)" }}>

      <div className="w-full max-w-md mb-8 text-center">
        <p className="mono text-xs tracking-[0.3em] uppercase mb-2"
          style={{ color: "var(--gold)", opacity: 0.7 }}>Currency Converter</p>
        <h1 className="text-4xl font-extrabold tracking-tight leading-none"
          style={{ fontFamily: "var(--font-display)" }}>
          <span style={{ color: "var(--gold-light)" }}>AUD</span>
          <span className="mx-3 font-light opacity-30">→</span>
          <span className="text-white">THB</span>
        </h1>
      </div>

      <div className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: "var(--dark-2)", borderColor: "var(--border)",
          boxShadow: "0 0 60px rgba(201,168,76,0.06)" }}>

        {/* Rate banner */}
        <div className="px-6 pt-6 pb-5"
          style={{ background: "var(--dark-3)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mono text-[10px] tracking-widest uppercase opacity-50 mb-1">
                อัตราแลกเปลี่ยน · 1 AUD =
              </p>
              {firstLoad ? (
                <div className="h-8 w-40 rounded animate-pulse"
                  style={{ background: "rgba(201,168,76,0.1)" }} />
              ) : activeRate !== null ? (
                <p className="text-3xl font-bold rate-glow"
                  style={{ color: "var(--gold-light)", fontFamily: "var(--font-mono)" }}>
                  {fmt(activeRate, 4)}{" "}
                  <span className="text-lg font-normal opacity-60">THB</span>
                </p>
              ) : (
                <p className="text-xl font-semibold" style={{ color: "#e05d5d" }}>ไม่พบอัตรา</p>
              )}
              {rateData && (
                <p className="mono text-[10px] opacity-40 mt-1">
                  {rateData.source ? `via ${rateData.source}` : ""}
                  {rateData.fetchedAt && !rateData.error
                    ? ` · ${formatTime(rateData.fetchedAt)} ICT` : ""}
                </p>
              )}
            </div>

            <button onClick={fetchRate} disabled={loading} title="Refresh rate"
              className="flex-shrink-0 mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                color: "var(--gold-light)", opacity: loading ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer" }}>
              <svg className={loading ? "spinning" : ""} width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
              {loading ? "กำลังดึง..." : "Refresh"}
            </button>
          </div>

          <a href={GOOGLE_FINANCE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] underline-offset-2 hover:underline transition-opacity"
            style={{ color: "var(--gold)", opacity: 0.6 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            เปิด Google Finance AUDTHB
          </a>
        </div>

        {/* Manual rate input on error */}
        {rateData?.error && (
          <div className="mx-6 mt-5 rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(224,93,93,0.08)", border: "1px solid rgba(224,93,93,0.2)" }}>
            <p className="font-semibold mb-2" style={{ color: "#e07070" }}>⚠ {rateData.error}</p>
            <label className="block text-xs opacity-60 mb-1">กรอกอัตราแลกเปลี่ยนเอง (THB ต่อ 1 AUD)</label>
            <input type="number" min="0" step="0.0001" placeholder="เช่น 23.50"
              value={manualRate} onChange={(e) => setManualRate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm mono outline-none border"
              style={{ background: "var(--dark)",
                borderColor: manualRate ? "var(--gold)" : "rgba(255,255,255,0.15)", color: "#f0ede6" }} />
          </div>
        )}

        {/* Inputs */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-2 mono">
              จำนวนเงิน (AUD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm"
                style={{ color: "var(--gold-light)" }}>A$</span>
              <input type="number" min="0" step="0.01" value={aud}
                onChange={(e) => setAud(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-lg mono font-medium outline-none border transition-colors"
                style={{ background: "var(--dark)",
                  borderColor: audValid ? "rgba(201,168,76,0.3)" : "rgba(224,93,93,0.5)", color: "#f0ede6" }}
                placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-2 mono">
              ค่าธรรมเนียม / Fee (%)
            </label>
            <div className="relative">
              <input type="number" min="0" step="0.01" value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl text-lg mono font-medium outline-none border transition-colors"
                style={{ background: "var(--dark)",
                  borderColor: feeHighWarning ? "rgba(224,155,50,0.6)" : feeValid ? "rgba(201,168,76,0.3)" : "rgba(224,93,93,0.5)",
                  color: "#f0ede6" }}
                placeholder="0.00" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 mono text-sm">%</span>
            </div>
            {feeHighWarning && (
              <p className="text-xs mt-1 font-medium" style={{ color: "#e09b32" }}>
                ⚠ Fee สูงกว่า 10% — โปรดตรวจสอบ
              </p>
            )}
          </div>
        </div>

        <div className="divider mx-6" />

        {/* Results */}
        <div className="px-6 py-5 fade-up">
          <p className="mono text-[10px] tracking-widest uppercase opacity-40 mb-4">ผลการคำนวณ</p>
          <div className="space-y-3">
            <ResultRow label="จำนวนเงินตั้งต้น" value={audValid ? `A$ ${fmt(audNum, 2)}` : "—"} />
            <ResultRow label={`Fee ${feeValid && feeNum > 0 ? fmt(feeNum, 2) + "%" : "0%"}`}
              value={audValid && feeValid && feeNum > 0 ? `− A$ ${fmt(audNum - netAud, 2)}` : "A$ 0.00"} muted />
            <ResultRow label="AUD หลังหัก fee" value={audValid && feeValid ? `A$ ${fmt(netAud, 2)}` : "—"} />
            <ResultRow label="อัตราที่ใช้"
              value={activeRate !== null ? `${fmt(activeRate, 4)} THB/AUD` : "ไม่มีอัตรา"} muted />
          </div>

          <div className="mt-5 rounded-2xl px-5 py-4 text-center"
            style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.04) 100%)",
              border: "1px solid rgba(201,168,76,0.25)" }}>
            <p className="mono text-[10px] tracking-widest uppercase opacity-50 mb-1">THB ที่ผู้รับจะได้รับ</p>
            {thb !== null && audValid && feeValid ? (
              <p className="text-4xl font-extrabold rate-glow"
                style={{ color: "var(--gold-light)", fontFamily: "var(--font-mono)" }}>
                ฿{fmt(thb, 2)}
              </p>
            ) : (
              <p className="text-2xl font-semibold opacity-30">—</p>
            )}
            {thb !== null && activeRate !== null && audValid && feeValid && (
              <p className="mono text-[10px] mt-1 opacity-40">
                {fmt(netAud, 4)} AUD × {fmt(activeRate, 4)} = {fmt(thb, 2)} THB
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 pt-1">
          <p className="text-[10px] opacity-25 text-center mono">
            อัตราแลกเปลี่ยนเพื่อประมาณการเท่านั้น · อัตราจริงขึ้นกับผู้ให้บริการโอนเงิน
          </p>
        </div>
      </div>

      <div className="mt-6 w-full max-w-md text-center">
        <p className="mono text-[10px] opacity-25 uppercase tracking-widest">
          ตัวอย่าง: AUD 1,000 · fee 1.5% · netAUD 985 · THB ≈ ฿{activeRate ? fmt(985 * activeRate, 2) : "?"}
        </p>
      </div>
    </main>
  );
}

function ResultRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ opacity: muted ? 0.45 : 0.65 }}>{label}</span>
      <span className="mono text-sm font-medium" style={{ color: "#f0ede6", opacity: muted ? 0.5 : 1 }}>
        {value}
      </span>
    </div>
  );
}