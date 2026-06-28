"use client";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, ShoppingCart, BarChart2, Package, FileDown } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";
import { DataTable } from "@/components/shared/DataTable";

function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n + 1); return d.toISOString().slice(0, 10); }
function fmt(n: number) { return Number(n).toLocaleString("id-ID"); }
function fmtShort(n: number) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}Jt` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(n); }
function fmtDate(s: string) { const d = new Date(s); return `${d.getDate()}/${d.getMonth()+1}`; }

interface PenjualanRow { tanggal: string; jumlah_transaksi: number; total_penjualan: number; laba_kotor: number; }
interface TopRow { barcode: string; nama_barang: string; total_qty: number; total_penjualan: number; }
interface Summary { revenue: number; trx: number; laba: number; }
interface StoreSetting { nama_toko: string; alamat: string; telepon: string; }
interface DetailRow { id: number; tanggal: string; no_transaksi: string; nama_barang: string; sat: string; qty: number; hpp: number; harga: number; diskon: number; total: number; laba_kotor: number; }
interface PembelianRow { id: number; no_faktur: string; tanggal: string; total: number; status: string; }

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-lg border p-4 flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 mb-1">{title}</p>
        <p className="text-base sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <div className={`p-2 rounded-lg ml-2 flex-shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [today14, setToday14] = useState<PenjualanRow[]>([]);
  const [monthly, setMonthly] = useState<PenjualanRow[]>([]);
  const [todaySummary, setTodaySummary] = useState<Summary>({ revenue: 0, trx: 0, laba: 0 });
  const [top, setTop] = useState<TopRow[]>([]);
  const [custom, setCustom] = useState<PenjualanRow[]>([]);
  const [setting, setSetting] = useState<StoreSetting>({ nama_toko: "", alamat: "", telepon: "" });
  const [exporting, setExporting] = useState(false);

  async function loadDashboard() {
    try {
      const [t14, mon, tod, topProd, s] = await Promise.all([
        api.get<PenjualanRow[]>("/laporan/penjualan", { tgl_mulai: daysAgo(14), tgl_selesai: today() }),
        api.get<PenjualanRow[]>("/laporan/penjualan", { tgl_mulai: firstOfMonth(), tgl_selesai: today() }),
        api.get<PenjualanRow[]>("/laporan/penjualan", { tgl_mulai: today(), tgl_selesai: today() }),
        api.get<TopRow[]>("/laporan/produk-terlaris", { tgl_mulai: firstOfMonth(), tgl_selesai: today(), limit: 7 }),
        api.get<StoreSetting>("/setting/"),
      ]);
      setToday14(t14);
      setMonthly(mon);
      setTodaySummary({
        revenue: tod.reduce((s, r) => s + Number(r.total_penjualan), 0),
        trx: tod.reduce((s, r) => s + Number(r.jumlah_transaksi), 0),
        laba: tod.reduce((s, r) => s + Number(r.laba_kotor), 0),
      });
      setTop(topProd);
      setSetting(s);
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function loadCustom() {
    try {
      const res = await api.get<PenjualanRow[]>("/laporan/penjualan", { tgl_mulai: from, tgl_selesai: to });
      setCustom(res);
    } catch (err) { toast((err as Error).message, "error"); }
  }

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadCustom(); }, []);

  const monthlyRevenue = monthly.reduce((s, r) => s + Number(r.total_penjualan), 0);
  const monthlyLaba = monthly.reduce((s, r) => s + Number(r.laba_kotor), 0);
  const monthlyTrx = monthly.reduce((s, r) => s + Number(r.jumlah_transaksi), 0);
  const customRevenue = custom.reduce((s, r) => s + Number(r.total_penjualan), 0);
  const customLaba = custom.reduce((s, r) => s + Number(r.laba_kotor), 0);
  const customTrx = custom.reduce((s, r) => s + Number(r.jumlah_transaksi), 0);
  const chart14 = today14.map((r) => ({
    ...r,
    total_penjualan: Number(r.total_penjualan),
    laba_kotor: Number(r.laba_kotor),
    label: fmtDate(r.tanggal),
  }));

  async function handleExportPDF() {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }, detail, pembelian] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        api.get<DetailRow[]>("/laporan/penjualan-detail", { tgl_mulai: from, tgl_selesai: to }),
        api.get<PembelianRow[]>("/purchas/", { tgl_mulai: from, tgl_selesai: to }),
      ]);

      const doc = new jsPDF({ orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();

      function addPageHeader(title: string) {
        let y = 15;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(setting.nama_toko || title, pageW / 2, y, { align: "center" });
        y += 7;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        if (setting.alamat) { doc.text(setting.alamat, pageW / 2, y, { align: "center" }); y += 5; }
        if (setting.telepon) { doc.text(`Telp: ${setting.telepon}`, pageW / 2, y, { align: "center" }); y += 5; }
        doc.text(`Periode: ${from} s/d ${to}`, pageW / 2, y, { align: "center" }); y += 5;
        doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, pageW / 2, y, { align: "center" }); y += 8;
        doc.setDrawColor(200);
        doc.line(14, y, pageW - 14, y);
        return y + 8;
      }

      function sectionTitle(y: number, title: string) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(title, 14, y);
        return y + 6;
      }

      // ── Section 1: Ringkasan & Penjualan Harian ────────────────────────────
      let y = addPageHeader("Laporan");

      y = sectionTitle(y, "Ringkasan Periode");
      autoTable(doc, {
        startY: y,
        head: [["Keterangan", { content: "Nilai", styles: { halign: "right" } }]],
        body: [
          ["Total Penjualan (Omzet)", `Rp ${fmt(customRevenue)}`],
          ["Laba Kotor", `Rp ${fmt(customLaba)}`],
          ["Margin Laba", `${customRevenue > 0 ? ((customLaba / customRevenue) * 100).toFixed(1) : 0}%`],
          ["Jumlah Transaksi", String(customTrx)],
          ["Rata-rata per Transaksi", `Rp ${customTrx > 0 ? fmt(Math.round(customRevenue / customTrx)) : 0}`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        tableWidth: 120,
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      y = sectionTitle(y, "Penjualan Harian");
      autoTable(doc, {
        startY: y,
        head: [["Tanggal", { content: "Jumlah Transaksi", styles: { halign: "center" } }, { content: "Omzet", styles: { halign: "right" } }, { content: "Laba Kotor", styles: { halign: "right" } }]],
        body: custom.map((r) => [r.tanggal, String(r.jumlah_transaksi), `Rp ${fmt(Number(r.total_penjualan))}`, `Rp ${fmt(Number(r.laba_kotor))}`]),
        foot: [["Total", String(customTrx), `Rp ${fmt(customRevenue)}`, `Rp ${fmt(customLaba)}`]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
        tableWidth: 160,
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      if (top.length > 0) {
        if (y > 160) { doc.addPage(); y = addPageHeader("Laporan"); }
        y = sectionTitle(y, "Produk Terlaris Bulan Ini");
        autoTable(doc, {
          startY: y,
          head: [["Nama Barang", { content: "Total QTY", styles: { halign: "center" } }, { content: "Total Penjualan", styles: { halign: "right" } }]],
          body: top.map((r) => [r.nama_barang, fmt(r.total_qty), `Rp ${fmt(Number(r.total_penjualan))}`]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [31, 41, 55] },
          columnStyles: { 1: { halign: "center" }, 2: { halign: "right" } },
          margin: { left: 14, right: 14 },
          tableWidth: 160,
        });
      }

      // ── Section 2: Detail Penjualan ────────────────────────────────────────
      doc.addPage();
      y = addPageHeader("Detail Penjualan");

      const dOmzet  = detail.reduce((s, r) => s + Number(r.total), 0);
      const dLaba   = detail.reduce((s, r) => s + Number(r.laba_kotor), 0);
      const dQty    = detail.reduce((s, r) => s + Number(r.qty), 0);
      const dDiskon = detail.reduce((s, r) => s + Number(r.diskon), 0);
      const dTrx    = new Set(detail.map((r) => r.no_transaksi)).size;
      const dMargin = dOmzet > 0 ? ((dLaba / dOmzet) * 100).toFixed(1) : "0";

      y = sectionTitle(y, "Ringkasan");
      autoTable(doc, {
        startY: y,
        head: [["Keterangan", { content: "Nilai", styles: { halign: "right" } }]],
        body: [
          ["Total Omzet",        `Rp ${fmt(dOmzet)}`],
          ["Total Laba Kotor",   `Rp ${fmt(dLaba)}`],
          ["Margin Laba",        `${dMargin}%`],
          ["Total Diskon",       `Rp ${fmt(dDiskon)}`],
          ["Jumlah Transaksi",   String(dTrx)],
          ["Total Item Terjual", fmt(dQty)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        tableWidth: 120,
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      y = sectionTitle(y, "Detail Penjualan");
      autoTable(doc, {
        startY: y,
        head: [["Tanggal", "No. Transaksi", "Nama Barang", "SAT", { content: "QTY", styles: { halign: "center" } }, { content: "HPP", styles: { halign: "right" } }, { content: "Harga", styles: { halign: "right" } }, { content: "Diskon", styles: { halign: "right" } }, { content: "Total", styles: { halign: "right" } }, { content: "Laba Kotor", styles: { halign: "right" } }]],
        body: detail.map((r) => [
          r.tanggal, r.no_transaksi, r.nama_barang, r.sat,
          Number(r.qty) % 1 === 0 ? String(r.qty) : Number(r.qty).toFixed(3).replace(/\.?0+$/, ""),
          `Rp ${fmt(Number(r.hpp))}`,
          `Rp ${fmt(Number(r.harga))}`,
          Number(r.diskon) > 0 ? `Rp ${fmt(Number(r.diskon))}` : "-",
          `Rp ${fmt(Number(r.total))}`,
          `Rp ${fmt(Number(r.laba_kotor))}`,
        ]),
        foot: [["", "", "", "", fmt(dQty), "", "", `Rp ${fmt(dDiskon)}`, `Rp ${fmt(dOmzet)}`, `Rp ${fmt(dLaba)}`]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 41, 55] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        columnStyles: { 4: { halign: "center" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      // ── Section 3: Laporan Pembelian ───────────────────────────────────────
      doc.addPage();
      y = addPageHeader("Laporan Pembelian");

      const pTotal   = pembelian.reduce((s, r) => s + Number(r.total), 0);
      const pDraft   = pembelian.filter((r) => r.status === "draft").length;
      const pConfirm = pembelian.filter((r) => r.status === "confirmed").length;

      y = sectionTitle(y, "Ringkasan");
      autoTable(doc, {
        startY: y,
        head: [["Keterangan", { content: "Nilai", styles: { halign: "right" } }]],
        body: [
          ["Total Nilai Pembelian", `Rp ${fmt(pTotal)}`],
          ["Jumlah Invoice",        String(pembelian.length)],
          ["Sudah Dikonfirmasi",    String(pConfirm)],
          ["Masih Draft",           String(pDraft)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        tableWidth: 120,
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      y = sectionTitle(y, "Detail Pembelian");
      autoTable(doc, {
        startY: y,
        head: [["No. Faktur", "Tanggal", { content: "Total", styles: { halign: "right" } }, { content: "Status", styles: { halign: "center" } }]],
        body: pembelian.map((r) => [
          r.no_faktur,
          new Date(r.tanggal).toLocaleDateString("id-ID"),
          `Rp ${fmt(Number(r.total))}`,
          r.status,
        ]),
        foot: [["", "", `Rp ${fmt(pTotal)}`, ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        columnStyles: { 2: { halign: "right" }, 3: { halign: "center" } },
        margin: { left: 14, right: 14 },
      });

      doc.save(`Laporan_Lengkap_${from}_${to}.pdf`);
      toast("PDF berhasil diekspor", "success");
    } catch (err) {
      toast("Gagal ekspor PDF", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Laporan Penjualan</h1>
          <p className="text-xs text-gray-500 mt-0.5">Ringkasan pendapatan dan performa toko.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
        >
          <FileDown size={15} />
          {exporting ? "Mengekspor..." : "Export Laporan Lengkap"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Omzet Hari Ini" value={`Rp ${fmt(todaySummary.revenue)}`} sub={`${todaySummary.trx} transaksi`} icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Laba Kotor Hari Ini" value={`Rp ${fmt(todaySummary.laba || 0)}`} sub={todaySummary.revenue > 0 ? `Margin ${(((todaySummary.laba || 0) / todaySummary.revenue) * 100).toFixed(1)}%` : "-"} icon={BarChart2} color="bg-emerald-500" />
        <StatCard title="Omzet Bulan Ini" value={`Rp ${fmt(monthlyRevenue)}`} sub={`${monthlyTrx} transaksi`} icon={BarChart2} color="bg-blue-500" />
        <StatCard title="Laba Kotor Bulan Ini" value={`Rp ${fmt(monthlyLaba)}`} sub={`Margin ${monthlyRevenue > 0 ? ((monthlyLaba / monthlyRevenue) * 100).toFixed(1) : 0}%`} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Total Transaksi Bulan Ini" value={String(monthlyTrx)} sub={`Rata-rata Rp ${monthlyTrx > 0 ? fmt(Math.round(monthlyRevenue / monthlyTrx)) : 0}`} icon={ShoppingCart} color="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Revenue vs Laba — 14 Hari Terakhir</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
              <Tooltip formatter={(v, name) => [`Rp ${fmt(Number(v))}`, name === "total_penjualan" ? "Omzet" : "Laba Kotor"]} labelFormatter={(l) => `Tgl ${l}`} />
              <Legend formatter={(v) => v === "total_penjualan" ? "Omzet" : "Laba Kotor"} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="total_penjualan" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="laba_kotor" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Produk Terlaris Bulan Ini</p>
          <DataTable
            columns={[
              { key: "nama_barang", label: "Nama Barang", className: "font-medium" },
              { key: "total_qty", label: "Total QTY", render: (r: TopRow) => fmt(r.total_qty) },
              { key: "total_penjualan", label: "Total Penjualan", render: (r: TopRow) => `Rp ${fmt(r.total_penjualan)}` },
            ]}
            data={top}
            keyField="barcode"
          />
        </div>
      </div>

      {/* Custom date range */}
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Penjualan Harian (Kustom)</p>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <span className="text-gray-400">s/d</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          <button onClick={loadCustom} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-sm">Tampilkan</button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
          <span>{customTrx} transaksi</span>
          <span>Omzet: <span className="font-bold text-gray-800">Rp {fmt(customRevenue)}</span></span>
          <span>Laba: <span className="font-bold text-emerald-700">Rp {fmt(customLaba)}</span></span>
          {customRevenue > 0 && <span className="text-xs text-gray-400">({((customLaba / customRevenue) * 100).toFixed(1)}%)</span>}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={custom.map((r) => ({ ...r, total_penjualan: Number(r.total_penjualan), laba_kotor: Number(r.laba_kotor), label: fmtDate(r.tanggal) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
            <Tooltip formatter={(v, name) => [`Rp ${fmt(Number(v))}`, name === "total_penjualan" ? "Omzet" : "Laba Kotor"]} />
            <Legend formatter={(v) => v === "total_penjualan" ? "Omzet" : "Laba Kotor"} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="total_penjualan" fill="#1f2937" radius={[3,3,0,0]} />
            <Bar dataKey="laba_kotor" fill="#10b981" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
