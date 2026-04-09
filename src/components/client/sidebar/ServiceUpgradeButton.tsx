'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const ServiceUpgradeModal = dynamic(
  () =>
    import('@/components/client/sidebar/ServiceUpgradeModal').then((m) => m.ServiceUpgradeModal),
  { ssr: false }
);

export function ServiceUpgradeButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="px-3 w-full">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center gap-2.5 rounded-lg text-sm bg-bg-dark transition-colors cursor-pointer justify-center px-3 py-2.5"
        >
          <span className="text-white font-semibold text-center">서비스 업그레이드</span>
        </button>
      </div>

      {showModal && <ServiceUpgradeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
