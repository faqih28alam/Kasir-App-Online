"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";

interface HargaTier { id?: number; min_qty: number; harga: number; }

interface Barang {
  barcode: string; nama_barang: string; sat: string; hpp: number;
  harga_1: number; stok: number; stok_minimum: number;
  id_kategori?: number; harga_tiers: HargaTier[];
}

const EMPTY: Barang = {
  barcode: "", nama_barang: "", sat: "PCS", hpp: 0,
  harga_1: 0, stok: 0, stok_minimum: 0, harga_tiers: [],
};

function fmt(n: number) { return Number(n).toLocaleString("id-ID"); }

export default function MasterPage() {
  const [data, setData] = useState<Barang[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Barang>(EMPTY);
  const [tiers, setTiers] = useState<HargaTier[]>([]);
  const [editBarcode, setEditBarcode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Barang[]>("/master/barang", { q });
      setData(res);
    } catch (err) { toast((err as Error).message, "error"); }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY); setTiers([]); setEditBarcode(null); setShowModal(true); }
  function openEdit(b: Barang) { setForm(b); setTiers(b.harga_tiers ?? []); setEditBarcode(b.barcode); setShowModal(true); }

  async function handleSave() {
    try {
      const payload = { ...form, harga_tiers: tiers };
      if (editBarcode) await api.put(`/master/barang/${editBarcode}`, payload);
      else await api.post("/master/barang", payload);
      toast(editBarcode ? "Barang diperbarui" : "Barang ditambahkan", "success");
      setShowModal(false);
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function handleDelete(barcode: string) {
    if (!confirm("Hapus barang ini?")) return;
    try {
      await api.delete(`/master/barang?barcode=${encodeURIComponent(barcode)}`);
      toast("Barang dihapus", "success");
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  const columns = [
    { key: "barcode", label: "Barcode", className: "hidden sm:table-cell" },
    { key: "nama_barang", label: "Nama Barang", className: "font-medium" },
    { key: "sat", label: "SAT", className: "hidden sm:table-cell" },
    { key: "hpp", label: "HPP", className: "hidden lg:table-cell", render: (r: Barang) => fmt(r.hpp) },
    { key: "harga_1", label: "Harga 1", className: "hidden md:table-cell", render: (r: Barang) => fmt(r.harga_1) },
    { key: "stok", label: "Stok", render: (r: Barang) => <span className={Number(r.stok) <= Number(r.stok_minimum) ? "text-red-600 font-bold" : ""}>{r.stok}</span> },
    { key: "actions", label: "", render: (r: Barang) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
        <button onClick={() => handleDelete(r.barcode)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const SATUAN = ["PCS","BTL","KG","GR","LTR","ML","BUNGKUS","SACHET","PAK","RENTENG","LUSIN","DUS","KARTON","SLOP","KODI"];

  const F = (key: keyof Barang, label: string, type = "text") => (
    <div key={key}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {key === "sat" ? (
        <>
          <input
            list="satuan-list"
            value={String(form[key])}
            onChange={(e) => setForm({ ...form, sat: e.target.value.toUpperCase() })}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Pilih atau ketik satuan..."
          />
          <datalist id="satuan-list">
            {SATUAN.map((s) => <option key={s} value={s} />)}
          </datalist>
        </>
      ) : (
        <input type={type} value={String(form[key])}
          onChange={(e) => setForm({ ...form, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
          className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
      )}
    </div>
  );

  return (
    <div className="p-5">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Master Barang</h1>
          <p className="text-xs text-gray-500 mt-0.5">Kelola data produk: barcode, harga jual bertingkat (grosir), HPP, dan stok minimum.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm flex-shrink-0">
          <Plus size={14} /> Tambah
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / barcode..."
          className="border rounded px-3 py-1.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-gray-300" />
      </div>
      <DataTable columns={columns} data={data} keyField="barcode" />

      {showModal && (
        <Modal title={editBarcode ? "Edit Barang" : "Tambah Barang"} onClose={() => setShowModal(false)} width="max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {F("barcode", "Barcode")}
            {F("nama_barang", "Nama Barang")}
            {F("sat", "Satuan")}
            {F("hpp", "HPP", "number")}
            {F("harga_1", "Harga 1 (Eceran)", "number")}
            {F("stok", "Stok", "number")}
            {F("stok_minimum", "Stok Minimum", "number")}
          </div>

          {/* Dynamic tiered pricing */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Harga Grosir (Opsional)</label>
              <button
                type="button"
                onClick={() => setTiers([...tiers, { min_qty: 0, harga: 0 }])}
                className="text-xs text-blue-600 hover:underline"
              >
                + Tambah Harga
              </button>
            </div>
            {tiers.length === 0 && (
              <p className="text-xs text-gray-400">Belum ada harga grosir. Klik "+ Tambah Harga" untuk menambah.</p>
            )}
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">Min QTY</label>
                  <input
                    type="number" min="1" value={tier.min_qty}
                    onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, min_qty: Number(e.target.value) || 0 } : t))}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">Harga {i + 2}</label>
                  <input
                    type="number" min="0" value={tier.harga}
                    onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, harga: Number(e.target.value) || 0 } : t))}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                  className="mt-4 text-red-400 hover:text-red-600 text-lg leading-none"
                >×</button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">Simpan</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
