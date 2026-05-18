'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useMonitoringAiAnalysis } from '@/hooks/monitoring/useMonitoringMutation';
import {
  useMonitoringAiAnalysisLatest,
  useMonitoringTokenStatus,
} from '@/hooks/monitoring/useMonitoringQuery';
import { useMyRole } from '@/hooks/user/useUserQuery';
import { AiAnalysisModal } from './AiAnalysisModal';

interface Props {
  workspaceId: string;
}

/** "YYYY-MM-DD" → "YY.MM.DD". 빈 값은 그대로. */
function toShortDate(s: string | null | undefined): string {
  return s ? s.slice(2).replace(/-/g, '.') : '';
}

export function AiAnalysisCard({ workspaceId }: Props) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [autoOpenedOnce, setAutoOpenedOnce] = useState(false);

  // mount 시 가장 최근 분석 결과 자동 표시 (마이그 062 이후 캐시 정책 제거 — history head 조회).
  const latestQ = useMonitoringAiAnalysisLatest(workspaceId);
  const mutation = useMonitoringAiAnalysis(workspaceId);
  const tokenQ = useMonitoringTokenStatus(workspaceId);
  const { data: myRole } = useMyRole();
  const isSuperAdmin = myRole === 'super_admin';
  // 분석 중이면 mutation 결과 우선, 아니면 latest 우선.
  const result = mutation.data ?? latestQ.data;
  const isLoadingLatest = latestQ.isPending;
  const isAnalyzing = mutation.isPending;
  const error = mutation.error;

  // 표시 기간 — result 가 있으면 result period, 없으면 placeholder
  const displayStart = result?.period_start;
  const displayEnd = result?.period_end;

  // 최근 분석 결과가 처음 도착하면 카드 자동 펼침 (1회만 — 사용자가 닫으면 재펼침 X).
  useEffect(() => {
    if (!autoOpenedOnce && latestQ.data) {
      setOpen(true);
      setAutoOpenedOnce(true);
    }
  }, [autoOpenedOnce, latestQ.data]);

  // 잔여 토큰 칩 색 — super_admin = 무제한 / 0 이하 = red / quota 20% 미만 = amber
  const balance = tokenQ.data?.token_balance ?? 0;
  const quota = tokenQ.data?.monthly_quota ?? 0;
  const chipClass = isSuperAdmin
    ? 'bg-violet-100/70 text-violet-700'
    : balance <= 0
      ? 'bg-rose-50 text-rose-600'
      : quota > 0 && balance < quota * 0.2
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600';
  const chipLabel = isSuperAdmin
    ? '잔여 무제한'
    : tokenQ.data
      ? `잔여 ${balance.toLocaleString()} 토큰`
      : null;

  const handleAnalyze = (start: string, end: string) => {
    setModalOpen(false);
    setOpen(true);
    mutation.mutate({ start, end });
  };

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-violet-50/60 to-white border border-violet-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 p-4 lg:p-5 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col min-w-0 flex-1 gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-bold text-slate-800 shrink-0">AI 분석</span>
                {displayStart && displayEnd && (
                  <span className="text-[11px] sm:text-[12px] font-bold text-violet-700 bg-violet-100/70 px-1.5 sm:px-2 py-0.5 rounded-md tabular-nums shrink-0">
                    {toShortDate(displayStart)} ~ {toShortDate(displayEnd)}
                  </span>
                )}
                {/* 결과가 아직 없을 때만 안내 — 결과가 있으면 좌측 기간 배지로 충분 */}
                {!isAnalyzing && !result && (
                  <span className="text-[11px] text-slate-400 hidden sm:inline truncate ml-auto pr-2">
                    기간을 선택해 분석을 시작하세요
                  </span>
                )}
              </div>
              {/* 모바일 전용 두번째 줄 — 잔여 토큰 칩 */}
              {chipLabel && (
                <div className="flex sm:hidden items-center gap-1.5 flex-wrap">
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${chipClass}`}>
                    {chipLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* sm 이상은 우측에 잔여 칩 */}
            {chipLabel && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums hidden sm:inline ${chipClass}`}>
                {chipLabel}
              </span>
            )}
            {isAnalyzing ? (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-100 text-violet-600 inline-flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                분석 중
              </span>
            ) : (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
              >
                분석하기
              </span>
            )}
            {open ? (
              <ChevronUp size={16} className="text-slate-400" />
            ) : (
              <ChevronDown size={16} className="text-slate-400" />
            )}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 lg:px-5 lg:pb-5 pt-0">
            <div className="rounded-xl bg-white border border-slate-200/60 p-5 lg:p-6">
              {isAnalyzing && (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-xs">데이터를 분석하고 있습니다.</span>
                </div>
              )}
              {!isAnalyzing && isLoadingLatest && (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-300">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-xs">최근 결과를 불러오는 중...</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{(error as Error).message}</span>
                </div>
              )}
              {!isAnalyzing && result && (
                <article
                  className="
                    text-[13px] leading-[1.7] text-slate-700 w-full
                    [&>h2]:relative [&>h2]:mt-5 [&>h2]:mb-2.5 [&>h2]:pl-3 [&>h2]:text-[14px] [&>h2]:font-bold [&>h2]:text-slate-900
                    [&>h2]:before:content-[''] [&>h2]:before:absolute [&>h2]:before:left-0 [&>h2]:before:top-1 [&>h2]:before:bottom-1 [&>h2]:before:w-[3px] [&>h2]:before:rounded-full [&>h2]:before:bg-violet-500
                    [&>h2:first-child]:mt-0
                    [&>p]:my-2.5
                    [&>ul]:my-2.5 [&>ul]:pl-0 [&>ul]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-2
                    [&>ul>li]:relative [&>ul>li]:pl-4
                    [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-1 [&>ul>li]:before:top-[0.65em] [&>ul>li]:before:w-1 [&>ul>li]:before:h-1 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-violet-400
                    [&_strong]:font-bold [&_strong]:text-slate-900
                    [&>hr]:my-4 [&>hr]:border-slate-100
                  "
                >
                  <ReactMarkdown>{result.content}</ReactMarkdown>
                </article>
              )}
              {!isAnalyzing && !isLoadingLatest && !result && !error && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  아직 분석 결과가 없습니다. 위 <span className="font-bold text-violet-600">분석하기</span> 버튼을 눌러 기간을 선택하세요.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AiAnalysisModal
        open={modalOpen}
        workspaceId={workspaceId}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAnalyze}
      />
    </>
  );
}
