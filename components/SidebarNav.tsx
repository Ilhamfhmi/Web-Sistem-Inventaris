'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Database, Archive, Search } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/',          icon: <Home     size={20} />, label: 'Beranda'        },
  { href: '/unit/UP',   icon: <Database size={20} />, label: 'Unit Pengolah'  },
  { href: '/unit/UK',   icon: <Archive  size={20} />, label: 'Unit Kearsipan' },
  { href: '/pencarian', icon: <Search   size={20} />, label: 'Pencarian'      },
];

export default function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={clsx(
        'flex-1 px-5 space-y-1 overflow-y-auto',
        collapsed && 'lg:px-3'
      )}
    >
      {NAV.map(({ href, icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={clsx(
              'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all group',
              collapsed && 'lg:justify-center lg:px-0 lg:gap-0',
              active
                ? 'text-[#1E3A8A] bg-[#EEF2FF]'
                : 'text-slate-400 hover:text-[#1E3A8A] hover:bg-[#F8F9FB]'
            )}
          >
            {active && (
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#1E3A8A] rounded-r-full" />
            )}
            <span
              className={clsx(
                'transition-opacity flex-shrink-0',
                active ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
              )}
            >
              {icon}
            </span>
            <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}