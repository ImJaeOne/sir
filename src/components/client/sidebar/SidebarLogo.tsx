'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { SirLogoIcon } from '@/components/icons/SirLogo.Icon';

interface SidebarLogoProps {
  isOpen: boolean;
  reportHref: string;
  onToggle: () => void;
}

export function SidebarLogo({ isOpen, reportHref, onToggle }: SidebarLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${isOpen ? 'pt-8 pb-4' : 'pt-4'}`}>
      {isOpen ? (
        reportHref ? (
          <Link
            href={reportHref}
            aria-label="보고서로 이동"
            className="flex items-center gap-2.5 pr-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <SirSymbol size={18} />
            <SirLogoIcon width={60} height={24} />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 pr-4" aria-label="보고서로 이동할 수 없음">
            <SirSymbol size={18} />
            <SirLogoIcon width={60} height={24} />
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label="사이드바 펼치기"
          className="hover:opacity-80 transition-opacity cursor-pointer"
        >
          <SirSymbol size={20} />
        </button>
      )}
      {isOpen && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="사이드바 접기"
          className="absolute right-3 text-text-muted hover:text-text-dark transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
  );
}
