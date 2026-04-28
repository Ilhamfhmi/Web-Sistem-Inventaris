import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { 
  Home, 
  Database, 
  Archive, 
  Box, 
  BarChart3, 
  LogOut,
  Bell,
  Settings,
  Search
} from "lucide-react";
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: "SIDOKU | Sistem Informasi Dokumen Kecamatan",
  description: "Audit & Monitoring Sistem Dokumen Terpadu Kecamatan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FB] text-[#1A1C1E] antialiased flex">
        <SidebarWrapper />

        {/* Main Content Area */}
        <div className="flex-1 ml-72 flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-20 bg-white border-b border-[#E9ECEF] sticky top-0 z-40 px-10 flex items-center justify-between">
            <div className="max-w-xl w-full">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Cari dokumen atau nomor registrasi..."
                  className="w-full bg-[#F8F9FB] border-none rounded-2xl py-3 pl-14 pr-6 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-5">
                <button className="relative text-slate-400 hover:text-[#1E3A8A] transition-colors">
                  <Bell size={22} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                </button>
                <button className="text-slate-400 hover:text-[#1E3A8A] transition-colors">
                  <Settings size={22} />
                </button>
              </div>
              <div className="h-10 w-[1px] bg-[#E9ECEF]" />
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-[#1A1C1E] leading-none">Admin Unit A</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Pengolah Dokumen</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-[#E9ECEF] flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

// Separate component for sidebar to use usePathname
function SidebarWrapper() {
  return (
    <aside className="w-72 bg-white border-r border-[#E9ECEF] flex flex-col fixed inset-y-0 z-50">
      <div className="p-10">
        <div className="flex flex-col">
          <span className="text-3xl font-black text-[#1E3A8A] tracking-tighter leading-none">SIDOKU</span>
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">Administrasi Kecamatan</span>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-1.5">
        <SidebarLink href="/" icon={<Home size={22} />} label="Beranda" />
        <SidebarLink href="/unit/UP" icon={<Database size={22} />} label="Unit Pengolah" />
        <SidebarLink href="/unit/UK" icon={<Archive size={22} />} label="Unit Kearsipan" />
        <SidebarLink href="#" icon={<Box size={22} />} label="Inventori" />
        <SidebarLink href="#" icon={<BarChart3 size={22} />} label="Monitoring" />
      </nav>

      <div className="p-8 border-t border-[#E9ECEF]">
        <button className="flex items-center gap-4 text-rose-500 font-black text-sm hover:translate-x-1 transition-all">
          <LogOut size={22} /> Keluar
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  // In a real app we'd use usePathname() from next/navigation
  // For now I'll just check if it's Beranda or Units
  const isActive = href === '/'; // Simplified for now
  
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all group relative ${
        isActive 
          ? 'text-[#1E3A8A] bg-[#EEF2FF]' 
          : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-[#F8F9FB]'
      }`}
    >
      {isActive && <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-[#1E3A8A] rounded-r-full" />}
      <span className={`${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} transition-opacity`}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
