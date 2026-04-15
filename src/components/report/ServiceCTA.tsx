'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ServiceIcon } from '@/components/icons/ServiceIcon';
import { Button } from '@/components/ui/Button';

const ServiceUpgradeModal = dynamic(
  () =>
    import('@/components/client/sidebar/ServiceUpgradeModal').then((m) => m.ServiceUpgradeModal),
  { ssr: false }
);

export function ServiceCTA() {
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches); // eslint-disable-line react-hooks/set-state-in-effect
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-3 lg:gap-4 pt-4">
        <ServiceIcon width={isMobile ? 60 : 89} height={isMobile ? 38 : 57} />
        <div className="flex flex-col gap-1 lg:gap-2 text-center">
          <h3 className="text-sm lg:text-xl font-bold text-text-dark">
            전략 실행이 어렵다면, SIR 팀이 함께 대응합니다.
          </h3>
          <p className="text-xs lg:text-sm text-text-muted">
            위 제안을 기반으로 전문 컨설턴트가 실행 계획을 수립하고 모니터링합니다.
          </p>
        </div>
        <Button
          variant="outlineAccent"
          size="lg"
          onClick={() => setShowModal(true)}
          className="mt-1 lg:mt-2 text-xs lg:text-sm"
        >
          서비스 신청하기
        </Button>
      </section>

      <ServiceUpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="SIR 대응 서비스"
        description="SIR에서 귀사의 SNS를 전략적으로 운영해드립니다."
        subDescription="아래 양식에 맞춰 접수하시면 신속하게 연락드리겠습니다."
      />
    </>
  );
}
