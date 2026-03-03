"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

const BANKS = ["กสิกรไทย", "ไทยพาณิชย์", "กรุงเทพ", "กรุงไทย", "ทหารไทยธนชาต", "กรุงศรี", "ออมสิน", "อื่นๆ"];

interface Props {
  rate: number;
  feePercent: number;
}

export default function OrderForm({ rate, feePercent }: Props) {
  const { user } = useUser();
  const [aud, setAud] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const audNum = parseFloat(aud) || 0;
  const netAud = audNum * (1 - feePercent / 100);
  const thb = netAud * rate;

  const fmt = (n: number, d: number) =>
    n.toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d });

  const handleSubmit = async () => {
    if (!user) return;
    if (!aud || !bankName || !accountNumber || !accountName) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (audNum <= 0) { setError("กรุณากรอกจำนวนเงินที่ถูกต้อง"); return; }

    setLoading(true);
    setError("");

    try {
      let slip_url = null;

      // Upload slip if provided
      if (slip) {
        const fileName = `${user.id}/${Date.now()}_${slip.name}`;
        const { error: uploadError } = await supabase.storage
          .from("slips")
          .upload(fileName, slip);
        if (!uploadError) {
          const { data } = supabase.storage.from("slips").getPublicUrl(fileName);
          slip_url = data.publicUrl;
        }
      }

      // Insert order
      const { error: insertError } = await supabase.from("orders").insert({
        user_id: user.id,
        user_email: user.primaryEmailAddress?.emailAddress ?? "",
        user_name: user.fullName ?? user.firstName ?? "",
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        aud_amount: audNum,
        fee_percent: feePercent,
        net_aud: netAud,
        rate: rate,
        thb_amount: thb,
        slip_url,
        status: "pending",
      });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (e: unknown) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "var(--dark-2)", border: "1px solid rgba(201,168,76,0.3)" }}>
        <div className="text-4xl mb-3">✅</div>
        <p className="text-lg font-bold mb-1" style={{ color: "var(--gold-light)" }}>ส่งคำสั่งโอนแล้ว!</p>
        <p className="text-sm opacity-60">ทีมงานจะตรวจสอบและโอนเงินให้ภายใน 24 ชั่วโมง</p>
        <button onClick={() => { setSuccess(false); setAud(""); setSlip(null); }}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-light)", border: "1px solid rgba(201,168,76,0.3)" }}>
          ส่งรายการใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--dark-2)", border: "1px solid var(--border)" }}>
      <div className="px-6 py-4" style={{ background: "var(--dark-3)", borderBottom: "1px solid var(--border)" }}>
        <p className="font-bold text-sm" style={{ color: "var(--gold-light)" }}>📋 แจ้งโอนเงิน</p>
        <p className="text-xs opacity-50 mt-0.5">กรอกข้อมูลบัญชีปลายทางและแนบสลิป</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* AUD Amount */}
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-1.5 mono">จำนวนเงิน AUD</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: "var(--gold-light)" }}>A$</span>
            <input type="number" min="0" step="0.01" value={aud} onChange={e => setAud(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base mono outline-none border"
              style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }}
              placeholder="0.00" />
          </div>
          {audNum > 0 && (
            <p className="text-xs mt-1 opacity-50 mono">
              net A${fmt(netAud, 2)} × {fmt(rate, 4)} = <span style={{ color: "var(--gold-light)" }}>฿{fmt(thb, 2)}</span>
            </p>
          )}
        </div>

        {/* Bank */}
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-1.5 mono">ธนาคาร</label>
          <select value={bankName} onChange={e => setBankName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
            style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: bankName ? "#f0ede6" : "#666" }}>
            <option value="">เลือกธนาคาร</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-1.5 mono">เลขบัญชี</label>
          <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm mono outline-none border"
            style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }}
            placeholder="xxx-x-xxxxx-x" />
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-1.5 mono">ชื่อบัญชี</label>
          <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
            style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }}
            placeholder="ชื่อ-นามสกุล" />
        </div>

        {/* Slip Upload */}
        <div>
          <label className="block text-xs tracking-widest uppercase opacity-50 mb-1.5 mono">แนบสลิป (ถ้ามี)</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setSlip(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border cursor-pointer"
            style={{ background: "var(--dark)", borderColor: "rgba(201,168,76,0.3)", color: "#f0ede6" }} />
          {slip && <p className="text-xs mt-1 opacity-50">📎 {slip.name}</p>}
        </div>

        {error && <p className="text-xs font-medium" style={{ color: "#e07070" }}>⚠ {error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.2)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "var(--gold-light)",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "กำลังส่ง..." : "ส่งคำสั่งโอนเงิน"}
        </button>
      </div>
    </div>
  );
}