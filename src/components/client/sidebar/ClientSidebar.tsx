'use client';

import { useState } from 'react';
import { ReportSelector } from '@/components/client/sidebar/ReportSelector';
import { PdfDownloadButton } from '@/components/client/sidebar/PdfDownloadButton';
import { ServiceUpgradeButton } from '@/components/client/sidebar/ServiceUpgradeButton';
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
      className={`${isOpen ? 'w-60 px-2' : 'w-14'} border-r border-border-light bg-bg-white flex flex-col shrink-0 transition-all duration-300`}
    >
      <SidebarLogo isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)} />
      <SidebarSectionNav isOpen={isOpen} />
      {isOpen && (
        <div className="flex flex-col gap-2 w-full items-center mb-6">
          <PdfDownloadButton />
          <ReportSelector />
          <ServiceUpgradeButton />
          <div className="flex flex-col text-text-muted text-[10px] items-center font-extralight">
            <p>SIR 서비스에 사용된 데이터는 최근 3년까지만</p>
            <p>보관되며 순차적으로 삭제됩니다.</p>
          </div>
        </div>
      )}
      <SidebarUserInfo isOpen={isOpen} user={user} />
    </aside>
  );
}
