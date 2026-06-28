import { Navbar } from "@/components/shared/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto">{children}</main>
      <footer className="shrink-0 border-t bg-white px-4 py-1.5 text-center text-xs text-gray-400">
        Built by{" "}
        <a
          href="https://faqihalam.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors"
        >
          faqih28alam
        </a>
      </footer>
    </div>
  );
}
