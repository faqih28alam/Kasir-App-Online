"use client";
import { useState, useEffect } from "react";
import { Plus, CheckCircle, FileDown, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";

interface PembelianDetail { barcode: string; nama_barang: string; sat: string; qty: number; hpp: number; harga_1: number; total: number; }
interface PembelianRow { id: number; no_faktur: string; tanggal: string; total: number; status: string; detail: PembelianDetail[]; }
interface DetailItem { barcode: string; nama_barang: string; sat: string; qty: number; hpp: number; harga_1: number; }
interface BarangResult { barcode: string; nama_barang: string; sat: string; hpp: number; }
interface StoreSetting { nama_toko: string; alamat: string; telepon: string; }

function fmt(n: number) { return Number(n).toLocaleString("id-ID"); }
function toLocalYMD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function today() { return toLocalYMD(new Date()); }
function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }

const SATUAN = ["PCS","BTL","KG","GR","LTR","ML","BUNGKUS","SACHET","PAK","RENTENG","LUSIN","DUS","KARTON","SLOP","KODI"];

export default function PurchasPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<PembelianRow[]>([]);
  const [setting, setSetting] = useState<StoreSetting>({ nama_toko: "", alamat: "", telepon: "" });
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewRow, setViewRow] = useState<PembelianRow | null>(null);
  const [nameSearch, setNameSearch] = useState<{ row: number; results: BarangResult[] } | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [header, setHeader] = useState({ no_faktur: "", tanggal: toLocalYMD(new Date()) });
  const [detail, setDetail] = useState<DetailItem[]>([{ barcode: "", nama_barang: "", sat: "PCS", qty: 1, hpp: 0, harga_1: 0 }]);

  async function load() {
    try {
      setData(await api.get<PembelianRow[]>("/purchas/", { tgl_mulai: from, tgl_selesai: to }));
      setLoaded(true);
    }
    catch (err) { toast((err as Error).message, "error"); }
  }

  useEffect(() => {
    api.get<StoreSetting>("/setting/").then(setSetting).catch(() => {});
    load();
  }, []);

  const totalNilai    = data.reduce((s, r) => s + Number(r.total), 0);
  const jumlahDraft   = data.filter((r) => r.status === "draft").length;
  const jumlahConfirm = data.filter((r) => r.status === "confirmed").length;

  async function handleExportPDF() {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(setting.nama_toko || "Laporan Pembelian", pageW / 2, y, { align: "center" });
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
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Ringkasan", 14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Keterangan", "Nilai"]],
        body: [
          ["Total Nilai Pembelian", `Rp ${fmt(totalNilai)}`],
          ["Jumlah Invoice",        String(data.length)],
          ["Sudah Dikonfirmasi",    String(jumlahConfirm)],
          ["Masih Draft",           String(jumlahDraft)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      });
      y = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Detail Pembelian", 14, y); y += 6;

      autoTable(doc, {
        startY: y,
        head: [["No. Faktur", "Tanggal", "Total", "Status"]],
        body: data.map((r) => [
          r.no_faktur,
          new Date(r.tanggal).toLocaleDateString("id-ID"),
          `Rp ${fmt(Number(r.total))}`,
          r.status,
        ]),
        foot: [["", "", `Rp ${fmt(totalNilai)}`, ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [31, 41, 55] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
        columnStyles: {
          2: { halign: "right" },
          3: { halign: "center" },
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`Pembelian_${from}_${to}.pdf`);
      toast("PDF berhasil diekspor", "success");
    } catch {
      toast("Gagal ekspor PDF", "error");
    } finally {
      setExporting(false);
    }
  }

  function openCreateModal() {
    setEditId(null);
    setHeader({ no_faktur: "", tanggal: toLocalYMD(new Date()) });
    setDetail([{ barcode: "", nama_barang: "", sat: "PCS", qty: 1, hpp: 0, harga_1: 0 }]);
    setShowModal(true);
  }

  function openEditModal(r: PembelianRow) {
    setEditId(r.id);
    setHeader({ no_faktur: r.no_faktur, tanggal: toLocalYMD(new Date(r.tanggal)) });
    setDetail(r.detail.map((d) => ({ barcode: d.barcode, nama_barang: d.nama_barang, sat: d.sat, qty: Number(d.qty), hpp: Number(d.hpp), harga_1: Number(d.harga_1 ?? 0) })));
    setShowModal(true);
  }

  async function handleSave() {
    if (!header.no_faktur.trim()) { toast("No. Faktur wajib diisi", "error"); return; }
    if (detail.length === 0) { toast("Tambahkan minimal 1 barang", "error"); return; }
    try {
      const payload = { ...header, tanggal: `${header.tanggal}T00:00:00`, detail };
      if (editId !== null) {
        await api.put(`/purchas/${editId}`, payload);
        toast("Pembelian diperbarui", "success");
      } else {
        await api.post("/purchas/", payload);
        toast("Pembelian disimpan", "success");
      }
      setShowModal(false);
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function handleConfirm(id: number) {
    if (!confirm("Konfirmasi pembelian? Stok akan diperbarui.")) return;
    try {
      await api.post(`/purchas/${id}/confirm`, {});
      toast("Pembelian dikonfirmasi, stok diperbarui", "success");
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  function addRow() { setDetail([...detail, { barcode: "", nama_barang: "", sat: "PCS", qty: 1, hpp: 0, harga_1: 0 }]); }
  function updateRow(i: number, field: keyof DetailItem, val: string | number) {
    setDetail(detail.map((d, idx) => idx === i ? { ...d, [field]: val } : d));
  }
  async function searchNama(i: number, q: string, el?: HTMLInputElement) {
    updateRow(i, "nama_barang", q);
    if (q.trim().length < 2) { setNameSearch(null); return; }
    if (el) {
      const r = el.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 280) });
    }
    try {
      const res = await api.get<BarangResult[]>("/master/barang", { q: q.trim() });
      setNameSearch({ row: i, results: res.slice(0, 6) });
    } catch { setNameSearch(null); }
  }
  function selectNama(i: number, b: BarangResult) {
    setDetail(detail.map((d, idx) => idx === i
      ? { ...d, barcode: b.barcode, nama_barang: b.nama_barang, sat: b.sat, hpp: Number(b.hpp) }
      : d));
    setNameSearch(null);
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Pembelian</h1>
          <p className="text-xs text-gray-500 mt-0.5">Catat pembelian barang dari supplier. Konfirmasi untuk memperbarui stok gudang.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportPDF}
            disabled={exporting || data.length === 0}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium"
          >
            <FileDown size={15} />
            {exporting ? "Mengekspor..." : "Export PDF"}
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm">
            <Plus size={14} /> Buat Pembelian
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-lg border p-4 flex items-center gap-3 flex-wrap">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <span className="text-gray-400">s/d</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-sm">Tampilkan</button>
        {loaded && <span className="text-xs text-gray-400 ml-2">{data.length} baris ditemukan</span>}
      </div>

      <DataTable
        columns={[
          { key: "no_faktur", label: "No. Faktur", className: "font-medium" },
          { key: "tanggal", label: "Tanggal", render: (r: PembelianRow) => new Date(r.tanggal).toLocaleDateString("id-ID") },
          { key: "total", label: "Total", render: (r: PembelianRow) => `Rp ${fmt(r.total)}` },
          { key: "status", label: "Status", render: (r: PembelianRow) => (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {r.status}
            </span>
          )},
          { key: "actions", label: "", render: (r: PembelianRow) => r.status === "draft" && (
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleConfirm(r.id); }} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800">
                <CheckCircle size={14} /> Konfirmasi
              </button>
            </div>
          )},
        ]}
        data={data}
        keyField="id"
        onRowClick={(r) => setViewRow(r)}
      />

      {viewRow && (
        <Modal title={`Detail Pembelian — ${viewRow.no_faktur || "(tanpa faktur)"}`} onClose={() => setViewRow(null)} width="max-w-2xl">
          <div className="text-xs text-gray-500 mb-3 flex gap-6">
            <span>Tanggal: <b className="text-gray-700">{new Date(viewRow.tanggal).toLocaleDateString("id-ID")}</b></span>
            <span>Status: <b className={viewRow.status === "confirmed" ? "text-green-600" : "text-yellow-600"}>{viewRow.status}</b></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>{["Barcode","Nama Barang","SAT","QTY","HPP","Subtotal"].map((h) => (
                  <th key={h} className={`px-2 py-1.5 font-medium text-left ${h === "HPP" || h === "Subtotal" ? "text-right" : ""}`}>{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {(viewRow.detail ?? []).map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-gray-500">{d.barcode}</td>
                    <td className="px-2 py-1.5 font-medium">{d.nama_barang}</td>
                    <td className="px-2 py-1.5">{d.sat}</td>
                    <td className="px-2 py-1.5">{Number(d.qty)}</td>
                    <td className="px-2 py-1.5 text-right">{fmt(d.hpp)}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{fmt(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={5} className="px-2 py-1.5 font-bold text-right">Total</td>
                  <td className="px-2 py-1.5 font-bold text-right">Rp {fmt(viewRow.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={editId !== null ? "Edit Pembelian" : "Buat Pembelian"} onClose={() => setShowModal(false)} width="max-w-3xl">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[["no_faktur","No. Faktur","text"],["tanggal","Tanggal","date"]].map(([k, label, type]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={String(header[k as keyof typeof header])}
                  onChange={(e) => setHeader({ ...header, [k]: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            ))}
          </div>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>{["Barcode","Nama","SAT","QTY","HPP (Rp)","Harga Jual (Rp)","Subtotal"].map((h) => <th key={h} className={`px-2 py-1.5 font-medium ${h === "Subtotal" ? "text-right" : "text-left"}`}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {detail.map((row, i) => (
                  <tr key={i}>
                    <td className="px-1 py-1">
                      <input value={row.barcode} onChange={(e) => updateRow(i, "barcode", e.target.value)}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        value={row.nama_barang}
                        onChange={(e) => searchNama(i, e.target.value, e.currentTarget)}
                        onBlur={() => setTimeout(() => setNameSearch(null), 150)}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="Ketik nama..."
                      />
                    </td>
                    <td className="px-1 py-1 w-28">
                      <input
                        list={`satuan-list-${i}`}
                        value={row.sat}
                        onChange={(e) => updateRow(i, "sat", e.target.value.toUpperCase())}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="SAT..."
                      />
                      <datalist id={`satuan-list-${i}`}>
                        {SATUAN.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </td>
                    <td className="px-1 py-1 w-20">
                      <input type="number" min="0" step="0.001" value={row.qty}
                        onChange={(e) => updateRow(i, "qty", parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </td>
                    <td className="px-1 py-1 w-28">
                      <input type="number" min="0" step="1" value={row.hpp}
                        onChange={(e) => updateRow(i, "hpp", Number(e.target.value) || 0)}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="0" />
                    </td>
                    <td className="px-1 py-1 w-28">
                      <input type="number" min="0" step="1" value={row.harga_1}
                        onChange={(e) => updateRow(i, "harga_1", Number(e.target.value) || 0)}
                        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="0" />
                    </td>
                    <td className="px-2 py-1 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
                      Rp {fmt(row.qty * row.hpp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-1 mb-3">
            <button onClick={addRow} className="text-xs text-blue-600 hover:underline">+ Tambah Baris</button>
            <span className="text-xs text-gray-500">
              Total: <span className="font-bold text-gray-800">Rp {fmt(detail.reduce((s, r) => s + r.qty * r.hpp, 0))}</span>
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">{editId !== null ? "Simpan Perubahan" : "Simpan Draft"}</button>
          </div>
          {nameSearch && nameSearch.results.length > 0 && dropdownPos && (
            <div style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
              className="bg-white border rounded shadow-lg text-xs">
              {nameSearch.results.map((b) => (
                <button key={b.barcode} type="button" onMouseDown={() => selectNama(nameSearch.row, b)}
                  className="w-full px-2 py-1.5 text-left hover:bg-blue-50 border-b last:border-0">
                  <span className="font-medium text-gray-800">{b.nama_barang}</span>
                  <span className="text-gray-400 ml-2">{b.barcode}</span>
                  <span className="text-gray-500 ml-2">{b.sat}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
