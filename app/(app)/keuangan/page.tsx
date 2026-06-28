"use client";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";

interface KeuanganRow { id: number; tanggal: string; keterangan: string; debit: number; kredit: number; ref_type?: string; }

function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function fmt(n: number) { return Number(n).toLocaleString("id-ID"); }

export default function KeuanganPage() {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<KeuanganRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ keterangan: "", debit: 0, kredit: 0 });

  async function load() {
    try {
      const res = await api.get<KeuanganRow[]>("/keuangan/", { tgl_mulai: from, tgl_selesai: to });
      setData(res);
    } catch (err) { toast((err as Error).message, "error"); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    try {
      await api.post("/keuangan/", form);
      toast("Entri ditambahkan", "success");
      setShowModal(false);
      setForm({ keterangan: "", debit: 0, kredit: 0 });
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  const totalDebit = data.reduce((s, r) => s + Number(r.debit), 0);
  const totalKredit = data.reduce((s, r) => s + Number(r.kredit), 0);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Keuangan</h1>
          <p className="text-xs text-gray-500 mt-0.5">Buku kas toko — tercatat otomatis dari penjualan dan pembelian. Tambah entri manual untuk biaya operasional.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm flex-shrink-0">
          <Plus size={14} /> Entri Manual
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <span className="text-gray-400">s/d</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button onClick={load} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded text-sm">Tampilkan</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[["Total Masuk (Debit)", totalDebit, "text-green-600"], ["Total Keluar (Kredit)", totalKredit, "text-red-600"], ["Saldo", totalDebit - totalKredit, "text-gray-800"]].map(([label, val, cls]) => (
          <div key={String(label)} className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">{String(label)}</p>
            <p className={`text-xl font-bold ${cls}`}>Rp {fmt(Number(val))}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={[
          { key: "tanggal", label: "Tanggal", render: (r: KeuanganRow) => new Date(r.tanggal).toLocaleDateString("id-ID") },
          { key: "keterangan", label: "Keterangan", className: "font-medium" },
          { key: "ref_type", label: "Tipe", className: "hidden sm:table-cell", render: (r: KeuanganRow) => <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.ref_type ?? "-"}</span> },
          { key: "debit", label: "Debit", render: (r: KeuanganRow) => r.debit > 0 ? <span className="text-green-600">+{fmt(r.debit)}</span> : "-" },
          { key: "kredit", label: "Kredit", render: (r: KeuanganRow) => r.kredit > 0 ? <span className="text-red-600">-{fmt(r.kredit)}</span> : "-" },
        ]}
        data={data}
        keyField="id"
      />

      {showModal && (
        <Modal title="Entri Manual" onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-3">
            {[["keterangan","Keterangan","text"],["debit","Debit (Pemasukan)","number"],["kredit","Kredit (Pengeluaran)","number"]].map(([k, label, type]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={String(form[k as keyof typeof form])}
                  onChange={(e) => setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            ))}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">Simpan</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
