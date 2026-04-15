'use client';

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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
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
          {title && <h2 className="text-base font-bold text-text-dark">{title}</h2>}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-dark transition-colors cursor-pointer ml-auto"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* body (scrollable) */}
        <div className="flex flex-col gap-4 px-6 py-2 overflow-y-auto flex-1">{children}</div>

        {/* footer (fixed) */}
        {footer && (
          <div className="flex justify-end gap-2 px-6 pt-4 pb-6 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
