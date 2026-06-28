"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getUser, clearAuth, AuthUser } from "@/lib/auth";

const NAV = [
  { href: "/kasir",     label: "KASIR",     roles: ["kasir", "admin", "owner"] },
  { href: "/purchas",   label: "PURCHAS",   roles: ["admin", "owner"] },
  { href: "/penjualan", label: "PENJUALAN", roles: ["admin", "owner"] },
  { href: "/keuangan",  label: "KEUANGAN",  roles: ["admin", "owner"] },
  { href: "/laporan",   label: "LAPORAN",   roles: ["admin", "owner"] },
  { href: "/master",    label: "MASTER",    roles: ["admin", "owner"] },
  { href: "/setting",   label: "SETTING",   roles: ["admin", "owner"] },
  { href: "/panduan",   label: "PANDUAN",   roles: ["kasir", "admin", "owner"] },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  const visibleNav = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <nav className="bg-gray-900 text-white flex-shrink-0">
      <div className="px-4 flex items-center h-11 gap-1">
        <span className="text-red-500 font-bold text-sm mr-3 tracking-wide">KASIR APP</span>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
          {visibleNav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                pathname.startsWith(n.href) ? "bg-white text-gray-900" : "text-gray-300 hover:bg-gray-700"
              }`}>
              {n.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-gray-400">
          <span>{user?.nama}</span>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium">
            LOGOFF
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden ml-auto p-1 text-gray-300 hover:text-white">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700 px-4 py-3 flex flex-col gap-1">
          {visibleNav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                pathname.startsWith(n.href) ? "bg-white text-gray-900" : "text-gray-300 hover:bg-gray-700"
              }`}>
              {n.label}
            </Link>
          ))}
          <div className="flex items-center justify-between border-t border-gray-700 mt-2 pt-3">
            <span className="text-xs text-gray-400">{user?.nama}</span>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium">
              LOGOFF
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
