'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { SirLogoIcon } from '@/components/icons/SirLogo.Icon';
import type { LucideIcon } from 'lucide-react';
import type { AuthUser } from '@/types/auth';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: '워크스페이스', href: '/workspace', icon: LayoutDashboard },
  { label: '리스크 관리', href: '/risk-reports', icon: ShieldAlert },
  { label: '유저 관리', href: '/users', icon: Users },
  { label: '모니터링', href: '/ops', icon: Activity },
  { label: '설정', href: '#', icon: Settings, disabled: true },
];

interface AppShellProps {
  children: React.ReactNode;
  user?: AuthUser | null;
}

export function AppShell({ children, user = null }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const initial = user?.companyName?.charAt(0) ?? '?';

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 사이드바 */}
      <aside
        className={`${isOpen ? 'w-56' : 'w-16'} bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-300`}
      >
        {/* 로고 */}
        <div className={`relative flex items-center ${isOpen ? 'px-3 py-3' : 'justify-center py-3'}`}>
          {isOpen ? (
            <Link href="/" className="flex items-center gap-2 px-3 py-2 hover:opacity-80 transition-opacity">
              <SirSymbol size={14} />
              <SirLogoIcon width={48} height={18} />
            </Link>
          ) : (
            <button onClick={() => setIsOpen(true)} className="px-3 py-2 hover:opacity-80 transition-opacity cursor-pointer">
              <SirSymbol size={16} />
            </button>
          )}
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-3 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className={`flex-1 py-2 flex flex-col gap-0.5 ${isOpen ? 'px-2' : 'px-2 items-center'}`}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '#' && pathname?.startsWith(item.href + '/'));

            return (
              <Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                className={`group/item relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
                  isOpen ? 'px-3 py-2.5' : 'w-10 h-10 justify-center'
                } ${
                  item.disabled
                    ? 'text-slate-300 cursor-default'
                    : isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    item.disabled ? 'text-slate-300' : isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {item.label}
                </span>
                {isOpen && item.disabled && (
                  <span className="ml-auto text-[10px] text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full">soon</span>
                )}
                {!isOpen && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                    {item.label}
                    {item.disabled && <span className="ml-1.5 text-slate-400">soon</span>}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 유저 정보 */}
        <div className={`border-t border-slate-100 ${isOpen ? 'px-4 py-4' : 'flex justify-center py-4'}`}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{user?.companyName ?? '사용자'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="text-slate-300 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                aria-label="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logout()}
              className="mx-auto text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
              aria-label="로그아웃"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
