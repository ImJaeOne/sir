'use client';

import { useState, useEffect } from 'react';
import { ServiceIcon } from '@/components/icons/ServiceIcon';
import { Button } from '@/components/ui/Button';
import { openContactPage } from '@/lib/contact';

export function ServiceCTA() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches); // eslint-disable-line react-hooks/set-state-in-effect
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-3 lg:gap-4 pt-4">
      <ServiceIcon width={isMobile ? 60 : 89} height={isMobile ? 38 : 57} />
      <div className="flex flex-col gap-1 lg:gap-2 text-center">
        <h3 className="text-sm lg:text-xl font-bold text-text-dark">
          SIR 팀에 기업 평판 관리를 맡겨보세요.
        </h3>
        <p className="text-xs lg:text-sm text-text-muted">
          평판 관리부터 전략 수립 및 실행까지 원스톱 서비스를 제공합니다.
        </p>
      </div>
      <Button
        variant="outlineAccent"
        size="lg"
        onClick={openContactPage}
        className="mt-1 lg:mt-2 text-xs lg:text-sm"
      >
        서비스 신청하기
      </Button>
    </section>
  );
}
