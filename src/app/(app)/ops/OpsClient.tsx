'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2, RefreshCw } from 'lucide-react';
import {
  getOpsQueue,
  retrySession,
  type OpsActiveSession,
  type OpsCompletion,
  type OpsQueue,
  type OpsUpcomingCron,
  type OpsWaitingSession,
} from '@/lib/api/opsApi';
import { retryFailedReport } from '@/lib/api/reportApi';
import { getErrorMessage } from '@/lib/utils';

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: 'Naver News',
  naver_blog: 'Naver Blog',
  youtube: 'YouTube',
  naver_stock: 'Naver Stock',
  dcinside: 'DC Inside',
  strategy_news: '전략 · 뉴스',
  strategy_sns: '전략 · SNS',
  strategy_community: '전략 · 커뮤니티',
  summary: '총평',
};

const STAGE_IDS = new Set(['strategy_news', 'strategy_sns', 'strategy_community', 'summary']);

const ACTIVE_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  crawling: '크롤링 중',
  pending_analysis: '분석 대기',
  analyzing: '분석 중',
};

const FAILED_REASON_LABELS: Record<string, string> = {
  collect: '수집 실패',
  save: '저장 실패',
  analyze: '분석 실패',
  calculate: '계산 실패',
  generate: '생성 실패',
};

function formatCronSchedule(iso: string): string {
  const dt = new Date(iso);
  const now = new Date();
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(dt, now)) return `오늘 ${hh}:${mm}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(dt, tomorrow)) return `내일 ${hh}:${mm}`;

  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 ${hh}:${mm}`;
}

function groupByWorkspace<T extends { workspace_id: string; workspace_name: string | null }>(
  items: T[],
): { workspace_id: string; name: string; items: T[] }[] {
  const map = new Map<string, { name: string; items: T[] }>();
  for (const it of items) {
    if (!map.has(it.workspace_id)) {
      const fallback = it.workspace_id.length > 8 ? `${it.workspace_id.slice(0, 8)}…` : it.workspace_id;
      map.set(it.workspace_id, { name: it.workspace_name ?? fallback, items: [] });
    }
    map.get(it.workspace_id)!.items.push(it);
  }
  return Array.from(map.entries()).map(([id, v]) => ({ workspace_id: id, ...v }));
}

