'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { StagePanel } from '@/components/ui/StagePanel';
import { CrawlingResult } from '@/components/pipeline/CrawlingResult';
import { AnalysisResult } from '@/components/pipeline/AnalysisResult';
import { ContentResult } from '@/components/pipeline/ContentResult';
import { ReportResult } from '@/components/pipeline/ReportResult';
import { EmailResult } from '@/components/pipeline/EmailResult';
import { PIPELINE_STAGES } from '@/constants/pipeline';
import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';
import { MOCK_ANALYSIS_RESULTS } from '@/constants/analysisResults';
import { MOCK_CONTENT_STRATEGIES } from '@/constants/contentStrategies';
import type { StageId, StageStatus } from '@/types/pipeline';

const STAGE_IDS: StageId[] = ['crawling', 'analysis', 'content', 'report', 'email'];

function buildInitialStatuses(
  step: StageId | null,
  allCompleted: boolean
): Record<StageId, StageStatus> {
  const statuses: Record<StageId, StageStatus> = {
    crawling: 'idle',
    analysis: 'idle',
    content: 'idle',
    report: 'idle',
    email: 'idle',
  };

  if (allCompleted) {
    STAGE_IDS.forEach((id) => {
      statuses[id] = 'completed';
    });
    return statuses;
  }

  if (!step || !STAGE_IDS.includes(step)) return statuses;

  const stepIndex = STAGE_IDS.indexOf(step);
  STAGE_IDS.forEach((id, i) => {
    if (i < stepIndex) statuses[id] = 'completed';
  });

  return statuses;
}

function getDefaultSelectedUrls(): Set<string> {
  const urls = new Set<string>();
  MOCK_ANALYSIS_RESULTS.forEach((platform) => {
    platform.flagged.forEach((item) => {
      urls.add(item.url);
    });
  });
  return urls;
}

export function PipelineStages() {
  const router = useRouter();
  const params = useParams();
  const contextId = params?.contextId as string;
  const searchParams = useSearchParams();
  const initialStep = (searchParams?.get('step') as StageId | null) ?? null;
  const isCompleted = searchParams?.get('completed') === 'true';

  const [stageStatuses, setStageStatuses] = useState<Record<StageId, StageStatus>>(() =>
    buildInitialStatuses(initialStep, isCompleted)
  );
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(() => getDefaultSelectedUrls());
  const [dismissedComplete, setDismissedComplete] = useState(false);
  const [backModalType, setBackModalType] = useState<'delete' | 'confirm' | null>(null);
  const contextName = searchParams?.get('contextName') ?? searchParams?.get('company') ?? 'Company';

  const handleToggleUrl = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }, []);

  const updateStep = useCallback(
    (stageId: StageId) => {
      const p = new URLSearchParams(searchParams?.toString());
      p.set('step', stageId);
      router.replace(`/dashboard/${contextId}?${p.toString()}`, { scroll: false });
    },
    [router, contextId, searchParams]
  );

  useEffect(() => {
    const step = searchParams?.get('step') as StageId | null;
    if (step && STAGE_IDS.includes(step)) {
      setTimeout(() => {
        stageRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams]);

  // 파이프라인 시작 후 뒤로가기 감지
  const hasStarted = stageStatuses.crawling !== 'idle';
  const reportDone = stageStatuses.report === 'completed';

  useEffect(() => {
    if (!hasStarted) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setBackModalType(reportDone ? 'confirm' : 'delete');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [hasStarted, reportDone]);

  const handleStart = (stageId: StageId) => {
    updateStep(stageId);
    setStageStatuses((prev) => ({ ...prev, [stageId]: 'loading' }));
    // TODO: 실제 API 호출로 교체
    setTimeout(() => {
      setStageStatuses((prev) => ({ ...prev, [stageId]: 'completed' }));
      const nextIndex = STAGE_IDS.indexOf(stageId) + 1;
      if (nextIndex < STAGE_IDS.length) {
        const nextId = STAGE_IDS[nextIndex];
        updateStep(nextId);
        setTimeout(() => {
          stageRefs.current[nextId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }, 1500);
  };

  const handleSkip = (stageId: StageId) => {
    setStageStatuses((prev) => ({ ...prev, [stageId]: 'skipped' }));
  };

  const frontierIndex = (() => {
    const idx = STAGE_IDS.findIndex(
      (id) => stageStatuses[id] !== 'completed' && stageStatuses[id] !== 'skipped'
    );
    return idx === -1 ? STAGE_IDS.length : idx;
  })();

  const allCompleted = frontierIndex === STAGE_IDS.length;

  const totalFlagged = MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.flagged.length, 0);

  const contentItems = MOCK_CONTENT_STRATEGIES.filter((s) => selectedUrls.has(s.url));
  const responseCount = contentItems.filter((s) => !s.reportable).length;
  const reportableCount = contentItems.filter((s) => s.reportable).length;

  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);

  const getStageBadge = (stageId: StageId) => {
    if (stageId === 'crawling' && stageStatuses.crawling === 'completed') {
      return (
        <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
          {totalArticles}건 수집
        </span>
      );
    }
    if (stageId === 'analysis' && stageStatuses.analysis === 'completed' && totalFlagged > 0) {
      return (
        <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
          주의 {totalFlagged}건
        </span>
      );
    }
    if (stageId === 'content' && stageStatuses.content === 'completed') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
            대응 {responseCount}건
          </span>
          <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
            신고 {reportableCount}건
          </span>
        </div>
      );
    }
    return undefined;
  };

  return (
    <>
      {PIPELINE_STAGES.map((stage, index) => (
        <div
          key={stage.id}
          ref={(el) => {
            stageRefs.current[stage.id] = el;
          }}
        >
          <StagePanel
            stage={stage}
            index={index}
            status={stageStatuses[stage.id]}
            locked={index > frontierIndex}
            onStart={() => handleStart(stage.id)}
            onSkip={stage.id === 'email' ? () => handleSkip('email') : undefined}
            badge={getStageBadge(stage.id)}
          >
            {stage.id === 'crawling' && <CrawlingResult />}
            {stage.id === 'analysis' && (
              <AnalysisResult selectedUrls={selectedUrls} onToggleUrl={handleToggleUrl} />
            )}
            {stage.id === 'content' && <ContentResult selectedUrls={selectedUrls} />}
            {stage.id === 'report' && <ReportResult />}
            {stage.id === 'email' && <EmailResult />}
          </StagePanel>
        </div>
      ))}

      {allCompleted && !dismissedComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setDismissedComplete(true)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="text-green-600"
                  >
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M6 10l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-800">작업 완료</span>
                  <span className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{contextName}</span> 작업이
                    완료되었습니다.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDismissedComplete(true)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      )}

      {/* 뒤로가기 모달 — 1~3단계: 삭제 경고 / 4단계 이후: 확인 */}
      {backModalType === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-red-600"
                >
                  <path
                    d="M10 2L2 18h16L10 2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M10 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-bold text-slate-800">
                  진행 중인 작업이 삭제됩니다
                </span>
                <span className="text-sm text-slate-500">
                  현재까지 진행된 크롤링, 분석, 컨텐츠 데이터가 모두 삭제됩니다.
                </span>
                <span className="text-sm text-slate-500">계속하시겠습니까?</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBackModalType(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                계속 진행
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {backModalType === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-slate-800">
                대시보드로 돌아가시겠습니까?
              </span>
              <span className="text-sm text-slate-500">현재 페이지를 벗어납니다.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBackModalType(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
              >
                대시보드로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
