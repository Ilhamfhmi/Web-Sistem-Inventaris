'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Database, Archive, Search } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',           icon: <Home     size={20} />, label: 'Beranda'        },
  { href: '/unit/UP',    icon: <Database size={20} />, label: 'Unit Pengolah'  },
  { href: '/unit/UK',    icon: <Archive  size={20} />, label: 'Unit Kearsipan' },
  { href: '/pencarian',  icon: <Search   size={20} />, label: 'Pencarian'      },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-5 space-y-1 overflow-y-auto">
      {NAV.map(({ href, icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href) && href !== '#';
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all group',
              active
                ? 'text-[#1E3A8A] bg-[#EEF2FF]'
                : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-[#F8F9FB]'
            )}
          >
            {active && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#1E3A8A] rounded-r-full" />
            )}
            <span className={clsx('transition-opacity flex-shrink-0', active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100')}>
              {icon}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}