"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/shared/Toast";
import { Modal } from "@/components/shared/Modal";

interface Item {
  nama_barang: string;
  qty: number;
  sat: string;
  harga: number;
  diskon: number;
  total: number;
}

interface Props {
  noTransaksi: string;
  tanggal: string;
  kasir: string;
  items: Item[];
  total: number;
  bayar: number;
  kembalian: number;
  storeName: string;
  storeAddress?: string;
  storeTelepon?: string;
  footer?: string;
  logoUrl?: string;
  transaksiId?: number;
  onClose: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

export function ReceiptPreview({
  noTransaksi, tanggal, kasir, items, total, bayar, kembalian,
  storeName, storeAddress, storeTelepon, footer, logoUrl, transaksiId, onClose,
}: Props) {
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (!transaksiId) return;
    setPrinting(true);
    try {
      await api.post(`/print/receipt/${transaksiId}`, {});
      toast("Struk dicetak", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal title="Struk Transaksi" onClose={onClose} width="max-w-sm">
      <div className="font-mono text-xs bg-gray-50 p-4 rounded border">
        {logoUrl && (
          <div className="flex justify-center mb-1">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-16 max-w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <p className="text-center font-bold text-sm">{storeName}</p>
        {storeAddress && <p className="text-center">{storeAddress}</p>}
        {storeTelepon && <p className="text-center">Telp: {storeTelepon}</p>}
        <p className="text-center">{"=".repeat(32)}</p>
        <p>No : {noTransaksi}</p>
        <p>Tgl: {tanggal}</p>
        <p>Kasir: {kasir}</p>
        <p>{"-".repeat(32)}</p>
        {items.map((item, i) => (
          <div key={i}>
            <p className="truncate">{item.nama_barang}</p>
            <div className="flex justify-between">
              <span>{item.qty} {item.sat} x {fmt(item.harga)}</span>
              <span>{fmt(item.qty * item.harga)}</span>
            </div>
            {item.diskon > 0 && (
              <div className="flex justify-between text-red-600">
                <span>  Diskon</span>
                <span>-{fmt(item.diskon)}</span>
              </div>
            )}
          </div>
        ))}
        <p>{"-".repeat(32)}</p>
        <div className="flex justify-between font-bold"><span>Total</span><span>{fmt(total)}</span></div>
        <div className="flex justify-between"><span>Bayar</span><span>{fmt(bayar)}</span></div>
        <div className="flex justify-between"><span>Kembali</span><span>{fmt(kembalian)}</span></div>
        <p>{"=".repeat(32)}</p>
        <p className="text-center">{footer ?? "Terima Kasih!"}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded text-sm font-medium">
          Tutup
        </button>
        <button onClick={handlePrint} disabled={printing || !transaksiId}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-2 rounded text-sm font-medium">
          {printing ? "Mencetak..." : "Cetak Struk"}
        </button>
      </div>
    </Modal>
  );
}
