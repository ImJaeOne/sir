'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TickerBadge } from '@/components/ui/Badge';
import {
  useWorkspace,
  useWorkspaceProfile,
  useReports,
  useReportProgress,
  useReportRealtimeSync,
  useWorkspaceSubscription,
} from '@/hooks/workspace/useWorkspaceQuery';
import { AdminLoading } from '@/components/ui/AdminLoading';
import { WeeklyReportCard } from '@/components/workspace/detail/WeeklyReportCard';
import { EditProfileModal } from '@/components/workspace/detail/EditProfileModal';
import { BlacklistModal } from '@/components/workspace/detail/BlacklistModal';
import { StartAnalysisButton } from '@/components/workspace/detail/StartAnalysisButton';
import { ReportListItem } from '@/components/workspace/detail/ReportListItem';
import { useMyRole } from '@/hooks/user/useUserQuery';
import { ChevronRight, Pencil, ShieldOff } from 'lucide-react';

type ReportFilterTab = 'all' | 'weekly' | 'daily';

function isFilterTab(v: string | null): v is ReportFilterTab {
  return v === 'all' || v === 'weekly' || v === 'daily';
}

function ReportTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
        active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

interface WorkspaceDetailClientProps {
  workspaceId: string;
}

export function WorkspaceDetailClient({ workspaceId }: WorkspaceDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const typeParam = searchParams?.get('type') ?? null;
  const currentTab: ReportFilterTab = isFilterTab(typeParam) ? typeParam : 'all';

  const setTab = (t: ReportFilterTab) => {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    if (t === 'all') next.delete('type');
    else next.set('type', t);
    const qs = next.toString();
    router.replace(`/workspace/${workspaceId}${qs ? `?${qs}` : ''}`);
  };

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: profile } = useWorkspaceProfile(workspaceId);
  const { data: subscription } = useWorkspaceSubscription(workspaceId);
  const { data: myRole = 'user' } = useMyRole();
  const isSuperAdmin = myRole === 'super_admin';
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const { data: reports, isPending } = useReports(workspaceId);
  const { data: progressList } = useReportProgress(workspaceId);
  // 진행 중 세션 또는 pending 전략이 하나라도 있을 때만 Realtime 채널을 연다.
  // 폴링 비용은 채널 lifetime 에 비례하므로 done/failed 만 남은 워크스페이스는 구독을 끊는다.
  const hasActiveProgress = useMemo(() => {
    for (const p of progressList ?? []) {
      if (p.allSessions.some((s) => s.status !== 'done' && s.status !== 'failed')) return true;
      if (p.strategies.some((s) => s.status !== 'done' && s.status !== 'failed')) return true;
    }
    return false;
  }, [progressList]);
  useReportRealtimeSync(workspaceId, hasActiveProgress);
  const hasDaily = subscription?.has_daily ?? true;

  const filteredReports = useMemo(() => {
    if (!reports) return reports;
    if (currentTab === 'all') return reports;
    if (currentTab === 'daily') return reports.filter((r) => r.type === 'daily');
    return reports.filter((r) => r.type !== 'daily');
  }, [reports, currentTab]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [initialized, setInitialized] = useState(false);
  if (!initialized && filteredReports && filteredReports.length > 0) {
    setExpandedIds(new Set([filteredReports[0].id]));
    setInitialized(true);
  }

  const progressMap = useMemo(
    () => new Map((progressList ?? []).map((p) => [p.reportId, p])),
    [progressList]
  );

  // 분석 미시작 initial draft: super_admin 이 첫 분석을 트리거할 대상.
  // initial 은 status 가 분석 후에도 draft 로 유지되므로 sessions 존재 여부로 분기.
  const pendingInitial = useMemo(() => {
    if (!reports) return null;
    const candidate = reports.find((r) => r.type === 'initial' && r.status === 'draft');
    if (!candidate) return null;
    const progress = progressList?.find((p) => p.reportId === candidate.id);
    if (progress && progress.sessions.length > 0) return null;
    return candidate;
  }, [reports, progressList]);

  return (
    <div className="flex w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-full">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-7 min-h-full">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => router.push('/workspace')}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer -ml-1 px-1 py-0.5 rounded"
          >
            <ChevronRight size={14} className="rotate-180" strokeWidth={1.8} />
            워크스페이스
          </button>
        </div>
        {workspace && (
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 -mt-3">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                {workspace.company_name}
              </h1>
              <TickerBadge ticker={workspace.ticker} />
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {isSuperAdmin && pendingInitial && (
                <StartAnalysisButton
                  workspaceId={workspaceId}
                  reportId={pendingInitial.id}
                  size="sm"
                />
              )}
              <button
                onClick={() => setShowBlacklist(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
                title="블랙리스트 관리"
              >
                <ShieldOff size={13} strokeWidth={1.8} />
                블랙리스트 관리
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
                  title="회사 프로필 수정"
                >
                  <Pencil size={13} strokeWidth={1.8} />
                  프로필 수정
                </button>
              )}
            </div>
          </div>
        )}

        {showEditProfile && (
          <EditProfileModal
            workspaceId={workspaceId}
            profile={profile ?? null}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {showBlacklist && (
          <BlacklistModal
            workspaceId={workspaceId}
            onClose={() => setShowBlacklist(false)}
          />
        )}

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-slate-800">보고서</h2>
              {reports && reports.length > 0 && (
                <span className="text-xs text-slate-400 tabular-nums">
                  ({filteredReports?.length ?? 0})
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
              <ReportTabButton active={currentTab === 'all'} onClick={() => setTab('all')}>
                전체
              </ReportTabButton>
              <ReportTabButton active={currentTab === 'weekly'} onClick={() => setTab('weekly')}>
                주간
              </ReportTabButton>
              <ReportTabButton active={currentTab === 'daily'} onClick={() => setTab('daily')}>
                일간
              </ReportTabButton>
            </div>
          </div>

          {isPending && <AdminLoading message="보고서 불러오는 중" />}

          {!isPending && (!reports || reports.length === 0) && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-14 flex flex-col items-center gap-2">
              <span className="text-sm text-slate-400">아직 생성된 보고서가 없습니다.</span>
              <span className="text-xs text-slate-400">
                워크스페이스 생성 시 자동으로 보고서가 만들어집니다. 잠시 후 새로고침해 주세요.
              </span>
            </div>
          )}

          {!isPending && reports && reports.length > 0 && filteredReports?.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-14 flex flex-col items-center gap-2">
              <span className="text-sm text-slate-400">
                {currentTab === 'daily' ? '일간' : '주간'} 보고서가 없습니다.
              </span>
            </div>
          )}

          {filteredReports?.map((report) => {
            if (report.type === 'weekly') {
              return (
                <WeeklyReportCard
                  key={report.id}
                  report={report}
                  reports={reports ?? []}
                  progress={progressMap.get(report.id)}
                  progressByReportId={progressMap}
                  workspaceId={workspaceId}
                  isExpanded={expandedIds.has(report.id)}
                  onToggle={() => toggleExpand(report.id)}
                  hasDaily={hasDaily}
                />
              );
            }
            return (
              <ReportListItem
                key={report.id}
                report={report}
                workspaceId={workspaceId}
                progress={progressMap.get(report.id)}
                isExpanded={expandedIds.has(report.id)}
                onToggle={() => toggleExpand(report.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
