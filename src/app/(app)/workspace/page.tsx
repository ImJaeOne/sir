'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, AlertTriangle } from 'lucide-react';
import { useWorkspaces, useWorkspacesRealtimeSync } from '@/hooks/workspace/useWorkspaceQuery';
import type { Workspace } from '@/types/workspace';
import type { LatestReport } from '@/lib/api/workspaceApi';

type ReportHealth = 'empty' | 'failed' | 'running' | 'published' | 'review';

function getReportHealth(latest: LatestReport | undefined): ReportHealth {
  if (!latest) return 'empty';
  if (latest.has_failed_session) return 'failed';
  if (latest.has_running_session) return 'running';
  if (latest.status === 'published') return 'published';
  return 'review';
}

const HEALTH_STYLE: Record<ReportHealth, { stripe: string; chip: string; label: string }> = {
  empty:     { stripe: 'bg-slate-200',   chip: 'bg-slate-100 text-slate-500',     label: '보고서 없음' },
  failed:    { stripe: 'bg-red-400',     chip: 'bg-red-50 text-red-600',          label: '실패' },
  running:   { stripe: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700',      label: '진행 중' },
  review:    { stripe: 'bg-sky-400',     chip: 'bg-sky-50 text-sky-700',          label: '검토 대기' },
  published: { stripe: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700',  label: '검토 완료' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  const { data: workspaces = [], isLoading } = useWorkspaces();
  useWorkspacesRealtimeSync();

  const handleSelect = (ws: Workspace) => {
    router.push(`/workspace/${ws.id}`);
  };

  return (
    <div className="min-h-0">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">워크스페이스</h1>
          <p className="text-xs text-slate-400">
            {workspaces.length > 0 ? `총 ${workspaces.length}개` : '등록된 워크스페이스가 없습니다'}
          </p>
        </div>

        {/* Existing workspaces */}
        <div className="flex flex-col gap-3">
          {workspaces.length > 0 && (
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
                className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          )}
          {isLoading && (
            <div className="text-center py-14">
              <p className="text-slate-400 text-sm">불러오는 중...</p>
            </div>
          )}
          {!isLoading && workspaces.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 flex flex-col items-center gap-3">
              <p className="text-sm text-slate-400">아직 생성된 워크스페이스가 없습니다</p>
            </div>
          )}
          {(() => {
            const isSearching = workspaceSearch.trim().length > 0;
            const matched = workspaces.filter(
              (ws) => ws.company_name.includes(workspaceSearch) || ws.ticker.includes(workspaceSearch)
            );
            const rest = isSearching ? workspaces.filter((ws) => !matched.includes(ws)) : [];

            const renderCard = (ws: Workspace & { latest_report?: LatestReport }) => {
              const latest = ws.latest_report;
              const health = getReportHealth(latest);
              const style = HEALTH_STYLE[health];
              const latestLabel = latest
                ? latest.period_start === latest.period_end
                  ? latest.period_start.replace(/-/g, '.')
                  : `${latest.period_start.replace(/-/g, '.')} ~ ${latest.period_end.replace(/-/g, '.')}`
                : null;

              return (
                <div
                  key={ws.id}
                  className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-stretch overflow-hidden hover:shadow-md hover:border-slate-200 hover:-translate-y-px transition-all duration-200"
                >
                  <div className={`w-1 shrink-0 ${style.stripe}`} aria-hidden />
                  <button
                    onClick={() => handleSelect(ws)}
                    className="flex-1 flex items-center gap-3 px-5 py-4 text-left cursor-pointer min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-800 truncate">{ws.company_name}</h3>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style.chip}`}>
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
            };

            if (!isSearching) {
              return workspaces.map(renderCard);
            }

            return (
              <>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    검색 결과 <span className="text-slate-400 normal-case tracking-normal">({matched.length}건)</span>
                  </h3>
                  {matched.length > 0 ? (
                    matched.map(renderCard)
                  ) : (
                    <p className="text-sm text-slate-400 py-6 text-center">검색 결과가 없습니다</p>
                  )}
                </div>
                {rest.length > 0 && (
                  <div className="flex flex-col gap-3 mt-5">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      내 워크스페이스
                    </h3>
                    {rest.map(renderCard)}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
