'use client';
'use no memo';

import { Suspense, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { ServiceCTA } from '@/components/report/ServiceCTA';
import { ReportDisclaimer } from '@/components/report/ReportDisclaimer';
import { Loading } from '@/components/ui/Loading';
import { useReportInfoSuspense } from '@/hooks/report/useReportQuery';
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
  // 서버: QueryClient 캐시 비어있어 Loading fallback / 클라이언트: 기존 세션 캐시로 즉시 렌더
  // → hydration mismatch 방지 위해 mount 전까지 서버와 동일하게 Loading 만 렌더
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // eslint-disable-line react-hooks/set-state-in-effect
  if (!mounted) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <ClientReportContent />
    </Suspense>
  );
}

function ClientReportContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const { data: report } = useReportInfoSuspense(reportId);
  const isDaily = report?.type === 'daily';
  const pdfMode = searchParams?.get('pdf') === '1';

  const sections = getClientReportSections(report?.type);
  const allowedIds = new Set(sections.map((s) => s.id));
  const sectionParam = searchParams?.get('section');
  const activeSection =
    sectionParam && allowedIds.has(sectionParam) ? sectionParam : 'section-highlight';

  const handleTabClick = (id: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.set('section', id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    // 섹션 전환 시 스크롤 최상단으로 — ClientShell 의 <main id="client-main"> 가 실제 스크롤 컨테이너
    document.getElementById('client-main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 주간/월간 PDF: 모든 섹션 bg-light 통일 (인쇄물 톤)
  if (pdfMode && !isDaily) {
    return (
      <div className="lg:min-w-fit">
        <SectionBg color="bg-light" id="section-highlight">
          <div className="flex flex-col lg:gap-10">
            <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
            <Highlight workspaceId={workspaceId} reportId={reportId} pdfMode />
          </div>
        </SectionBg>
        <SectionBg color="bg-light" id="section-reputation">
          <OnlineReputation workspaceId={workspaceId} reportId={reportId} pdfMode />
        </SectionBg>
        <SectionBg color="bg-light" id="section-risk">
          <RiskContent workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="bg-light" id="section-strategy">
          <Strategy workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="bg-light">
          <ServiceCTA />
          <ReportDisclaimer />
        </SectionBg>
      </div>
    );
  }

  // 일간: 섹션 적어 one-page 알터네이팅 (Strategy 없음)
  if (isDaily) {
    return (
      <div className="lg:min-w-fit">
        <SectionBg color="bg-light" id="section-highlight">
          <div className="flex flex-col lg:gap-10">
            <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
            <Highlight workspaceId={workspaceId} reportId={reportId} pdfMode={pdfMode} />
          </div>
        </SectionBg>
        <SectionBg color="blue" gradient="from-light" id="section-reputation">
          <OnlineReputation workspaceId={workspaceId} reportId={reportId} pdfMode={pdfMode} />
        </SectionBg>
        <SectionBg color="bg-light" gradient="from-blue" id="section-risk">
          <RiskContent workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
        <SectionBg color="blue" gradient="from-light">
          <ServiceCTA />
          <ReportDisclaimer />
        </SectionBg>
      </div>
    );
  }

  // 탭 모드: ReportHeader 고정 + 선택 섹션만 렌더 (weekly / initial)
  return (
    <div className="lg:min-w-fit">
      <SectionBg color="bg-light">
        <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
      </SectionBg>

      {/* 섹션 탭 — 모든 SectionBg 바깥에 두어 스크롤 전 구간에서 sticky 유효.
          모바일은 MobileFab(ClientShell) 이 섹션 이동을 담당하므로 lg 이상에서만 노출. */}
      <div
        className="hidden lg:block sticky top-0 z-20 w-full border-b border-slate-200"
        style={{ backgroundColor: 'var(--color-bg-light)' }}
      >
        <div className="mx-auto w-full lg:w-[1200px] px-4 lg:px-10">
          <div className="flex gap-1">
            {sections.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleTabClick(s.id)}
                  className={`lg:flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'border-slate-700 text-slate-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <s.Icon size={16} color={active ? '#1E293B' : '#828EA6'} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 주간/월간 탭 모드에서는 섹션 간 배경 구분 없이 단일 bg-light 유지 */}
      {activeSection === 'section-highlight' && (
        <SectionBg color="bg-light">
          <Highlight workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
      )}
      {activeSection === 'section-reputation' && (
        <SectionBg color="bg-light">
          <OnlineReputation workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
      )}
      {activeSection === 'section-risk' && (
        <SectionBg color="bg-light">
          <RiskContent workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
      )}
      {activeSection === 'section-strategy' && !isDaily && (
        <SectionBg color="bg-light">
          <Strategy workspaceId={workspaceId} reportId={reportId} />
        </SectionBg>
      )}
      <SectionBg color="bg-light">
        <ServiceCTA />
        <ReportDisclaimer />
      </SectionBg>
    </div>
  );
}
