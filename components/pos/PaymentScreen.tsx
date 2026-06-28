"use client";
import { useState, useEffect } from "react";

interface Props {
  total: number;
  onConfirm: (bayar: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

const DENOMS = [50000, 100000, 200000, 500000, 1000000];

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

export function PaymentScreen({ total, onConfirm, onCancel, loading }: Props) {
  const [bayar, setBayar] = useState(0);
  const kembalian = bayar - total;

  function pressNumpad(key: string) {
    setBayar((prev) => {
      const s = String(prev);
      if (key === "←") return Math.floor(prev / 10);
      if (key === "00") return Number(s + "00");
      return Number(s + key);
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") { pressNumpad(e.key); return; }
      if (e.key === "Backspace") { pressNumpad("←"); return; }
      if (e.key === "Enter" && bayar >= total && !loading) { onConfirm(bayar); return; }
      if (e.key === "Escape") { onCancel(); return; }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bayar, total, loading]);

  const keys = ["1","2","3","4","5","6","7","8","9","0","00","←"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4">
          <p className="text-sm text-gray-400">Total Transaksi</p>
          <p className="text-4xl font-bold">Rp {fmt(total)}</p>
        </div>
        <div className="flex gap-6 p-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {DENOMS.map((d) => (
                <button
                  key={d}
                  onClick={() => setBayar(d)}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm font-medium"
                >
                  {d >= 1000000 ? `${d/1000000}Jt` : `${d/1000}K`}
                </button>
              ))}
              <button
                onClick={() => setBayar(total)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1.5 rounded text-sm font-medium"
              >
                BAYAR PCS
              </button>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bayar</label>
              <div className="text-3xl font-bold text-gray-800 border-b-2 border-gray-300 pb-1">
                Rp {fmt(bayar)}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kembalian</label>
              <div className={`text-3xl font-bold pb-1 ${kembalian >= 0 ? "text-green-600" : "text-red-500"}`}>
                Rp {fmt(Math.max(0, kembalian))}
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => onConfirm(bayar)}
                disabled={bayar < total || loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white py-3 rounded font-bold text-sm"
              >
                {loading ? "MEMPROSES..." : "KONFIRMASI"}
              </button>
              <button onClick={onCancel} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded font-bold text-sm">
                BATAL
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 content-start">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => pressNumpad(k)}
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 w-14 h-12 rounded text-lg font-semibold"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
