'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';
import type { AuthUser } from '@/types/auth';

interface MobileUserSheetProps {
  open: boolean;
  onClose: () => void;
  user?: AuthUser | null;
}

/** 모바일 상단 우측 프로필 아이콘에서 펼치는 작은 dropdown — 회사명/이메일/로그아웃 */
export function MobileUserSheet({ open, onClose, user = null }: MobileUserSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed top-[52px] right-3 z-50 w-56 rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden lg:hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-text-dark truncate">
            {user?.companyName ?? '사용자'}
          </p>
          <p className="text-xs text-text-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text-dark hover:bg-bg-light transition-colors cursor-pointer"
        >
          <LogOut size={16} className="text-text-muted" />
          <span>로그아웃</span>
        </button>
      </div>
    </>
  );
}
