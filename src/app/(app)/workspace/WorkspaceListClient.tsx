'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useWorkspaces } from '@/hooks/workspace/useWorkspaceQuery';
import { AdminLoading } from '@/components/ui/AdminLoading';
import { WorkspaceList } from '@/components/workspace/list/WorkspaceList';
import {
  REPORT_HEALTHS,
  REPORT_HEALTH_LABEL,
  getReportHealth,
  type ReportHealth,
} from '@/components/workspace/list/WorkspaceCard';
import type { Workspace } from '@/types/workspace';

interface Props {
  // null → 전체 표시 (super_admin), 배열 → 해당 id 만 (admin)
  assignedIds: string[] | null;
}

export function WorkspaceListClient({ assignedIds }: Props) {
  const router = useRouter();
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<ReportHealth | null>(null);

  const { data: workspaces = [], isPending } = useWorkspaces();

  const visibleWorkspaces = useMemo(() => {
    const scoped =
      assignedIds === null
        ? workspaces
        : workspaces.filter((ws) => new Set(assignedIds).has(ws.id));
    if (!healthFilter) return scoped;
    return scoped.filter((ws) => getReportHealth(ws.latest_report) === healthFilter);
  }, [workspaces, assignedIds, healthFilter]);

  // 칩 카운트는 healthFilter 와 무관하게 scope 안 전체 분포로 계산해야 직관적
  const healthCounts = useMemo(() => {
    const scoped =
      assignedIds === null
        ? workspaces
        : workspaces.filter((ws) => new Set(assignedIds).has(ws.id));
    const counts: Record<ReportHealth, number> = {
      empty: 0, pending: 0, failed: 0, running: 0, review: 0, published: 0,
    };
    for (const ws of scoped) counts[getReportHealth(ws.latest_report)] += 1;
    return counts;
  }, [workspaces, assignedIds]);

  const handleSelect = (ws: Workspace) => {
    router.push(`/workspace/${ws.id}`);
  };

  const isFiltering = workspaceSearch.trim().length > 0 || healthFilter !== null;
  const clearAll = () => {
    setWorkspaceSearch('');
    setHealthFilter(null);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 w-full min-h-full">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">워크스페이스</h1>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={workspaceSearch}
            onChange={(e) => setWorkspaceSearch(e.target.value)}
            placeholder="회사명·티커 검색"
            disabled={isPending}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
          {workspaceSearch && (
            <button
              type="button"
              onClick={() => setWorkspaceSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="검색어 지우기"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* 헬스 필터 — 0건은 비활성으로 노출(분포 인지용) */}
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
          <FilterChip
            label="전체"
            count={Object.values(healthCounts).reduce((a, b) => a + b, 0)}
            active={healthFilter === null}
            onClick={() => setHealthFilter(null)}
          />
          {REPORT_HEALTHS.map((h) => (
            <FilterChip
              key={h}
              label={REPORT_HEALTH_LABEL[h]}
              tone={h}
              count={healthCounts[h]}
              active={healthFilter === h}
              disabled={healthCounts[h] === 0 && healthFilter !== h}
              onClick={() => setHealthFilter(healthFilter === h ? null : h)}
            />
          ))}
        </div>
      </div>

      {isPending ? (
        <AdminLoading message="워크스페이스 목록 불러오는 중" />
      ) : visibleWorkspaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3 px-6 text-center">
          {isFiltering ? (
            <>
              <p className="text-sm text-slate-500">
                {workspaceSearch && (
                  <>
                    <span className="font-semibold text-slate-700">"{workspaceSearch}"</span>
                    {healthFilter && ' · '}
                  </>
                )}
                {healthFilter && (
                  <span className="font-semibold text-slate-700">
                    {REPORT_HEALTH_LABEL[healthFilter]}
                  </span>
                )}
                에 해당하는 워크스페이스가 없습니다
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                필터 초기화
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              {assignedIds !== null && workspaces.length > 0
                ? '배정된 워크스페이스가 없습니다'
                : '아직 생성된 워크스페이스가 없습니다'}
            </p>
          )}
        </div>
      ) : (
        <WorkspaceList
          workspaces={visibleWorkspaces}
          searchQuery={workspaceSearch}
          onSelect={handleSelect}
        />
      )}
    </main>
  );
}

const TONE_CLASS: Partial<Record<ReportHealth, string>> = {
  failed: 'data-[active=true]:bg-red-50 data-[active=true]:text-red-700 data-[active=true]:border-red-200',
  running: 'data-[active=true]:bg-amber-50 data-[active=true]:text-amber-700 data-[active=true]:border-amber-200',
  review: 'data-[active=true]:bg-sky-50 data-[active=true]:text-sky-700 data-[active=true]:border-sky-200',
  published: 'data-[active=true]:bg-emerald-50 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-200',
  pending: 'data-[active=true]:bg-slate-100 data-[active=true]:text-slate-700 data-[active=true]:border-slate-300',
  empty: 'data-[active=true]:bg-slate-100 data-[active=true]:text-slate-700 data-[active=true]:border-slate-300',
};

function FilterChip({
  label,
  count,
  active,
  disabled,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  tone?: ReportHealth;
}) {
  const toneActive = tone ? TONE_CLASS[tone] ?? '' : 'data-[active=true]:bg-slate-800 data-[active=true]:text-white data-[active=true]:border-slate-800';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-active={active}
      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-500 rounded-full px-3 py-1.5 transition-all cursor-pointer hover:border-slate-300 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed ${toneActive}`}
    >
      {label}
      <span className="tabular-nums text-[10px] opacity-80">{count}</span>
    </button>
  );
}
