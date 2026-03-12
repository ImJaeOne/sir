'use client';

import { useEffect } from 'react';
import { AppHeader } from '@/components/ui/AppHeader';
import { Sidebar } from '@/components/ui/Sidebar';
import { useSidebarStore } from '@/store/sidebar';
import type { AuthUser } from '@/types/auth';

interface AppShellProps {
  children: React.ReactNode;
  user?: AuthUser | null;
}

export function AppShell({ children, user = null }: AppShellProps) {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const open = useSidebarStore((s) => s.open);
  const close = useSidebarStore((s) => s.close);

  // Desktop: open by default / Mobile: closed by default
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) open();
      else close();
    };

    handleChange(mql);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <AppHeader user={user} />
      <Sidebar />

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300
          ${isOpen ? 'lg:ml-56' : 'lg:ml-14'}
        `}
      >
        {children}
      </main>
    </div>
  );
}
