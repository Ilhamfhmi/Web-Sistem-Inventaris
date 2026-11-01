'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { clsx } from 'clsx';
import SidebarNav from '@/components/SidebarNav';
import SidebarLogout from '@/components/SidebarLogout';
import HeaderActions from '@/components/HeaderActions';

const STORAGE_KEY = 'sidoku_sidebar_collapsed';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // collapsed  -> hanya berlaku di desktop (lg ke atas): sidebar jadi mode ikon
  // mobileOpen -> hanya berlaku di mobile/tablet: sidebar jadi drawer
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Baca preferensi tersimpan (client only, supaya tidak hydration mismatch)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }

  // Tutup drawer mobile setiap pindah halaman
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Tutup drawer dengan tombol Esc
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Backdrop (mobile) */}
      <div
        onClick={() => setMobileOpen(false)}
        className={clsx(
          'fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E9ECEF] flex flex-col',
          'transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-72'
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            'p-8 flex items-center justify-between',
            collapsed && 'lg:px-0 lg:justify-center'
          )}
        >
          <div className="flex flex-col">
            <span className="text-2xl font-black text-[#1E3A8A] tracking-tighter leading-none">
              <span className={clsx(collapsed && 'lg:hidden')}>SIDOKU</span>
              {collapsed && <span className="hidden lg:inline">S</span>}
            </span>
            <span
              className={clsx(
                'text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5',
                collapsed && 'lg:hidden'
              )}
            >
              Administrasi Kecamatan
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav collapsed={collapsed} />

        {/* Keluar */}
        <div
          className={clsx(
            'p-6 border-t border-[#E9ECEF]',
            collapsed && 'lg:px-0 lg:flex lg:justify-center'
          )}
        >
          <SidebarLogout collapsed={collapsed} />
        </div>
      </aside>

      {/* Main */}
      <div
        className={clsx(
          'flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          collapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}
      >
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-[#E9ECEF] sticky top-0 z-30 px-4 lg:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Hamburger (mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="lg:hidden flex-shrink-0 text-slate-400 hover:text-[#1E3A8A]"
            >
              <Menu size={22} />
            </button>

            {/* Collapse (desktop) */}
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
              className="hidden lg:flex flex-shrink-0 w-10 h-10 items-center justify-center rounded-xl text-slate-400 hover:text-[#1E3A8A] hover:bg-[#F8F9FB] transition-colors"
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={17}
                />
                <input
                  type="text"
                  placeholder="Cari dokumen, item, atau folder..."
                  className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
                />
              </div>
            </div>
          </div>

          <HeaderActions />
        </header>

        {/* Konten */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}