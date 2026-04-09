'use client';

import { useState } from 'react';
import { ReportSelector } from '@/components/client/sidebar/ReportSelector';
import { SidebarLogo } from '@/components/client/sidebar/SidebarLogo';
import { SidebarSectionNav } from '@/components/client/sidebar/SidebarSectionNav';
import { SidebarUserInfo } from '@/components/client/sidebar/SidebarUserInfo';
import type { AuthUser } from '@/types/auth';

interface ClientSidebarProps {
  user?: AuthUser | null;
}

export function ClientSidebar({ user = null }: ClientSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={`${isOpen ? 'w-56' : 'w-14'} border-r border-border-light bg-bg-white flex flex-col shrink-0 transition-all duration-300`}
    >
      <SidebarLogo isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
      <SidebarSectionNav isOpen={isOpen} />
      {isOpen && <ReportSelector />}
      <SidebarUserInfo isOpen={isOpen} user={user} />
    </aside>
  );
}
