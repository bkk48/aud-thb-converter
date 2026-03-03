"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

const fmt = (n: number, d: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d });

const ADMIN_EMAIL = "c.amphorncharat@gmail.com";
const GOOGLE_FINANCE_URL = "https://www.google.com/finance/quote/AUD-THB";

export default function ConverterPage() {
  const { user, isSignedIn } = useUser();
  const [aud, setAud] = useState("1000");
  const [fee, setFee] = useState("1");
  const [manualRate, setManualRate] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doFetch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rate?t=${Date.now()}`);
      const data = await res.json();
      if (data.rate > 0) {
        setRate(data.rate);
        setSource(data.source);
        setFetchedAt(new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" }));
        setError(null);
      } else {
        setError(data.error ?? "ดึงอัตราไม่ได้");
      }
    } catch {
      setError("เชื่อมต่อไม่ได้");
    }
    setLoading(false);
  };

  useEffect(() => { doFetch(); }, []);

  const audNum = parseFloat(aud) || 0;
  const feeNum = parseFloat(fee) || 0;
  const activeRate = rate ? rate + 0.15 : (parseFloat(manualRate) || null);
  const netAud = audNum * (1 - feeNum / 100);
  const thb = activeRate !== null ? netAud * activeRate : null;
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1f1c14 0%, #0f0e0c 70%)" }}>

      <div className="w-full max-w-md mb-8 text-center">
        <p className="mono text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "var(--gold)", opacity: 0.7 }}>Currency Converter</p>
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span style={{ color: "var(--gold-light)" }}>AUD</span>
          <span className="mx-3 font-light opacity-30">→</span>
          <span className="text-white">THB</span>
        </h1>
      </div>

      <div className="w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: "var(--dark-2)", borderColor: "var(--border)" }}>

        {/* Rate */}
        <div className="px-6 pt-6 pb-5" style={{ background: "var(--dark-3)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mono text-[10px] tracking-widest uppercase opacity-50 mb-1">อัตราแลกเปลี่ยน · 1 AUD =</p>
              {loading && !rate ? (
                <div className="h-8 w-40 rounded animate-pulse" style={{ background: "rgba(201,168,76,0.1)" }} />
              ) : activeRate ? (
                <p className="text-3xl font-bold" style={{ color: "var(--gold-light)", fontFamily: "var(--font-mono)" }}>
                  {fmt(activeRate, 4)} <span className="text-lg font-normal opacity-60">THB</span>
                </p>
              ) : (
                <p className="text-xl font-semibold" style={{ color: "#e05d5d" }}>ไม่พบอัตรา</p>
              )}
              {source && fetchedAt && (
                <p className="mono text-[10px] opacity-40 mt-1">via {source} · {fetchedAt} ICT</p>
              )}
            </div>

            <button onClick={doFetch} disabled={loading}
              className="flex-shrink-0 mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                color: "var(--gold-light)", opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              <svg className={loading ? "spinning" : ""} width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
              </svg>
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          <a href={GOOGLE_FINANCE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[11px] hover:underline"
            style={{ color: "var(--gold)", opacity: 0.6 }}>
            เปิด Google Finance AUDTHB
          </a>
        </div>

        {error && (
          <div className="mx-6 mt-5 rounded-xl px-4 py-3"
            style={{ background: "rgba(224,93,93,0.08)", border: "1px solid rgba(224,93,93,0.2)" }}>
            <p className="text-sm font-semibold mb-2" style={{ color: "#e07070" }}>⚠ {error}</p>
            <input type="number" placeholder="กรอกอัตราเอง เช่น 22.50" value={manualRate}
              onChange={e => setManualRate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm mono outline-none border"
              style={{ background: "var(--dark)", borderColor: "rgba(255,255,255,0.2)", color: "#f0ede6" }} />
          </div>
        )}

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-2 mono">จำนวนเงิน (AUD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: "var(--gold-light)" }}>A$</span>
              <input type="number" min="0" value={aud} onChange={e => setAud(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-lg mono font-medium outline-none border"
                style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase opacity-50 mb-2 mono">ค่าธรรมเนียม / Fee (%)</label>
            <div className="relative">
              <input type="number" min="0" value={fee} onChange={e => setFee(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl text-lg mono font-medium outline-none border"
                style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }} placeholder="0.00" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 mono text-sm">%</span>
            </div>
          </div>
        </div>

        <div className="divider mx-6" />

        <div className="px-6 py-5">
          <p className="mono text-[10px] tracking-widest uppercase opacity-40 mb-4">ผลการคำนวณ</p>
          <div className="space-y-3">
            <Row label="จำนวนเงินตั้งต้น" value={`A$ ${fmt(audNum, 2)}`} />
            <Row label={`Fee ${fmt(feeNum, 2)}%`} value={`− A$ ${fmt(audNum - netAud, 2)}`} muted />
            <Row label="AUD หลังหัก fee" value={`A$ ${fmt(netAud, 2)}`} />
            <Row label="อัตราที่ใช้" value={activeRate ? `${fmt(activeRate, 4)} THB/AUD` : "—"} muted />
          </div>
          <div className="mt-5 rounded-2xl px-5 py-4 text-center"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)" }}>
            <p className="mono text-[10px] tracking-widest uppercase opacity-50 mb-1">THB ที่ผู้รับจะได้รับ</p>
            {thb !== null ? (
              <p className="text-4xl font-extrabold" style={{ color: "var(--gold-light)", fontFamily: "var(--font-mono)" }}>
                ฿{fmt(thb, 2)}
              </p>
            ) : <p className="text-2xl opacity-30">—</p>}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="divider mb-4" />
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold-light)" }}>
                เข้าสู่ระบบเพื่อแจ้งโอนเงิน
              </button>
            </SignInButton>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs opacity-50 mono">👤 {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}</p>
                <SignOutButton>
                  <button className="text-xs opacity-40 hover:opacity-70">ออกจากระบบ</button>
                </SignOutButton>
              </div>
              <Link href="/order" className="block">
                <button className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold-light)" }}>
                  📋 แจ้งโอนเงิน
                </button>
              </Link>
              {isAdmin && (
                <Link href="/admin" className="block">
                  <button className="w-full py-2 rounded-xl font-semibold text-xs"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede6" }}>
                    ⚙ Admin Dashboard
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-4">
          <p className="text-[10px] opacity-20 text-center mono">อัตราแลกเปลี่ยนเพื่อประมาณการเท่านั้น</p>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ opacity: muted ? 0.45 : 0.65 }}>{label}</span>
      <span className="mono text-sm font-medium" style={{ color: "#f0ede6", opacity: muted ? 0.5 : 1 }}>{value}</span>
    </div>
  );
}