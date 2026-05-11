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
  presetDays: number;
}

/** 7/30/90 만 분석 가능. 180/365 는 토큰 부하 + 분석 신뢰도 저하로 비활성. */
const ALLOWED_PRESETS = new Set([7, 30, 90]);

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

export function AiAnalysisCard({ workspaceId, start, end, presetDays }: Props) {
  const [open, setOpen] = useState(false);
  // 페이지 mount 시 DB 의 이번 주(KST 월요일) 캐시 row 자동 SELECT (없으면 null).
  const cachedQuery = useMonitoringAiAnalysisCached(workspaceId);
  const mutation = useMonitoringAiAnalysis(workspaceId, start, end);
  const result = mutation.data ?? cachedQuery.data;
  const isLoading = mutation.isPending || cachedQuery.isPending;
  const error = mutation.error;

  // 캐시 row 의 실제 분석 기간 (없으면 page 의 현재 period 로 fallback).
  const displayStart = result?.period_start ?? start;
  const displayEnd = result?.period_end ?? end;
  const presetAllowed = ALLOWED_PRESETS.has(presetDays);

  const onRun = () => {
    if (!presetAllowed) return;
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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-800 shrink-0">AI 분석</span>
            <span className="text-[12px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md tabular-nums shrink-0">
              {displayStart} ~ {displayEnd}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline truncate ml-auto pr-2">
              {result
                ? `${formatTime(result.generated_at)} 분석 완료 · 주 1회 갱신`
                : '워크스페이스 여론·주가를 AI가 해석합니다 · 주 1회 갱신'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!result && !isLoading && presetAllowed && (
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
          {!result && !isLoading && !presetAllowed && (
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 cursor-not-allowed"
              title="7/30/90일 기간에서만 AI 분석을 실행할 수 있습니다"
            >
              분석 불가
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
            {!result && !isLoading && !error && presetAllowed && (
              <div className="text-center py-8 text-slate-400 text-xs">
                위 <span className="font-bold text-violet-600">분석하기</span> 버튼을 눌러 AI 가 {presetDays}일치 데이터를 해석합니다.
              </div>
            )}
            {!result && !isLoading && !error && !presetAllowed && (
              <div className="text-center py-8 text-slate-400 text-xs">
                AI 분석은 <span className="font-bold text-slate-600">7일 · 30일 · 90일</span> 기간에서만 가능합니다. 위 기간 프리셋을 변경해주세요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
