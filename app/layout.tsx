import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIDOKU | Sistem Informasi Dokumen Kecamatan",
  description: "Audit & Monitoring Sistem Dokumen Terpadu Kecamatan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8F9FB] text-[#1A1C1E] antialiased">
        {children}
      </body>
    </html>
  );
}