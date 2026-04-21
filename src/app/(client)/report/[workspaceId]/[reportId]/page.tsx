'use client';
'use no memo';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
import { useReportInfo } from '@/hooks/report/useReportQuery';
import { getClientReportSections } from '@/components/client/sidebar/sections';

const BG_COLORS = {
  'bg-light': 'var(--color-bg-light)',
  blue: '#f5faff',
} as const;

function SectionBg({
  color,
  gradient,
  children,
  id,
}: {
  color: keyof typeof BG_COLORS;
  gradient?: 'from-light' | 'from-blue';
  children: React.ReactNode;
  id?: string;
}) {
  const bg = BG_COLORS[color];
  const gradientFrom =
    gradient === 'from-light'
      ? BG_COLORS['bg-light']
      : gradient === 'from-blue'
        ? BG_COLORS.blue
        : null;

  return (
    <div id={id} style={{ backgroundColor: bg }}>
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
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();
  const { data: report } = useReportInfo(reportId);
  const isDaily = report?.type === 'daily';
  const pdfMode = searchParams?.get('pdf') === '1';

  const allowedIds = new Set(getClientReportSections(isDaily).map((s) => s.id));
  const sectionParam = searchParams?.get('section');
  const activeSection = sectionParam && allowedIds.has(sectionParam) ? sectionParam : 'section-highlight';

  // 첫 fetch 완료 여부 추적 — 섹션 스위칭 전에 데이터 prefetch
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isFetching === 0 && startedRef.current) setReady(true);
  }, [isFetching]);

  // PDF 모드 또는 daily: 모든 섹션을 수직 나열 (탭 없이 하나의 페이지)
  // daily 는 섹션 자체가 적어 탭으로 분리할 이유 없음 — 스크롤 기반 one-page 로 일원화.
  if (pdfMode || isDaily) {
    return (
      <div className="relative">
        {!ready && (
          <div className="absolute inset-0 z-50 bg-bg-light min-h-screen">
            <Loading />
          </div>
        )}
        <div className={`lg:min-w-fit ${ready ? '' : 'invisible'}`}>
          <SectionBg color="bg-light" id="section-highlight">
            <div className="flex flex-col lg:gap-10">
              <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
              <Highlight workspaceId={workspaceId} reportId={reportId} pdfMode={pdfMode} />
            </div>
          </SectionBg>
          <SectionBg color="blue" gradient="from-light" id="section-reputation">
            <OnlineReputation workspaceId={workspaceId} reportId={reportId} pdfMode={pdfMode} />
          </SectionBg>
          {!isDaily && (
            <SectionBg color="bg-light" gradient="from-blue" id="section-top-content">
              <TopContent workspaceId={workspaceId} reportId={reportId} />
            </SectionBg>
          )}
          <SectionBg color="blue" gradient={isDaily ? undefined : 'from-light'} id="section-risk">
            <RiskContent workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
          {!isDaily && (
            <SectionBg color="bg-light" gradient="from-blue" id="section-strategy">
              <Strategy workspaceId={workspaceId} reportId={reportId} />
            </SectionBg>
          )}
          <SectionBg color="blue" gradient={isDaily ? undefined : 'from-light'}>
            <ServiceCTA />
            <ReportDisclaimer />
          </SectionBg>
        </div>
      </div>
    );
  }

  // 탭 모드: ReportHeader 고정 + 선택 섹션만 렌더 (weekly / initial)
  return (
    <div className="relative">
      {!ready && (
        <div className="absolute inset-0 z-50 bg-bg-light min-h-screen">
          <Loading />
        </div>
      )}
      <div className={`lg:min-w-fit ${ready ? '' : 'invisible'}`}>
        <SectionBg color="bg-light">
          <div className="flex flex-col lg:gap-10">
            <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
            {activeSection === 'section-highlight' && (
              <Highlight workspaceId={workspaceId} reportId={reportId} />
            )}
          </div>
        </SectionBg>
        {activeSection === 'section-reputation' && (
          <SectionBg color="blue" gradient="from-light">
            <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
        )}
        {activeSection === 'section-top-content' && !isDaily && (
          <SectionBg color="bg-light" gradient="from-blue">
            <TopContent workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
        )}
        {activeSection === 'section-risk' && (
          <SectionBg color="blue" gradient={isDaily ? undefined : 'from-light'}>
            <RiskContent workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
        )}
        {activeSection === 'section-strategy' && !isDaily && (
          <SectionBg color="bg-light" gradient="from-blue">
            <Strategy workspaceId={workspaceId} reportId={reportId} />
          </SectionBg>
        )}
        <SectionBg color="blue" gradient={isDaily ? undefined : 'from-light'}>
          <ServiceCTA />
          <ReportDisclaimer />
        </SectionBg>
      </div>
    </div>
  );
}
