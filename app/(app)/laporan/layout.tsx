"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/laporan",            label: "Ringkasan" },
  { href: "/laporan/transaksi",  label: "Riwayat Transaksi" },
];

export default function LaporanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-white px-5 flex gap-1 pt-3">
        {TABS.map((t) => {
          const active = t.href === "/laporan" ? pathname === "/laporan" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
