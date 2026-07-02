"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";

interface DetailItem {
  nama_barang: string;
  qty: number;
  sat: string;
  harga: number;
  diskon: number;
  total: number;
}

interface TrxRow {
  id: number;
  no_transaksi: string;
  tanggal: string;
  kasir: string;
  total: number;
  bayar: number;
  kembalian: number;
  detail: DetailItem[];
}

function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function fmt(n: number) { return Number(n).toLocaleString("id-ID"); }

export default function RiwayatTransaksiPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<TrxRow[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [printing, setPrinting] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.get<TrxRow[]>("/laporan/transaksi", { tgl_mulai: from, tgl_selesai: to });
      setData(res);
      setExpanded(new Set());
    } catch (err) { toast((err as Error).message, "error"); }
  }

  useEffect(() => { load(); }, []);

  async function handleReprint(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setPrinting(id);
    try {
      await api.post(`/print/receipt/${id}`, {});
      toast("Struk dicetak", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setPrinting(null);
    }
  }

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const grandTotal = data.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-5 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Riwayat Transaksi</h1>
        <p className="text-xs text-gray-500 mt-0.5">Daftar semua transaksi penjualan yang telah selesai. Klik baris untuk melihat detail item.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <span className="text-gray-400">s/d</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-sm">Tampilkan</button>
        <span className="ml-auto text-sm text-gray-500">{data.length} transaksi &nbsp;|&nbsp; Total: <span className="font-bold text-gray-800">Rp {fmt(grandTotal)}</span></span>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1fr_1fr_1fr] text-xs font-semibold text-gray-500 bg-gray-50 border-b px-3 py-2 gap-2">
          <span />
          <span>No. Transaksi</span>
          <span>Tanggal & Waktu</span>
          <span>Kasir</span>
          <span className="text-right">Total</span>
          <span className="text-right">Bayar</span>
          <span className="text-right">Kembalian</span>
        </div>

        {data.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Tidak ada transaksi dalam periode ini.</p>
        )}

        {data.map((row) => (
          <div key={row.id} className="border-b last:border-0">
            {/* Main row */}
            <div
              className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1fr_1fr_1fr] text-sm px-3 py-2.5 gap-2 hover:bg-gray-50 cursor-pointer items-center"
              onClick={() => toggle(row.id)}
            >
              <span className="text-gray-400">
                {expanded.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="font-mono font-medium text-gray-800">{row.no_transaksi}</span>
              <span className="text-gray-600">{new Date(row.tanggal).toLocaleString("id-ID")}</span>
              <span className="text-gray-600">{row.kasir}</span>
              <span className="text-right font-semibold">Rp {fmt(row.total)}</span>
              <span className="text-right text-gray-500">Rp {fmt(row.bayar)}</span>
              <span className="text-right text-green-600">Rp {fmt(row.kembalian)}</span>
            </div>

            {/* Expanded detail */}
            {expanded.has(row.id) && (
              <div className="bg-gray-50 px-8 pb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="text-left py-1 font-medium">Nama Barang</th>
                      <th className="text-right py-1 font-medium">QTY</th>
                      <th className="text-right py-1 font-medium">Harga</th>
                      <th className="text-right py-1 font-medium">Diskon</th>
                      <th className="text-right py-1 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {row.detail.map((d, i) => (
                      <tr key={i}>
                        <td className="py-1 font-medium text-gray-700">{d.nama_barang}</td>
                        <td className="text-right text-gray-500">{d.qty} {d.sat}</td>
                        <td className="text-right text-gray-500">Rp {fmt(d.harga)}</td>
                        <td className="text-right text-gray-500">{d.diskon > 0 ? `Rp ${fmt(d.diskon)}` : "-"}</td>
                        <td className="text-right font-medium">Rp {fmt(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={(e) => handleReprint(e, row.id)}
                    disabled={printing === row.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded text-xs"
                  >
                    <Printer size={12} />
                    {printing === row.id ? "Mencetak..." : "Cetak Ulang"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
