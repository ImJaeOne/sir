'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, Loader2 } from 'lucide-react';
import {
  getOpsQueue,
  type OpsActiveSession,
  type OpsCompletion,
  type OpsQueue,
  type OpsWaitingSession,
} from '@/lib/api/opsApi';

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: 'Naver News',
  naver_blog: 'Naver Blog',
  youtube: 'YouTube',
  naver_stock: 'Naver Stock',
  dcinside: 'DC Inside',
};

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
};

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
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 whitespace-nowrap">
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
          {items.map((s) => (
            <li key={s.session_id} className="flex items-center gap-2 min-w-0">
              <PlatformBadge platformId={s.platform_id} />
              <span className="text-xs text-slate-600 flex-1 truncate">
                {ACTIVE_STATUS_LABELS[s.status] ?? s.status}
              </span>
              <ActiveStatusIcon status={s.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WorkspaceWaitingCard({ name, items }: { name: string; items: OpsWaitingSession[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden">
      <div className="w-1 shrink-0 bg-red-400" aria-hidden />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{name}</h3>
          <p className="text-[11px] text-red-600 mt-0.5">실패 {items.length}건 · 재시도 대기</p>
        </div>
        <ul className="border-t border-slate-100 divide-y divide-slate-100">
          {items.map((s) => {
            const open = openId === s.session_id;
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
                  <div className="px-4 py-3 bg-red-50 border-t border-slate-100">
                    <div className="text-[11px] text-red-700 whitespace-pre-wrap break-words font-mono leading-relaxed">
                      {s.error_message ?? 'error_message 가 비어있음 (legacy 세션 가능성).'}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 break-all">
                      session {s.session_id}
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

function CompletedRow({ c }: { c: OpsCompletion }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-2.5 flex items-center gap-2 min-w-0">
      <PlatformBadge platformId={c.platform_id} />
      <span className="text-sm text-slate-700 flex-1 truncate">{c.workspace_name ?? '—'}</span>
      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
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

export default function OpsPage() {
  const { data, error, isFetching } = useQuery({
    queryKey: ['ops', 'queue'],
    queryFn: getOpsQueue,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });

  const waiting = data?.waiting_sessions ?? [];
  const active = data?.active_sessions ?? [];
  const completions = (data?.recent_completions ?? []).filter((c) => c.status === 'done');

  const waitingGroups = groupByWorkspace(waiting);
  const activeGroups = groupByWorkspace(active);

  const hasLock = Boolean(data?.lock_holder);
  const hasFinalize = Boolean(data?.finalize);
  const hasRetry = Boolean(data?.retry_batch);

  const waitingCount = waiting.length + (hasRetry ? 1 : 0);
  const workingCount = active.length + (hasLock ? 1 : 0) + (hasFinalize ? 1 : 0);
  const completedCount = completions.length;

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
            {error instanceof Error ? error.message : '데이터 조회 실패'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Column title="대기" count={waitingCount}>
            {hasRetry && data?.retry_batch && <RetryBatchCard batch={data.retry_batch} />}
            {waitingGroups.map((g) => (
              <WorkspaceWaitingCard key={g.workspace_id} name={g.name} items={g.items} />
            ))}
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
            {completions.map((c) => (
              <CompletedRow key={c.session_id} c={c} />
            ))}
            {completedCount === 0 && <EmptyCard>최근 완료된 작업 없음</EmptyCard>}
          </Column>
        </div>
      </div>
    </div>
  );
}
