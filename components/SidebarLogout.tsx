'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export default function SidebarLogout({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title={collapsed ? 'Keluar' : undefined}
      aria-label="Keluar"
      className={clsx(
        'flex items-center gap-3 text-rose-500 font-black text-sm transition-all',
        collapsed ? 'lg:justify-center lg:gap-0' : 'hover:translate-x-1'
      )}
    >
      <LogOut size={18} className="flex-shrink-0" />
      <span className={clsx(collapsed && 'lg:hidden')}>Keluar</span>
    </button>
  );
}