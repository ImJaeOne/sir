'use client';

import { LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import type { AuthUser } from '@/types/auth';

interface SidebarUserInfoProps {
  isOpen: boolean;
  user?: AuthUser | null;
}

export function SidebarUserInfo({ isOpen, user = null }: SidebarUserInfoProps) {
  return (
    <div className={`flex items-center py-4 ${isOpen ? 'gap-2.5 px-5' : 'justify-center px-3'}`}>
      {isOpen && (
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm font-medium text-text-dark truncate">
            {user?.displayName ?? '사용자'}
          </p>
          <p className="text-xs text-text-muted truncate">{user?.email}</p>
        </div>
      )}
      <button
        onClick={() => logout()}
        className="text-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0"
        aria-label="로그아웃"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
