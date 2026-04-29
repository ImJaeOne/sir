'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASS: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  // 제목 우측에 붙는 작은 보조 노드 (Tooltip 등)
  titleAccessory?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  titleAccessory,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  // Esc 닫기 — open 동안만 리스너 부착
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${SIZE_CLASS[size]} mx-4 max-h-[90vh] flex flex-col overflow-hidden`}
      >
        {/* header (fixed) */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          {title && (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-base font-bold text-text-dark truncate">{title}</h2>
              {titleAccessory}
            </div>
          )}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-dark transition-colors cursor-pointer ml-auto"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* body (scrollable) — footer 부재 시 바닥 padding 자동 보강 */}
        <div
          className={`flex flex-col gap-4 px-6 pt-2 overflow-y-auto flex-1 ${
            footer ? 'pb-2' : 'pb-6'
          }`}
        >
          {children}
        </div>

        {/* footer (fixed) */}
        {footer && (
          <div className="flex justify-end gap-2 px-6 pt-4 pb-6 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
