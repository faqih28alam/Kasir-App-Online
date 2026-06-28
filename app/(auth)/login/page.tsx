"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth, AuthUser } from "@/lib/auth";
import { toast } from "@/components/shared/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const namaToko = "Toko Makmur Jaya";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string; user: AuthUser }>("/auth/login", form);
      saveAuth(res.access_token, res.user);
      router.push("/kasir");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1f2e] gap-6">
      {/* Brand */}
      <h1 className="text-3xl font-extrabold tracking-widest text-[#e8473f] uppercase select-none">
        Kasir App
      </h1>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#1a1f2e] rounded-2xl w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={1.5}>
              <rect x="2" y="3" width="20" height="14" rx="2" strokeLinejoin="round" />
              <path d="M8 21h8M12 17v4" strokeLinecap="round" />
              <path d="M6 8h.01M6 11h.01M9 8h6M9 11h6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Store name from settings */}
        <h2 className="text-lg font-bold text-gray-800 text-center">{namaToko}</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Masuk untuk melanjutkan</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              autoFocus
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-700 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 mt-1"
          >
            {loading ? "Masuk..." : "MASUK"}
          </button>
        </form>

        <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-1">Demo credentials</p>
          <p className="text-xs text-blue-600">Owner: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
          <p className="text-xs text-blue-600">Kasir: <span className="font-mono">kasir</span> / <span className="font-mono">kasir123</span></p>
        </div>
      </div>

      {/* Developer credit */}
      <p className="text-xs text-gray-500">
        Built by{" "}
        <a
          href="https://faqihalam.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-[#e8473f] transition-colors"
        >
          faqih28alam
        </a>
      </p>
    </div>
  );
}
