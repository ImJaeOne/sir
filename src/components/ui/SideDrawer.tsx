'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** 데스크톱 폭. 모바일은 전체 폭 차지. */
  width?: number;
  children: React.ReactNode;
}

/** 우측에서 슬라이드인 되는 오버레이 drawer.
 *  뒷배경은 dim 처리하되 메인 콘텐츠는 그대로 두고 위에 떠 있다.
 *  Modal 과 동일하게 backdrop 클릭 / Esc 로 닫힘. */
export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // open=false 시에도 마운트 유지해 슬라이드 아웃 transition 이 보이도록 한다.
  return (
    <div
      className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* backdrop — dim. Modal(/40) 보다 옅게(/30) 잡아 메인 차트 컨텍스트 유지. */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        style={{ width: `min(100vw, ${width}px)` }}
        className={`absolute right-0 top-0 h-full bg-white shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0 flex-1">
            {title && (
              <div className="text-[15px] font-bold text-slate-900 truncate">{title}</div>
            )}
            {subtitle && (
              <div className="text-[12px] text-slate-500 mt-0.5">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* body — overflow 제어는 children 측에 맡긴다 (헤더는 고정, 일부만 스크롤시키는 케이스 위해). */}
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
