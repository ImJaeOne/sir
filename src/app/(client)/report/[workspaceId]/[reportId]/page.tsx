'use client';
'use no memo';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { ServiceCTA } from '@/components/report/ServiceCTA';
import { ReportDisclaimer } from '@/components/report/ReportDisclaimer';
import { Loading } from '@/components/ui/Loading';

const BG_COLORS = {
  'bg-light': 'var(--color-bg-light)',
  blue: '#f5faff',
} as const;

function SectionBg({
  color,
  gradient,
  children,
}: {
  color: keyof typeof BG_COLORS;
  gradient?: 'from-light' | 'from-blue';
  children: React.ReactNode;
}) {
  const bg = BG_COLORS[color];
  const gradientFrom =
    gradient === 'from-light'
      ? BG_COLORS['bg-light']
      : gradient === 'from-blue'
        ? BG_COLORS.blue
        : null;

  return (
    <div style={{ backgroundColor: bg }}>
      {gradientFrom && (
        <div
          className="h-6 lg:h-20"
          style={{ background: `linear-gradient(to bottom, ${gradientFrom}, ${bg})` }}
        />
      )}
      <div className="mx-auto w-full lg:w-[1200px] px-4 lg:px-10 py-5">{children}</div>
    </div>
  );
}

export default function ClientReportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();

  // 첫 fetch 완료 여부 추적: sections를 항상 mount해서 쿼리를 발사하되,
  // 첫 fetch가 끝날 때까지는 invisible로 숨김 (DOM 유지 → scroll 위치 보존)
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFetching === 0 && startedRef.current) setReady(true);
  }, [isFetching]);

  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 z-50 bg-bg-light min-h-screen">
          <Loading />
        </div>
      )}
      <div className={`lg:min-w-fit ${ready ? '' : 'invisible'}`}>
        <SectionBg color="bg-light">
          <section id="section-highlight" className="flex flex-col lg:gap-10">
            <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
            <Highlight workspaceId={workspaceId} reportId={reportId} />
          </section>
        </SectionBg>
        <SectionBg color="blue" gradient="from-light">
          <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="bg-light" gradient="from-blue">
          <TopContent workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="blue" gradient="from-light">
          <RiskContent workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="bg-light" gradient="from-blue">
          <Strategy workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="blue" gradient="from-light">
          <ServiceCTA />
          <ReportDisclaimer />
        </SectionBg>
      </div>
    </div>
  );
}
