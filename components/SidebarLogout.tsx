'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function SidebarLogout() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 text-rose-500 font-black text-sm hover:translate-x-1 transition-all"
    >
      <LogOut size={18} /> Keluar
    </button>
  );
}