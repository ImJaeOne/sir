'use client';

import { X } from 'lucide-react';

interface ServiceUpgradeModalProps {
  onClose: () => void;
}

export function ServiceUpgradeModal({ onClose }: ServiceUpgradeModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-dark">서비스 업그레이드</h3>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-dark transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-text-muted leading-relaxed">
            업그레이드 안내 내용이 여기에 들어갑니다.
          </p>
        </div>
      </div>
    </>
  );
}
