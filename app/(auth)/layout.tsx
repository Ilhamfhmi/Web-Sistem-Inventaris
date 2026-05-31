import { Search, Menu, X } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import HeaderActions from "@/components/HeaderActions";
import SidebarLogout from "@/components/SidebarLogout";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">

      {/* CSS-only sidebar toggle */}
      <input type="checkbox" id="sidebar-toggle" className="hidden peer/sidebar" />

      {/* Mobile backdrop */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/40 z-40 hidden peer-checked/sidebar:block lg:hidden"
      />

      {/* Sidebar */}
      <aside className="
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E9ECEF] flex flex-col
        -translate-x-full transition-transform duration-300
        peer-checked/sidebar:translate-x-0
        lg:translate-x-0
      ">
        {/* Logo */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-[#1E3A8A] tracking-tighter leading-none">SIDOKU</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5">Administrasi Kecamatan</span>
          </div>
          <label htmlFor="sidebar-toggle" className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={20} />
          </label>
        </div>

        <SidebarNav />

        {/* Keluar */}
        <div className="p-6 border-t border-[#E9ECEF]">
          <SidebarLogout />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">

        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-[#E9ECEF] sticky top-0 z-30 px-4 lg:px-10 flex items-center justify-between gap-4">
          <label htmlFor="sidebar-toggle" className="lg:hidden flex-shrink-0 text-slate-400 hover:text-[#1E3A8A] cursor-pointer">
            <Menu size={22} />
          </label>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={17} />
              <input
                type="text"
                placeholder="Cari dokumen, item, atau folder..."
                className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
              />
            </div>
          </div>

          {/* Kanan */}
          <HeaderActions />
        </header>

        {/* Konten */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}