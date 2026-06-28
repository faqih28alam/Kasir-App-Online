import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/shared/Toast";

export const metadata: Metadata = {
  title: "Kasir App",
  description: "Point of Sale System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full flex flex-col antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
