'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Check } from 'lucide-react';
import { ReportHeader } from '@/components/report/ReportHeader';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { Strategy } from '@/components/report/Strategy';
import { Loading } from '@/components/ui/Loading';
import { AdminButton } from '@/components/ui/AdminButton';
import { useWorkspace, useReportProgress, useReportRealtimeSync } from '@/hooks/workspace/useWorkspaceQuery';
import { useReportInfo } from '@/hooks/report/useReportQuery';
import { usePublishReport } from '@/hooks/report/useReportMutation';
import { getClientReportSections } from '@/components/client/sidebar/sections';
import { ACTIVE_PLATFORMS, isAllPlatformsDone } from '@/lib/api/workspaceApi';
import { AlertCircle } from 'lucide-react';

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

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
          className="h-10"
          style={{ background: `linear-gradient(to bottom, ${gradientFrom}, ${bg})` }}
        />
      )}
      <div className="mx-auto max-w-[1200px] px-10 py-5">{children}</div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const isFetching = useIsFetching();
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: report } = useReportInfo(reportId);
  const { data: progressList } = useReportProgress(workspaceId);
  useReportRealtimeSync(workspaceId);
  const publishMutation = usePublishReport(reportId);

  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isFetching > 0) startedRef.current = true;
    if (isFetching === 0 && startedRef.current) setReady(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isFetching]);

  const isPublished = report?.status === 'published';
  const isDraft = report?.status === 'draft';
  const isDaily = report?.type === 'daily';

  // 활성 플랫폼 중 실패/미완료 확인 — 발행 게이트
  const progress = progressList?.find((p) => p.reportId === reportId);
  const platformsOk = isAllPlatformsDone(progress);
  const failedPlatforms = useMemo(() => {
    if (!progress) return [] as string[];
    const map = new Map(progress.sessions.map((s) => [s.platform_id, s]));
    return ACTIVE_PLATFORMS.filter((p) => map.get(p)?.status !== 'done');
  }, [progress]);

  const sections = useMemo(() => getClientReportSections(isDaily), [isDaily]);
  const sectionParam = searchParams?.get('section');
  const activeSection = sectionParam && sections.some((s) => s.id === sectionParam)
    ? sectionParam
    : sections[0]?.id ?? 'section-highlight';

  const handleTabClick = (id: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.set('section', id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  if (!ready) return <Loading />;

  return (
    <div className="min-h-full bg-slate-100 px-6 pt-8 lg:px-10 lg:pt-10 pb-0">
      <div className="mx-auto max-w-[1280px] flex flex-col gap-4">
        {/* 상단 바 */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link href="/workspace" className="text-text-muted hover:text-text-dark transition-colors">
              워크스페이스
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <Link href={`/workspace/${workspaceId}`} className="text-text-muted hover:text-text-dark transition-colors">
              {workspace?.company_name ?? '...'}
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-700 font-semibold">보고서</span>
          </nav>
          <Link
            href={`/report/${workspaceId}/${reportId}`}
            target="_blank"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            보고서 보기
            <ExternalLink
              size={13}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>

        {/* 섹션 탭 */}
        <div className="flex gap-1 border-b border-slate-200">
          {sections.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleTabClick(s.id)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                  active
                    ? 'border-slate-700 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* 종이 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_40px_rgba(0,0,0,0.08)] overflow-hidden">
          <SectionBg color="bg-light">
            <div className="flex flex-col gap-10">
              <ReportHeader workspaceId={workspaceId} reportId={reportId} showPdfButton={false} />
              {activeSection === 'section-highlight' && (
                <Highlight workspaceId={workspaceId} reportId={reportId} editable />
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
              <RiskContent workspaceId={workspaceId} reportId={reportId} editable />
            </SectionBg>
          )}
          {activeSection === 'section-strategy' && !isDaily && (
            <SectionBg color="bg-light" gradient="from-blue">
              <Strategy workspaceId={workspaceId} reportId={reportId} editable />
            </SectionBg>
          )}
        </div>
      </div>

      {/* 종이와 발행 바 사이 여백 — daily 는 자동 발행이므로 바 자체 숨김 */}
      {!isDaily && <div className="h-8 lg:h-10" />}

      {/* 하단 고정 발행 바 (주간/월간 전용) */}
      {!isDaily && (
        <div className="sticky bottom-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200 -mx-6 lg:-mx-10">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-3 flex flex-col gap-2">
            {!platformsOk && failedPlatforms.length > 0 && !isPublished && (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <span className="font-semibold">실패/미완료 플랫폼이 있습니다:</span>{' '}
                  {failedPlatforms.map((p) => PLATFORM_LABELS[p] ?? p).join(', ')}
                  <span className="text-amber-700"> — 워크스페이스 화면에서 재시도 후 발행하세요.</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublished && <Check size={16} className="text-emerald-500" />}
                <span className={`text-sm font-medium ${isPublished ? 'text-emerald-600' : isDraft ? 'text-slate-500' : 'text-amber-600'}`}>
                  {isPublished ? '발행됨' : isDraft ? '검토 대기' : '분석 중 — 발행 불가'}
                </span>
              </div>
              <AdminButton
                variant={isPublished ? 'secondary' : 'primary'}
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || !isDraft || !platformsOk}
              >
                {publishMutation.isPending
                  ? '발행 중...'
                  : isPublished
                    ? '발행 완료'
                    : !platformsOk
                      ? '재시도 필요'
                      : '보고서 발행'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
