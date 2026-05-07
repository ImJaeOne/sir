'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { SirLogoIcon } from '@/components/icons/SirLogo.Icon';
import { ReportSelector } from '@/components/client/sidebar/ReportSelector';
import { PdfDownloadButton } from '@/components/client/sidebar/PdfDownloadButton';
import { MobileUserSheet } from '@/components/client/MobileUserSheet';
import type { AuthUser } from '@/types/auth';

interface MobileHeaderProps {
  user?: AuthUser | null;
}

export function MobileHeader({ user = null }: MobileHeaderProps) {
  const pathname = usePathname() ?? '';
  const onReportPath = pathname.startsWith('/report/');
  const [userSheetOpen, setUserSheetOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 pl-1">
          <SirSymbol size={16} />
          <SirLogoIcon width={48} height={18} />
        </div>
        <div className="flex items-center gap-0.5">
          {onReportPath && (
            <>
              <ReportSelector variant="icon" />
              <PdfDownloadButton variant="icon" />
            </>
          )}
          <button
            onClick={() => setUserSheetOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-light transition-colors cursor-pointer"
            aria-label="내 정보"
          >
            <User size={18} />
          </button>
        </div>
      </header>
      <MobileUserSheet open={userSheetOpen} onClose={() => setUserSheetOpen(false)} user={user} />
    </>
  );
}
