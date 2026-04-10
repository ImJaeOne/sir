'use client';

import { Modal } from '@/components/ui/Modal';

interface ServiceUpgradeModalProps {
  onClose: () => void;
}

export function ServiceUpgradeModal({ onClose }: ServiceUpgradeModalProps) {
  return (
    <Modal open onClose={onClose} title="서비스 업그레이드" size="md">
      <p className="text-sm text-text-muted leading-relaxed">
        업그레이드 안내 내용이 여기에 들어갑니다.
      </p>
    </Modal>
  );
}
