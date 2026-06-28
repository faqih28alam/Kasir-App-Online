"use client";
import { useState, useEffect } from "react";

interface Props {
  productName: string;
  unit: string;
  harga: number;
  initialQty: number;
  initialDiskon: number;
  onConfirm: (qty: number, diskon: number) => void;
  onCancel: () => void;
}

type Mode = "qty" | "diskon" | "nominal";

export function NumpadPopup({ productName, unit, harga, initialQty, initialDiskon, onConfirm, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>("qty");
  const [qty, setQty] = useState(String(initialQty));
  const [diskon, setDiskon] = useState(String(initialDiskon));
  const [nominal, setNominal] = useState("0");

  const value = mode === "qty" ? qty : mode === "diskon" ? diskon : nominal;
  const setValue = mode === "qty" ? setQty : mode === "diskon" ? setDiskon : setNominal;

  const nominalQty = harga > 0 ? Number(nominal) / harga : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === ".") press(".");
      else if (e.key === "Backspace") press("←");
      else if (e.key === "Enter") handleConfirm();
      else if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function press(key: string) {
    if (key === "←") {
      setValue((v) => v.length > 1 ? v.slice(0, -1) : "0");
    } else if (key === ".") {
      if (mode !== "qty") return;
      setValue((v) => v.includes(".") ? v : v + ".");
    } else if (key === "00") {
      setValue((v) => v === "0" ? "0" : v + "00");
    } else {
      setValue((v) => v === "0" ? key : v + key);
    }
  }

  function handleConfirm() {
    const finalDiskon = Number(diskon) || 0;
    const finalQty = mode === "nominal"
      ? Math.round(nominalQty * 1000) / 1000   // max 3 decimal places
      : parseFloat(qty);
    if (finalQty > 0) onConfirm(finalQty, finalDiskon);
  }

  // QTY mode uses "." instead of "00"
  const keys = mode === "qty"
    ? ["1","2","3","4","5","6","7","8","9","0",".","←"]
    : ["1","2","3","4","5","6","7","8","9","0","00","←"];

  const tabs: { key: Mode; label: string; color: string }[] = [
    { key: "qty",     label: "QTY",          color: "bg-gray-800" },
    { key: "diskon",  label: "DISKON (Rp)",   color: "bg-orange-500" },
    { key: "nominal", label: "NOMINAL (Rp)",  color: "bg-blue-600" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-72">

        {/* Header display */}
        <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg min-h-[80px]">
          <p className="text-xs text-gray-400 truncate mb-1">{productName}</p>
          <p className="text-3xl font-bold text-right leading-tight truncate">
            {(mode === "diskon" || mode === "nominal") && <span className="text-base font-normal mr-1">Rp</span>}
            {value}
            {mode === "qty" && <span className="text-lg font-normal ml-1">{unit}</span>}
          </p>
          {mode === "nominal" && harga > 0 && (
            <p className="text-xs text-orange-300 text-right mt-0.5">
              ≈ {(Math.round(nominalQty * 1000) / 1000)} {unit}
            </p>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex border-b text-xs font-semibold">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (mode === "nominal" && nominalQty > 0) {
                  setQty(String(Math.round(nominalQty * 1000) / 1000));
                }
                setMode(t.key);
              }}
              className={`flex-1 py-2.5 transition-colors ${
                mode === t.key
                  ? `${t.color} text-white`
                  : "bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-1 p-3">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded py-3 text-lg font-semibold"
            >
              {k}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <button onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium">✗ Batal</button>
          <button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium">✓ OK</button>
        </div>
      </div>
    </div>
  );
}
