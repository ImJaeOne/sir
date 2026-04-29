'use client';

import { ChevronLeft } from 'lucide-react';
import { SirSymbol } from '@/components/icons/SirSymbol';
import { SirLogoIcon } from '@/components/icons/SirLogo.Icon';

interface SidebarLogoProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarLogo({ isOpen, onToggle }: SidebarLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${isOpen ? 'pt-8 pb-4' : 'pt-4'}`}>
      {isOpen ? (
        <div className="flex items-center gap-2.5 pr-4">
          <SirSymbol size={18} />
          <SirLogoIcon width={60} height={24} />
        </div>
      ) : (
        <button onClick={onToggle} className="hover:opacity-80 transition-opacity cursor-pointer">
          <SirSymbol size={20} />
        </button>
      )}
      {isOpen && (
        <button
          onClick={onToggle}
          className="absolute right-3 text-text-muted hover:text-text-dark transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
  );
}
