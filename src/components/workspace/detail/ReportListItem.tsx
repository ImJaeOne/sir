'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, ChevronRight, AlertCircle } from 'lucide-react';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import { ALL_PLATFORMS, PLATFORM_LABELS, getReportHealth } from '@/utils/workspace';
import { STATUS_CONFIG, STATUS_FALLBACK, HEALTH_STRIPE } from './styles';
import { ReportProgressPanel } from './ReportProgressPanel';

/** 채널별 + (비일간일 때) 총평·전략 mini dot. 닫힌 카드에서도 어느 단계가 문제인지 훑어볼 수 있게 */
function ChannelMiniDots({
  progress,
  reportType,
}: {
  progress: ReportProgress | undefined;
  reportType: Report['type'];
}) {
  const sessionMap = new Map(progress?.sessions.map((s) => [s.platform_id, s]) ?? []);
  const dotClassFor = (status: string) =>
    (STATUS_CONFIG[status] ?? STATUS_FALLBACK).dot;

  // session_strategies 의 실제 status 를 dot 에 반영 (analyzing/pending/failed/done)
  const sumStrategy = progress?.strategies.find((s) => s.category === 'summary');
  const summaryStatus = sumStrategy?.status ?? 'pending';
  const channelStrategies = progress?.strategies.filter((s) => s.category !== 'summary') ?? [];
  const channelDoneCount = channelStrategies.filter((s) => s.status === 'done').length;
  const channelTotal = channelStrategies.length;
  const channelHasFailed = channelStrategies.some((s) => s.status === 'failed');
  const channelHasActive = channelStrategies.some((s) =>
    ['analyzing', 'pending_analysis', 'crawling', 'clustering'].includes(s.status),
  );
  const strategyStatus =
    channelTotal === 0
      ? 'pending'
      : channelDoneCount === channelTotal
        ? 'done'
        : channelHasActive
          ? 'analyzing'
          : channelHasFailed
            ? 'failed'
            : 'pending';

  return (
    <div className="flex items-center gap-1" aria-label="진행 상태 요약">
      {ALL_PLATFORMS.map((pid) => {
        const s = sessionMap.get(pid);
        const status = s?.status ?? 'pending';
        return (
          <span
            key={pid}
            className={`w-1.5 h-1.5 rounded-full ${dotClassFor(status)}`}
            title={`${PLATFORM_LABELS[pid] ?? pid}: ${STATUS_CONFIG[status]?.label ?? status}`}
          />
        );
      })}
      {reportType !== 'daily' && (
        <>
          <span className="mx-0.5 w-px h-2 bg-slate-200" aria-hidden />
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotClassFor(summaryStatus)}`}
            title={`총평: ${(STATUS_CONFIG[summaryStatus] ?? STATUS_FALLBACK).label}`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotClassFor(strategyStatus)}`}
            title={`대응 전략: ${
              strategyStatus === 'done'
                ? `${channelDoneCount}개 채널`
                : strategyStatus === 'analyzing'
                  ? `분석 중 (${channelDoneCount}/${channelTotal})`
                  : (STATUS_CONFIG[strategyStatus] ?? STATUS_FALLBACK).label
            }`}
          />
        </>
      )}
    </div>
  );
}

interface ReportListItemProps {
  report: Report;
  workspaceId: string;
  progress: ReportProgress | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ReportListItem({
  report,
  workspaceId,
  progress,
  isExpanded,
  onToggle,
}: ReportListItemProps) {
  const router = useRouter();

  const periodStart = report.period_start.replace(/-/g, '.');
  const periodEnd = report.period_end.replace(/-/g, '.');
  const typeLabel =
    report.type === 'initial'
      ? '월간 보고서'
      : report.type === 'daily'
        ? '일간 보고서'
        : '주간 보고서';
  const isAutoPublished = report.type === 'daily' && report.status === 'published';
  const isNotAnalyzed = !progress || progress.sessions.length === 0;
  const statusColor = isAutoPublished
    ? 'bg-violet-50 text-violet-700'
    : report.status === 'published'
      ? 'bg-emerald-50 text-emerald-700'
      : isNotAnalyzed
        ? 'bg-slate-100 text-slate-600'
        : 'bg-amber-50 text-amber-700';
  const statusLabel = isAutoPublished
    ? '자동 발행'
    : report.status === 'published'
      ? '검토 완료'
      : isNotAnalyzed
        ? '분석 대기'
        : '검토 대기';
  const periodLabel = report.type === 'daily' ? periodStart : `${periodStart} ~ ${periodEnd}`;
  const health = getReportHealth(progress);
  const failedCount = progress?.sessions.filter((s) => s.status === 'failed').length ?? 0;

  return (
    <div className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-stretch overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div className={`w-1 shrink-0 ${HEALTH_STRIPE[health]}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="px-3 sm:px-4 py-3.5 flex items-center gap-2">
          <button
            onClick={onToggle}
            aria-label={isExpanded ? '접기' : '펼치기'}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {isExpanded
              ? <ChevronUp size={16} strokeWidth={2} />
              : <ChevronDown size={16} strokeWidth={2} />
            }
          </button>
          <button
            onClick={() => router.push(`/workspace/${workspaceId}/${report.id}`)}
            className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left cursor-pointer"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 tabular-nums">
                  {periodLabel}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColor}`}>
                  {statusLabel}
                </span>
                {failedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600">
                    <AlertCircle size={10} strokeWidth={2.4} />
                    실패 {failedCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{typeLabel}</span>
                {!isNotAnalyzed && (
                  <>
                    <span className="text-slate-200">·</span>
                    <ChannelMiniDots progress={progress} reportType={report.type} />
                  </>
                )}
              </div>
            </div>
            {!isNotAnalyzed && (
              <ChevronRight
                size={16}
                strokeWidth={1.8}
                className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            )}
          </button>
        </div>
        {isExpanded && progress && (
          <div className="border-t border-slate-100">
            <ReportProgressPanel
              workspaceId={workspaceId}
              reportId={report.id}
              reportType={report.type}
              progress={progress}
            />
          </div>
        )}
      </div>
    </div>
  );
}
