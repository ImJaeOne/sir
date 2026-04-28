'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, ChevronRight, RefreshCw, AlertCircle, Check, Clock, X, Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useRetryFailedReport } from '@/hooks/workspace/useWorkspaceMutation';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import { getErrorMessage } from '@/lib/utils';
import {
  WEEKDAYS_KR,
  WEEKLY_PLATFORMS,
  WEEKLY_PLATFORM_LABELS,
  addDays,
  shortDate,
  deriveDayState,
  strategyState,
  deriveRoundState,
  platformSessionState,
} from '@/utils/workspace';
import type { WeeklyPillState } from '@/utils/workspace';
import { WEEKLY_PILL_STYLES } from './styles';

type RoundSession = ReportProgress['allSessions'][number] | undefined;

function DayPill({
  weekday,
  date,
  state,
  onClick,
}: {
  weekday: string;
  date: string;
  state: WeeklyPillState;
  onClick?: () => void;
}) {
  const s = WEEKLY_PILL_STYLES[state];
  const iconMap: Record<WeeklyPillState, React.ReactNode> = {
    done:    <Check size={11} className="text-emerald-600" strokeWidth={3} />,
    pending: <Clock size={11} className="text-slate-400" strokeWidth={2.2} />,
    failed:  <X size={11} className="text-red-600" strokeWidth={3} />,
    running: <Loader2 size={11} className="text-amber-600 animate-spin" strokeWidth={2.5} />,
  };
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={!interactive}
      className={`flex-1 flex flex-col items-center gap-1 border rounded-xl px-2 py-2 ${s.bg} ${s.border} transition-all ${interactive ? 'hover:shadow-sm cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`text-[10px] font-semibold ${s.text} uppercase tracking-wider`}>{weekday}</span>
      <span className="text-xs font-bold text-slate-700 tabular-nums">{date}</span>
      <div className={`w-5 h-5 rounded-full bg-white border ${s.border} flex items-center justify-center`}>
        {iconMap[state]}
      </div>
    </button>
  );
}

function WeeklyStatusPill({
  state,
  label,
  sublabel,
}: {
  state: WeeklyPillState;
  label: string;
  sublabel?: string;
}) {
  const s = WEEKLY_PILL_STYLES[state];
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      {sublabel && <span className={`text-xs font-semibold ml-auto ${s.text}`}>{sublabel}</span>}
    </div>
  );
}

function RoundChannelGrid({ sessions }: { sessions: RoundSession[] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {WEEKLY_PLATFORMS.map((p, i) => {
        const s = sessions[i];
        const state = platformSessionState(s);
        const style = WEEKLY_PILL_STYLES[state];
        const label = WEEKLY_PLATFORM_LABELS[p];
        const right =
          state === 'failed' ? '실패'
          : state === 'done' ? `${s?.total_items ?? 0}건`
          : state === 'running' ? '진행'
          : '대기';
        return (
          <div key={p} className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 ${style.bg} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            <span className="text-[11px] font-semibold text-slate-600">{label}</span>
            <span className={`text-[10px] ml-auto ${style.text}`}>{right}</span>
          </div>
        );
      })}
    </div>
  );
}

interface WeeklyReportCardProps {
  report: Report;
  reports: Report[];
  progress: ReportProgress | undefined;
  progressByReportId: Map<string, ReportProgress>;
  workspaceId: string;
  isExpanded: boolean;
  onToggle: () => void;
  hasDaily: boolean;
}

export function WeeklyReportCard({
  report,
  reports,
  progress,
  progressByReportId,
  workspaceId,
  isExpanded,
  onToggle,
  hasDaily,
}: WeeklyReportCardProps) {
  const router = useRouter();
  const retry = useRetryFailedReport(workspaceId);
  const [retryTarget, setRetryTarget] = useState<Report | null>(null);

  // ── 공통: 주간 strategies 상태 ─────────────────────────────
  const summary = progress?.strategies.find((s) => s.category === 'summary');
  const news = progress?.strategies.find((s) => s.category === 'news');
  const sns = progress?.strategies.find((s) => s.category === 'sns');
  const community = progress?.strategies.find((s) => s.category === 'community');
  const catStates = [news, sns, community].map(strategyState);
  const doneCatCount = catStates.filter((s) => s === 'done').length;
  const failedCatCount = catStates.filter((s) => s === 'failed').length;
  const summaryS = strategyState(summary);
  const compileDone = summaryS === 'done' && doneCatCount === 3;
  const compileFailed = summaryS === 'failed' || failedCatCount > 0;

  // ── hasDaily=true: 일별 7개 pill ───────────────────────────
  const monday = report.period_start;
  const days = WEEKDAYS_KR.map((weekday, i) => {
    const iso = addDays(monday, i);
    const daily = reports.find((r) => r.type === 'daily' && r.period_start === iso);
    const dp = daily ? progressByReportId.get(daily.id) : undefined;
    return { weekday, iso, date: shortDate(iso), state: deriveDayState(daily, dp), daily };
  });
  const failedDays = days.filter((d) => d.state === 'failed' && d.daily);
  const hasFailedDay = failedDays.length > 0;
  const allDaysDone = days.every((d) => d.state === 'done');

  // ── hasDaily=false: 1차/2차 크롤 라운드 (c안) ──────────────
  const allSessions = [...(progress?.allSessions ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const byPlatformSessions = new Map<string, typeof allSessions>();
  for (const s of allSessions) {
    if (!byPlatformSessions.has(s.platform_id)) byPlatformSessions.set(s.platform_id, []);
    byPlatformSessions.get(s.platform_id)!.push(s);
  }
  const round1Sessions = WEEKLY_PLATFORMS.map((p) => byPlatformSessions.get(p)?.[0]);
  const round2Sessions = WEEKLY_PLATFORMS.map((p) => byPlatformSessions.get(p)?.[1]);
  const round1 = deriveRoundState(round1Sessions);
  const round2 = deriveRoundState(round2Sessions);

  // ── 헬스 stripe ──────────────────────────────────────────
  const stripe = (() => {
    if (compileDone) return 'bg-emerald-400';
    if (hasDaily) {
      if (hasFailedDay || compileFailed) return 'bg-red-400';
      if (allDaysDone || days.some((d) => d.state === 'running')) return 'bg-amber-400';
      return 'bg-slate-200';
    }
    if (round1.state === 'failed' || round2.state === 'failed' || compileFailed) return 'bg-red-400';
    if (round1.state === 'running' || round2.state === 'running' || round1.state === 'done' || round2.state === 'done') return 'bg-amber-400';
    return 'bg-slate-200';
  })();

  const statusLabel = report.status === 'published' ? '검토 완료' : '검토 대기';
  const statusColor = report.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
  const subBadge = hasDaily
    ? { label: '일간 구독자', color: 'bg-indigo-50 text-indigo-700' }
    : { label: '주간 전용 구독자', color: 'bg-fuchsia-50 text-fuchsia-700' };

  const periodLabel = `${report.period_start.replace(/-/g, '.')} ~ ${report.period_end.replace(/-/g, '.')}`;

  const handleDayClick = (daily: Report | undefined) => {
    if (!daily) return;
    router.push(`/workspace/${workspaceId}/${daily.id}`);
  };

  const handleRetryFailedDay = () => {
    if (failedDays.length === 0) return;
    setRetryTarget(failedDays[0].daily!);
  };

  const confirmRetry = async () => {
    if (!retryTarget) return;
    try {
      await retry.mutateAsync(retryTarget.id);
      toast.success('일괄 재시도를 시작했습니다. 성공 시 주간 컴파일이 자동 이어집니다.');
    } catch (e) {
      toast.error(getErrorMessage(e, '재시도 실패'));
    } finally {
      setRetryTarget(null);
    }
  };

  const handleRetryWeekly = async () => {
    try {
      await retry.mutateAsync(report.id);
      toast.success('실패한 채널을 재시도합니다. 완료 시 총평·대응 전략이 이어 생성됩니다.');
    } catch (e) {
      toast.error(getErrorMessage(e, '재시도 실패'));
    }
  };

  const weeklyFailedChannels = !hasDaily
    ? round1Sessions
        .map((s, i) => ({ label: WEEKLY_PLATFORM_LABELS[WEEKLY_PLATFORMS[i]], failed: s?.status === 'failed' }))
        .filter((x) => x.failed)
        .map((x) => x.label)
        .concat(
          round2Sessions
            .map((s, i) => ({ label: WEEKLY_PLATFORM_LABELS[WEEKLY_PLATFORMS[i]], failed: s?.status === 'failed' }))
            .filter((x) => x.failed)
            .map((x) => x.label),
        )
    : [];

  return (
    <>
      <div className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-stretch overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200">
        <div className={`w-1 shrink-0 ${stripe}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="px-3 sm:px-4 py-3.5 flex items-center gap-2">
            <button
              onClick={onToggle}
              aria-label={isExpanded ? '접기' : '펼치기'}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
            </button>
            <button
              onClick={() => compileDone && router.push(`/workspace/${workspaceId}/${report.id}`)}
              disabled={!compileDone}
              className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left cursor-pointer disabled:cursor-default"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{periodLabel}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${statusColor}`}>{statusLabel}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${subBadge.color}`}>{subBadge.label}</span>
                  {failedCatCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600">
                      <AlertCircle size={10} strokeWidth={2.4} />
                      컴파일 실패
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>주간 보고서</span>
                </div>
              </div>
              {compileDone && (
                <ChevronRight size={16} strokeWidth={1.8} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </button>
            {hasDaily && hasFailedDay && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetryFailedDay();
                }}
                disabled={retry.isPending}
                className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white border border-red-200 rounded-md px-2 py-1 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={10} className={retry.isPending ? 'animate-spin' : ''} />
                {failedDays.length === 1 ? `${failedDays[0].weekday}요일 재시도` : `실패 재시도 (${failedDays.length})`}
              </button>
            )}
            {!hasDaily && weeklyFailedChannels.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetryWeekly();
                }}
                disabled={retry.isPending}
                className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white border border-red-200 rounded-md px-2 py-1 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={10} className={retry.isPending ? 'animate-spin' : ''} />
                실패 재시도 ({weeklyFailedChannels.length})
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="border-t border-slate-100 px-4 sm:px-5 py-4 flex flex-col gap-4">
              {hasDaily ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">일별 보고서 (월~일)</span>
                    <span className="text-[10px] text-slate-400">클릭 시 해당 일간 보고서로 이동</span>
                  </div>
                  <div className="flex gap-1.5">
                    {days.map((d) => (
                      <DayPill
                        key={d.iso}
                        weekday={d.weekday}
                        date={d.date}
                        state={d.state}
                        onClick={d.daily ? () => handleDayClick(d.daily) : undefined}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">1차 크롤 (미드위크)</span>
                      <WeeklyStatusPill
                        state={round1.state}
                        label={
                          round1.state === 'done' ? '완료'
                          : round1.state === 'failed' ? '부분 실패'
                          : round1.state === 'running' ? '진행 중'
                          : '대기'
                        }
                      />
                    </div>
                    <RoundChannelGrid sessions={round1Sessions} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">2차 크롤 (월요일 최종)</span>
                      <WeeklyStatusPill
                        state={round2.state}
                        label={
                          round2.state === 'done' ? '완료'
                          : round2.state === 'failed' ? '부분 실패'
                          : round2.state === 'running' ? '진행 중'
                          : '대기'
                        }
                      />
                    </div>
                    <RoundChannelGrid sessions={round2Sessions} />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">주간 컴파일</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <WeeklyStatusPill
                    state={summaryS}
                    label="주간 총평"
                    sublabel={
                      summaryS === 'done' ? '완료'
                      : summaryS === 'failed' ? '실패'
                      : summaryS === 'running' ? '생성 중'
                      : hasDaily
                        ? (allDaysDone ? '대기' : '일간 7건 대기')
                        : (round2.state === 'done' ? '대기' : '2차 완료 후')
                    }
                  />
                  <WeeklyStatusPill
                    state={
                      doneCatCount === 3 ? 'done'
                      : failedCatCount > 0 ? 'failed'
                      : catStates.some((s) => s === 'running') ? 'running'
                      : 'pending'
                    }
                    label="대응 전략"
                    sublabel={
                      doneCatCount === 3 ? '3개 채널'
                      : failedCatCount > 0 ? `${failedCatCount}개 실패`
                      : catStates.some((s) => s === 'running') ? '생성 중'
                      : hasDaily
                        ? (allDaysDone ? '대기' : '일간 7건 대기')
                        : (round2.state === 'done' ? '대기' : '2차 완료 후')
                    }
                  />
                </div>
                {hasDaily && hasFailedDay && (
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 leading-snug">
                    <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{failedDays.map((d) => d.weekday).join(', ')}요일 일간 보고서가 완료되면 주간 컴파일이 자동으로 이어집니다.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={!!retryTarget}
        onClose={() => setRetryTarget(null)}
        onConfirm={confirmRetry}
        title="일간 재시도"
        confirmVariant="danger"
        confirmLabel="재시도"
        message={
          retryTarget ? (
            <>
              <b>{retryTarget.period_start}</b> 일간 보고서의 실패한 채널을 재시도합니다.
              <br />
              성공 시 주간 총평·대응 전략이 자동 이어서 생성됩니다.
            </>
          ) : null
        }
      />
    </>
  );
}
