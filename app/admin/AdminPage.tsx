"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "c.amphorncharat@gmail.com";

interface Order {
  id: string;
  user_email: string;
  user_name: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  aud_amount: number;
  fee_percent: number;
  net_aud: number;
  rate: number;
  thb_amount: number;
  slip_url: string | null;
  status: string;
  created_at: string;
}

const fmt = (n: number, d: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: d, maximumFractionDigits: d });

const STATUS_COLORS: Record<string, string> = {
  pending: "#e09b32", confirmed: "#4ade80", completed: "#60a5fa", cancelled: "#e07070",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "รอดำเนินการ", confirmed: "ยืนยันแล้ว", completed: "โอนแล้ว", cancelled: "ยกเลิก",
};

export default function AdminPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => { if (isAdmin) fetchOrders(); }, [isAdmin]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dark)" }}>
      <p className="opacity-50">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
    </div>
  );

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--dark)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="mono text-xs tracking-widest uppercase opacity-40 mb-1">Admin Dashboard</p>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--gold-light)" }}>คำสั่งโอนเงินทั้งหมด</h1>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: filter === s ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === s ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: filter === s ? "var(--gold-light)" : "#f0ede6",
              }}>
              {s === "all" ? `ทั้งหมด (${orders.length})` : `${STATUS_LABELS[s]} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
          <button onClick={fetchOrders} className="px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0ede6" }}>
            Refresh
          </button>
        </div>
        {loading ? <div className="text-center opacity-40 py-12">กำลังโหลด...</div>
          : filtered.length === 0 ? <div className="text-center opacity-40 py-12">ไม่มีรายการ</div>
          : (
            <div className="space-y-4">
              {filtered.map(order => (
                <div key={order.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--dark-2)", border: "1px solid var(--border)" }}>
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ background: "var(--dark-3)", borderBottom: "1px solid var(--border)" }}>
                    <div>
                      <p className="font-semibold text-sm">{order.user_name}</p>
                      <p className="text-xs opacity-40 mono">{order.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{ background: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-xs opacity-30 mono">{new Date(order.created_at).toLocaleDateString("th-TH")}</span>
                    </div>
                  </div>
                  <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="opacity-40 text-xs mono mb-0.5">จำนวนเงิน</p>
                      <p className="font-bold" style={{ color: "var(--gold-light)" }}>A$ {fmt(order.aud_amount, 2)}</p>
                      <p className="text-xs opacity-50">fee {order.fee_percent}% → A$ {fmt(order.net_aud, 2)}</p>
                    </div>
                    <div>
                      <p className="opacity-40 text-xs mono mb-0.5">THB ที่จะโอน</p>
                      <p className="font-bold text-lg" style={{ color: "var(--gold-light)" }}>฿{fmt(order.thb_amount, 2)}</p>
                      <p className="text-xs opacity-50">rate {fmt(order.rate, 4)}</p>
                    </div>
                    <div>
                      <p className="opacity-40 text-xs mono mb-0.5">บัญชีปลายทาง</p>
                      <p className="font-semibold">{order.account_name}</p>
                      <p className="text-xs opacity-50 mono">{order.bank_name} · {order.account_number}</p>
                    </div>
                    <div>
                      {order.slip_url && (
                        <a href={order.slip_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs underline" style={{ color: "var(--gold)" }}>
                          ดูสลิป
                        </a>
                      )}
                    </div>
                  </div>
                  {order.status === "pending" && (
                    <div className="px-5 pb-4 flex gap-2">
                      <button onClick={() => updateStatus(order.id, "confirmed")}
                        className="flex-1 py-2 rounded-lg text-xs font-bold"
                        style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80" }}>
                        ยืนยัน
                      </button>
                      <button onClick={() => updateStatus(order.id, "cancelled")}
                        className="flex-1 py-2 rounded-lg text-xs font-bold"
                        style={{ background: "rgba(224,112,112,0.15)", border: "1px solid rgba(224,112,112,0.3)", color: "#e07070" }}>
                        ยกเลิก
                      </button>
                    </div>
                  )}
                  {order.status === "confirmed" && (
                    <div className="px-5 pb-4">
                      <button onClick={() => updateStatus(order.id, "completed")}
                        className="w-full py-2 rounded-lg text-xs font-bold"
                        style={{ background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa" }}>
                        โอนเสร็จแล้ว
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}