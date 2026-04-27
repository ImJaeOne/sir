'use client';

import { ChevronRight, AlertTriangle } from 'lucide-react';
import type { Workspace } from '@/types/workspace';
import type { LatestReport } from '@/lib/api/workspaceApi';

export type WorkspaceWithLatest = Workspace & { latest_report?: LatestReport };

type ReportHealth = 'empty' | 'pending' | 'failed' | 'running' | 'published' | 'review';

function getReportHealth(latest: LatestReport | undefined): ReportHealth {
  if (!latest) return 'empty';
  if (latest.has_failed_session) return 'failed';
  if (latest.has_running_session) return 'running';
  if (latest.status === 'published') return 'published';
  // 보고서는 만들어졌지만 세션이 1건도 없으면 분석 전 상태 — review 와 구분
  if (!latest.has_any_session) return 'pending';
  return 'review';
}

const HEALTH_STYLE: Record<ReportHealth, { stripe: string; chip: string; label: string }> = {
  empty:     { stripe: 'bg-slate-200',   chip: 'bg-slate-100 text-slate-500',    label: '보고서 없음' },
  pending:   { stripe: 'bg-slate-300',   chip: 'bg-slate-100 text-slate-600',    label: '분석 전' },
  failed:    { stripe: 'bg-red-400',     chip: 'bg-red-50 text-red-600',         label: '실패' },
  running:   { stripe: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700',     label: '진행 중' },
  review:    { stripe: 'bg-sky-400',     chip: 'bg-sky-50 text-sky-700',         label: '검토 대기' },
  published: { stripe: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700', label: '검토 완료' },
};

interface WorkspaceCardProps {
  workspace: WorkspaceWithLatest;
  onSelect: (ws: Workspace) => void;
}

export function WorkspaceCard({ workspace, onSelect }: WorkspaceCardProps) {
  const latest = workspace.latest_report;
  const health = getReportHealth(latest);
  const style = HEALTH_STYLE[health];
  const latestLabel = latest
    ? latest.period_start === latest.period_end
      ? latest.period_start.replace(/-/g, '.')
      : `${latest.period_start.replace(/-/g, '.')} ~ ${latest.period_end.replace(/-/g, '.')}`
    : null;

  return (
    <div className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-stretch overflow-hidden hover:shadow-md hover:border-slate-200 hover:-translate-y-px transition-all duration-200">
      <div className={`w-1 shrink-0 ${style.stripe}`} aria-hidden />
      <button
        onClick={() => onSelect(workspace)}
        className="flex-1 flex items-center gap-3 px-5 py-4 text-left cursor-pointer min-w-0"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-800 truncate">
              {workspace.company_name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style.chip}`}
            >
              {health === 'failed' && <AlertTriangle size={10} strokeWidth={2.4} />}
              {style.label}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-1.5 block">
            {latestLabel ? (
              <>
                <span className="text-slate-400">최근 보고서</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-medium text-slate-500 tabular-nums">{latestLabel}</span>
              </>
            ) : (
              <span className="italic text-slate-300">보고서 없음</span>
            )}
          </span>
        </div>
        <ChevronRight
          size={16}
          strokeWidth={1.8}
          className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0"
        />
      </button>
    </div>
  );
}
