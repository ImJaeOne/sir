'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useMonitoringAiAnalysis } from '@/hooks/monitoring/useMonitoringMutation';
import { useMonitoringAiAnalysisCached } from '@/hooks/monitoring/useMonitoringQuery';

interface Props {
  workspaceId: string;
  start: string;
  end: string;
}

/** ISO timestamptz → "HH:mm" (KST). */
function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    });
  } catch {
    return '';
  }
}

export function AiAnalysisCard({ workspaceId, start, end }: Props) {
  const [open, setOpen] = useState(false);
  // 페이지 mount 시 DB 의 today_kst 캐시 row 자동 SELECT (없으면 null).
  const cachedQuery = useMonitoringAiAnalysisCached(workspaceId);
  const mutation = useMonitoringAiAnalysis(workspaceId, start, end);
  const result = mutation.data ?? cachedQuery.data;
  const isLoading = mutation.isPending || cachedQuery.isPending;
  const error = mutation.error;

  // 캐시 row 의 실제 분석 기간 (없으면 page 의 현재 period 로 fallback).
  const displayStart = result?.period_start ?? start;
  const displayEnd = result?.period_end ?? end;

  const onRun = () => {
    mutation.mutate();
    setOpen(true);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-50/60 to-white border border-violet-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 lg:p-5 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-slate-800">AI 분석</span>
            <span className="text-[11px] text-slate-500">
              {result
                ? `오늘 ${formatTime(result.generated_at)} 분석 완료 (${displayStart} ~ ${displayEnd})`
                : `${start} ~ ${end} 기간을 AI 가 해석 · 하루 1회 갱신`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!result && !isLoading && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
            >
              분석하기
            </span>
          )}
          {isLoading && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-100 text-violet-600 inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              분석 중
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 lg:px-5 lg:pb-5 pt-0">
          <div className="rounded-xl bg-white border border-slate-200/60 p-5 lg:p-6">
            {isLoading && !result && (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-xs">데이터를 분석하고 있습니다 (5~10초)</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{(error as Error).message}</span>
              </div>
            )}
            {result && (
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
            {!result && !isLoading && !error && (
              <div className="text-center py-8 text-slate-400 text-xs">
                위 <span className="font-bold text-violet-600">분석하기</span> 버튼을 눌러 AI 가 30일치 데이터를 해석합니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