function PlatformBadge({ platformId }: { platformId: string }) {
  const isStage = STAGE_IDS.has(platformId);
  const cls = isStage
    ? 'bg-violet-50 text-violet-700'
    : 'bg-slate-100 text-slate-600';
  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${cls}`}
    >
      {PLATFORM_LABELS[platformId] ?? platformId}
    </span>
  );
}

function Column({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 min-w-0">
      <div className="flex items-baseline gap-2 px-1">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="text-xs font-medium text-slate-400 tabular-nums">{count}</span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
      {children}
    </div>
  );
}

function ActiveStatusIcon({ status }: { status: OpsActiveSession['status'] }) {
  if (status === 'crawling' || status === 'analyzing') {
    return <Loader2 className="size-3 text-amber-500 animate-spin shrink-0" />;
  }
  if (status === 'pending_analysis') {
    return <Clock className="size-3 text-sky-500 shrink-0" />;
  }
  return <Clock className="size-3 text-slate-300 shrink-0" />;
}

function WorkspaceActiveCard({ name, items }: { name: string; items: OpsActiveSession[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-amber-400" aria-hidden />
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-slate-800 truncate">{name}</h3>
        <ul className="flex flex-col gap-1.5">
          {items.map((s) => {
            const label = STAGE_IDS.has(s.platform_id)
              ? '생성 중'
              : (ACTIVE_STATUS_LABELS[s.status] ?? s.status);
            return (
              <li key={s.session_id} className="flex items-center gap-2 min-w-0">
                <PlatformBadge platformId={s.platform_id} />
                <span className="text-xs text-slate-600 flex-1 truncate">{label}</span>
                <ActiveStatusIcon status={s.status} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function WorkspaceWaitingCard({ name, items }: { name: string; items: OpsWaitingSession[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 워크스페이스 카드의 모든 failed 세션이 같은 report 에 묶여 있을 때만 batch retry-failed 노출.
  // 다른 report 가 섞여 있으면 finalize 흐름이 어느 보고서에 적용되는지 모호 → per-session 만 유도.
  const reportIds = Array.from(new Set(items.map((s) => s.report_id).filter((v): v is string => !!v)));
  const batchReportId = reportIds.length === 1 ? reportIds[0] : null;

  const retryOne = useMutation({
    mutationFn: (sessionId: string) => retrySession(sessionId),
    onSuccess: () => {
      toast.success('세션 재시도를 시작했습니다.');
      queryClient.invalidateQueries({ queryKey: ['ops', 'queue'] });
    },
    onError: (err) => toast.error(getErrorMessage(err, '재시도 요청 실패')),
  });

  const retryAll = useMutation({
    mutationFn: (reportId: string) => retryFailedReport(reportId),
    onSuccess: () => {
      toast.success('보고서 일괄 재시도를 시작했습니다.');
      queryClient.invalidateQueries({ queryKey: ['ops', 'queue'] });
    },
    onError: (err) => toast.error(getErrorMessage(err, '일괄 재시도 요청 실패')),
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-red-400" aria-hidden />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 pt-3 pb-2 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{name}</h3>
            <p className="text-[11px] text-red-600 mt-0.5">실패 {items.length}건 · 재시도 대기</p>
          </div>
          {batchReportId && (
            <button
              type="button"
              onClick={() => retryAll.mutate(batchReportId)}
              disabled={retryAll.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              title="이 보고서의 실패 세션 모두 재시도 + 자동 마감"
            >
              <RefreshCw size={11} className={retryAll.isPending ? 'animate-spin' : ''} />
              {retryAll.isPending ? '재시도 중' : '일괄 재시도'}
            </button>
          )}
        </div>
        <ul className="border-t border-slate-100 divide-y divide-slate-100">
          {items.map((s) => {
            const open = openId === s.session_id;
            const pending = retryOne.isPending && retryOne.variables === s.session_id;
            return (
              <li key={s.session_id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.session_id)}
                  className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <PlatformBadge platformId={s.platform_id} />
                  <span className="text-xs text-red-700 flex-1 truncate">
                    {FAILED_REASON_LABELS[s.failed_reason ?? ''] ?? s.failed_reason ?? '실패'}
                  </span>
                  {open ? (
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {open && (
                  <div className="px-4 py-3 bg-red-50 border-t border-slate-100 flex flex-col gap-2">
                    <div className="text-[11px] text-red-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {s.error_message ?? 'error_message 가 비어있음 (legacy 세션 가능성).'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 break-all flex-1 min-w-0">
                        session {s.session_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => retryOne.mutate(s.session_id)}
                        disabled={retryOne.isPending}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                        title="이 세션만 재시도 (마감은 별도)"
                      >
                        <RefreshCw size={11} className={pending ? 'animate-spin' : ''} />
                        {pending ? '요청 중' : '이 세션 재시도'}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function WorkspaceCompletedCard({ name, items }: { name: string; items: OpsCompletion[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-emerald-400" aria-hidden />
      <div className="flex-1 min-w-0 flex flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{name}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">완료 {items.length}건</p>
          </div>
          {open ? (
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          )}
        </button>
        {open && (
          <ul className="border-t border-slate-100 divide-y divide-slate-100">
            {items.map((c) => (
              <li key={c.session_id} className="px-4 py-2 flex items-center gap-2 min-w-0">
                <PlatformBadge platformId={c.platform_id} />
                <span className="flex-1" aria-hidden />
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function LockHolderCard({ holder }: { holder: NonNullable<OpsQueue['lock_holder']> }) {
  const config: Record<string, { title: string; stripe: string }> = {
    pipeline: { title: 'Pipeline 진행 중', stripe: 'bg-sky-400' },
    retry: { title: '재시도 진행 중', stripe: 'bg-amber-400' },
    regenerate: { title: '재생성 진행 중', stripe: 'bg-violet-400' },
  };
  const cfg = config[holder.type] ?? { title: holder.type, stripe: 'bg-slate-300' };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className={`w-1 shrink-0 ${cfg.stripe}`} aria-hidden />
      <div className="flex-1 min-w-0 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{cfg.title}</h3>
        {holder.triggered_by && (
          <p className="text-[11px] text-slate-400 mt-0.5">트리거 · {holder.triggered_by}</p>
        )}
      </div>
    </div>
  );
}

function FinalizeCard({ finalize }: { finalize: NonNullable<OpsQueue['finalize']> }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-violet-400" aria-hidden />
      <div className="flex-1 min-w-0 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">보고서 마감 중</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {finalize.trigger === 'auto' ? '자동 · 재시도 완료 후' : '수동 · API 호출'}
        </p>
      </div>
    </div>
  );
}

function UpcomingCronCard({ upcoming }: { upcoming: OpsUpcomingCron }) {
  const [open, setOpen] = useState(false);
  const dateLabel = formatCronSchedule(upcoming.scheduled_at);
  const typesLabel = upcoming.report_types.map((t) => (t === 'daily' ? 'Daily' : 'Weekly')).join(' + ');
  const count = upcoming.workspaces.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-sky-400" aria-hidden />
      <div className="flex-1 min-w-0 flex flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800">{dateLabel} 예정</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {count}개 워크스페이스 · {typesLabel}
            </p>
          </div>
          {open ? (
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 shrink-0" />
          )}
        </button>
        {open && count > 0 && (
          <ul className="border-t border-slate-100 divide-y divide-slate-100">
            {upcoming.workspaces.map((ws) => (
              <li key={ws.workspace_id} className="px-4 py-2 flex items-center gap-2">
                <span className="text-sm text-slate-700 flex-1 truncate">
                  {ws.company_name ?? '—'}
                </span>
                {ws.ticker && (
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {ws.ticker}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {open && count === 0 && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            예정된 워크스페이스 없음
          </div>
        )}
      </div>
    </div>
  );
}

function RetryBatchCard({ batch }: { batch: NonNullable<OpsQueue['retry_batch']> }) {
  const processed = batch.total - batch.remaining;
  const pct = batch.total ? Math.round((processed / batch.total) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-amber-400" aria-hidden />
      <div className="flex-1 min-w-0 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">일괄 재시도 진행 중</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums text-slate-800">{processed}</span>
          <span className="text-xs text-slate-400 tabular-nums">/ {batch.total}</span>
          <span className="ml-auto text-xs tabular-nums text-slate-500">{pct}%</span>
        </div>
        <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">남은 {batch.remaining}건</p>
      </div>
    </div>
  );
}

export function OpsClient() {
  const { data, error, isFetching } = useQuery({
    queryKey: ['ops', 'queue'],
    queryFn: getOpsQueue,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const waiting = data?.waiting_sessions ?? [];
  const active = data?.active_sessions ?? [];
  const completions = (data?.recent_completions ?? []).filter((c) => c.status === 'done');
  const upcoming = data?.upcoming_cron ?? null;

  const waitingGroups = groupByWorkspace(waiting);
  const activeGroups = groupByWorkspace(active);
  const completedGroups = groupByWorkspace(completions);

  const hasLock = Boolean(data?.lock_holder);
  const hasFinalize = Boolean(data?.finalize);
  const hasRetry = Boolean(data?.retry_batch);
  const hasUpcoming = Boolean(upcoming && upcoming.workspaces.length > 0);

  const waitingCount = waitingGroups.length + (hasRetry ? 1 : 0) + (hasUpcoming ? 1 : 0);
  const workingCount = activeGroups.length + (hasLock ? 1 : 0) + (hasFinalize ? 1 : 0);
  const completedCount = completedGroups.length;

  const statusInfo = error
    ? { label: 'OFFLINE', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700' }
    : isFetching
      ? { label: '동기화 중', dot: 'bg-amber-500 animate-pulse', chip: 'bg-amber-50 text-amber-700' }
      : { label: 'LIVE', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' };

  return (
    <div className="p-6 lg:p-8 min-h-full bg-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              운영 모니터링
            </h1>
            <p className="text-xs text-slate-400">
              현재 서버에서 돌고 있는 수집·분석·재생성 작업 스냅샷. 3초 간격 자동 갱신.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ${statusInfo.chip}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>

        {error && (
          <div className="border border-red-100 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle size={14} />
            {getErrorMessage(error, '데이터 조회 실패')}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Column title="대기" count={waitingCount}>
            {hasRetry && data?.retry_batch && <RetryBatchCard batch={data.retry_batch} />}
            {waitingGroups.map((g) => (
              <WorkspaceWaitingCard key={g.workspace_id} name={g.name} items={g.items} />
            ))}
            {hasUpcoming && upcoming && <UpcomingCronCard upcoming={upcoming} />}
            {waitingCount === 0 && <EmptyCard>대기 중인 작업 없음</EmptyCard>}
          </Column>

          <Column title="진행 중" count={workingCount}>
            {hasLock && data?.lock_holder && <LockHolderCard holder={data.lock_holder} />}
            {hasFinalize && data?.finalize && <FinalizeCard finalize={data.finalize} />}
            {activeGroups.map((g) => (
              <WorkspaceActiveCard key={g.workspace_id} name={g.name} items={g.items} />
            ))}
            {workingCount === 0 && <EmptyCard>진행 중인 작업 없음</EmptyCard>}
          </Column>

          <Column title="완료" count={completedCount}>
            {completedGroups.map((g) => (
              <WorkspaceCompletedCard key={g.workspace_id} name={g.name} items={g.items} />
            ))}
            {completedCount === 0 && <EmptyCard>최근 완료된 작업 없음</EmptyCard>}
          </Column>
        </div>
      </div>
    </div>
  );
}
