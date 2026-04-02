'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/store/sidebar';
import {
  Home,
  LayoutDashboard,
  Activity,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: '홈', href: '/', icon: Home },
  { label: '워크스페이스', href: '/workspace', icon: LayoutDashboard },
  { label: '모니터링', href: '#', icon: Activity, disabled: true },
  { label: '설정', href: '#', icon: Settings, disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-[49px] left-0 z-30 h-[calc(100vh-49px)] bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? 'w-56' : 'w-0 lg:w-14'}
          ${isOpen ? '' : 'overflow-hidden lg:overflow-visible'}
        `}
      >
        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '#' && pathname?.startsWith(item.href + '/'));

            return (
              <Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) close();
                }}
                className={`group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.disabled
                    ? 'text-slate-300 cursor-default'
                    : isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    item.disabled
                      ? 'text-slate-300'
                      : isActive
                        ? 'text-blue-600'
                        : 'text-slate-400'
                  }`}
                />

                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'
                  }`}
                >
                  {item.label}
                </span>

                {isOpen && item.disabled && (
                  <span className="ml-auto text-[10px] text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full">
                    soon
                  </span>
                )}

                {/* Tooltip for collapsed state (desktop) */}
                {!isOpen && (
                  <div className="hidden lg:block absolute left-14 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                    {item.label}
                    {item.disabled && (
                      <span className="ml-1.5 text-slate-400">· soon</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
