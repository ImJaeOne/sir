'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from '@/components/ui/Tooltip';
import { TickerBadge } from '@/components/ui/Badge';
import { BlacklistEditor } from '@/components/ui/BlacklistEditor';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWorkspace, useWorkspaceProfile, useReports, useReportProgress, useReportRealtimeSync, workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import { useUpdateWorkspaceProfile, useRegenerateReport, useRetryFailedReport } from '@/hooks/workspace/useWorkspaceMutation';
import { createClient } from '@/lib/supabase/client';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import { ACTIVE_PLATFORMS, isAllPlatformsDone } from '@/lib/api/workspaceApi';
import type { WorkspaceProfile } from '@/types/workspace';
import { ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';

function EditProfileModal({
  workspaceId,
  profile,
  onClose,
}: {
  workspaceId: string;
  profile: WorkspaceProfile | null;
  onClose: () => void;
}) {
  const updateProfile = useUpdateWorkspaceProfile(workspaceId);
  const initialIndustry = profile?.industry ?? '';
  const initialSummary = profile?.business_summary ?? '';
  const [industry, setIndustry] = useState(initialIndustry);
  const [businessSummary, setBusinessSummary] = useState(initialSummary);

  // 블랙리스트 (디시 갤러리 + 유튜브 키워드)
  const [initialDcBlacklist, setInitialDcBlacklist] = useState<string[]>([]);
  const [dcBlacklist, setDcBlacklist] = useState<string[]>([]);
  const [initialYtBlacklist, setInitialYtBlacklist] = useState<string[]>([]);
  const [ytBlacklist, setYtBlacklist] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('content_blacklist')
      .select('platform_id, type, value')
      .in('platform_id', ['dcinside', 'youtube'])
      .then(({ data }) => {
        const dc = data?.filter((d) => d.platform_id === 'dcinside' && d.type === 'gallery').map((d) => d.value) ?? [];
        const yt = data?.filter((d) => d.platform_id === 'youtube' && d.type === 'keyword').map((d) => d.value) ?? [];
        setInitialDcBlacklist(dc);
        setDcBlacklist(dc);
        setInitialYtBlacklist(yt);
        setYtBlacklist(yt);
      });
  }, []);

  const dcChanged = dcBlacklist.length !== initialDcBlacklist.length || dcBlacklist.some((v) => !initialDcBlacklist.includes(v));
  const ytChanged = ytBlacklist.length !== initialYtBlacklist.length || ytBlacklist.some((v) => !initialYtBlacklist.includes(v));

  const hasChanges =
    industry.trim() !== initialIndustry ||
    businessSummary.trim() !== initialSummary ||
    dcChanged || ytChanged;

  const handleSave = async () => {
    if (!hasChanges) return;

    const profileChanged =
      industry.trim() !== initialIndustry || businessSummary.trim() !== initialSummary;
    if (profileChanged) {
      updateProfile.mutate({
        industry: industry.trim() || null,
        business_summary: businessSummary.trim() || null,
      });
    }

    const supabase = createClient();

    // 디시 블랙리스트 저장
    if (dcChanged) {
      const added = dcBlacklist.filter((v) => !initialDcBlacklist.includes(v));
      const removed = initialDcBlacklist.filter((v) => !dcBlacklist.includes(v));
      if (removed.length > 0) await supabase.from('content_blacklist').delete().eq('platform_id', 'dcinside').eq('type', 'gallery').in('value', removed);
      if (added.length > 0) await supabase.from('content_blacklist').insert(added.map((value) => ({ platform_id: 'dcinside', type: 'gallery', value })));
    }

    // 유튜브 블랙리스트 저장
    if (ytChanged) {
      const added = ytBlacklist.filter((v) => !initialYtBlacklist.includes(v));
      const removed = initialYtBlacklist.filter((v) => !ytBlacklist.includes(v));
      if (removed.length > 0) await supabase.from('content_blacklist').delete().eq('platform_id', 'youtube').eq('type', 'keyword').in('value', removed);
      if (added.length > 0) await supabase.from('content_blacklist').insert(added.map((value) => ({ platform_id: 'youtube', type: 'keyword', value })));
    }

    toast.success('저장되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-slate-800">회사 프로필 수정</h2>
            <Tooltip text="AI 분석의 정확도 향상을 위한 필드입니다." />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            업종
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: 게임, 반도체, 바이오"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            사업 개요
          </label>
          <textarea
            value={businessSummary}
            onChange={(e) => setBusinessSummary(e.target.value)}
            placeholder="주요 사업 내용, 매출 구조, 자회사 등"
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 transition-colors resize-none"
          />
        </div>

        <BlacklistEditor
          title="디시인사이드 갤러리 블랙리스트"
          description="크롤링 시 제외할 갤러리명을 입력하세요"
          placeholder="예: 리그오브레전드"
          items={dcBlacklist}
          onAdd={(v) => setDcBlacklist((prev) => [...prev, v])}
          onRemove={(v) => setDcBlacklist((prev) => prev.filter((x) => x !== v))}
        />

        <BlacklistEditor
          title="유튜브 키워드 블랙리스트"
          description="제목/설명에 포함된 영상을 제외합니다"
          placeholder="예: LoL, 리그오브레전드"
          items={ytBlacklist}
          onAdd={(v) => setYtBlacklist((prev) => [...prev, v])}
          onRemove={(v) => setYtBlacklist((prev) => prev.filter((x) => x !== v))}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '작업 전', color: 'text-slate-400' },
  crawling: { label: '크롤링 중', color: 'text-blue-500' },
  analyzing: { label: '분석 중', color: 'text-amber-500' },
  clustering: { label: '클러스터링 중', color: 'text-violet-500' },
  done: { label: '완료', color: 'text-emerald-500' },
  failed: { label: '실패', color: 'text-red-500' },
};

function SessionStatusDot({ status }: { status: string }) {
  const dotColor =
    status === 'done' ? 'bg-emerald-400' :
    status === 'failed' ? 'bg-red-400' :
    status === 'pending' ? 'bg-slate-300' :
    'bg-amber-400 animate-pulse';
  return <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
}

const ALL_PLATFORMS = ['naver_news', 'naver_blog', 'youtube', 'naver_stock'];

function FailedPlatformRow({
  platformId,
  session,
  cfg,
}: {
  platformId: string;
  session: ReportProgress['sessions'][number];
  cfg: { label: string; color: string };
}) {
  return (
    <div className="flex flex-col gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <SessionStatusDot status="failed" />
        <span className="text-xs text-slate-700 font-medium">{PLATFORM_LABELS[platformId] ?? platformId}</span>
        <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
          {session.failed_reason ? `${cfg.label} (${session.failed_reason})` : cfg.label}
        </span>
      </div>
      {session.error_message && (
        <p className="text-[10px] text-red-700/80 leading-snug pl-3.5 whitespace-pre-wrap break-words">
          {session.error_message}
        </p>
      )}
    </div>
  );
}

function RetryFailedButton({
  workspaceId,
  reportId,
  failedCount,
}: {
  workspaceId: string;
  reportId: string;
  failedCount: number;
}) {
  const retry = useRetryFailedReport(workspaceId);
  const [open, setOpen] = useState(false);
  const handleConfirm = async () => {
    setOpen(false);
    try {
      await retry.mutateAsync(reportId);
      toast.success('일괄 재시도를 시작했습니다. 수 분 후 새로고침하세요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '재시도 실패');
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        disabled={retry.isPending}
        title="실패한 플랫폼을 순차 재시도 후 자동 재생성"
        className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white border border-red-200 rounded-md px-2 py-1 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={10} className={retry.isPending ? 'animate-spin' : ''} />
        {retry.isPending ? '재시도 중' : `실패 재시도 (${failedCount})`}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="실패 재시도"
        confirmVariant="danger"
        confirmLabel="재시도"
        message={
          <>
            실패한 플랫폼 {failedCount}건을 일괄 재시도합니다.
            <br />
            성공 시 전략·총평까지 자동으로 재생성됩니다.
          </>
        }
      />
    </>
  );
}

function RegenerateButton({
  workspaceId,
  reportId,
  disabled,
  reason,
}: {
  workspaceId: string;
  reportId: string;
  disabled: boolean;
  reason: string;
}) {
  const regen = useRegenerateReport(workspaceId);
  const [open, setOpen] = useState(false);
  const handleConfirm = async () => {
    setOpen(false);
    try {
      await regen.mutateAsync(reportId);
      toast.success('재생성을 시작했습니다. 수 분 후 새로고침하세요.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '재생성 실패');
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        disabled={disabled || regen.isPending}
        title={disabled ? reason : '전략·총평·SIR 재생성'}
        className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-white border border-blue-200 rounded-md px-2 py-1 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RefreshCw size={10} className={regen.isPending ? 'animate-spin' : ''} />
        {regen.isPending ? '재생성 중' : '재생성'}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="보고서 재생성"
        confirmLabel="재생성"
        message={
          <>
            전략·총평·검색트렌드·SIR 을 재생성합니다.
            <br />
            기존 전략·총평 행은 삭제됩니다.
          </>
        }
      />
    </>
  );
}

function ReportProgressPanel({
  workspaceId,
  reportId,
  reportType,
  progress,
}: {
  workspaceId: string;
  reportId: string;
  reportType: Report['type'];
  progress: ReportProgress;
}) {
  const sessionMap = new Map(progress.sessions.map((s) => [s.platform_id, s]));
  const platformsOk = isAllPlatformsDone(progress);
  const isFinalizable = reportType !== 'daily';
  const failedCount = ALL_PLATFORMS.filter((p) => sessionMap.get(p)?.status === 'failed').length;
  const hasAnyFinalize = progress.hasSummary || progress.strategyCategories.length > 0;

  return (
    <div className="px-5 pb-4 flex flex-col gap-3">
      {/* 플랫폼별 세션 상태 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">플랫폼별 수집 현황</span>
          {isFinalizable && failedCount > 0 && (
            <RetryFailedButton
              workspaceId={workspaceId}
              reportId={reportId}
              failedCount={failedCount}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_PLATFORMS.map((platformId) => {
            const s = sessionMap.get(platformId);
            const status = s?.status ?? 'pending';
            const cfg = STATUS_CONFIG[status] ?? { label: '작업 전', color: 'text-slate-400' };

            if (status === 'failed' && s) {
              return (
                <FailedPlatformRow
                  key={platformId}
                  platformId={platformId}
                  session={s}
                  cfg={cfg}
                />
              );
            }

            return (
              <div key={platformId} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <SessionStatusDot status={status} />
                <span className="text-xs text-slate-600 font-medium">{PLATFORM_LABELS[platformId] ?? platformId}</span>
                {status === 'done' && (
                  <span className="text-[10px] text-slate-400 ml-auto">{s?.total_items ?? 0}건</span>
                )}
                <span className={`text-xs font-semibold ${status !== 'done' ? 'ml-auto' : ''} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 총평 & 전략 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">보고서 생성 현황</span>
          {/* 자동 재생성이 실패했을 때만 수동 fallback 버튼 노출 (전 플랫폼 done 인데 총평 없음) */}
          {isFinalizable && platformsOk && !progress.hasSummary && (
            <RegenerateButton
              workspaceId={workspaceId}
              reportId={reportId}
              disabled={false}
              reason=""
            />
          )}
        </div>
        {failedCount > 0 && hasAnyFinalize && (
          <div className="flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 leading-snug">
            <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
            <span>실패한 플랫폼 결과가 빠진 상태로 전략/총평이 생성되었습니다. 위 "실패 재시도" 버튼으로 일괄 복구하세요.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <SessionStatusDot status={progress.hasSummary ? 'done' : 'crawling'} />
            <span className="text-xs text-slate-600 font-medium">총평</span>
            <span className={`text-xs font-semibold ml-auto ${progress.hasSummary ? 'text-emerald-500' : 'text-slate-400'}`}>
              {progress.hasSummary ? '완료' : '작업 전'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <SessionStatusDot status={progress.strategyCategories.length > 0 ? 'done' : 'crawling'} />
            <span className="text-xs text-slate-600 font-medium">대응 전략</span>
            <span className={`text-xs font-semibold ml-auto ${progress.strategyCategories.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {progress.strategyCategories.length > 0 ? `${progress.strategyCategories.length}개 채널` : '작업 전'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StartPipelineButton({ workspaceId, reportId, periodLabel }: { workspaceId: string; reportId: string; periodLabel: string }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleStart = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('인증이 필요합니다.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pipeline/all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId, report_id: reportId }),
      });

      if (!res.ok) throw new Error('파이프라인 시작 실패');

      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
      toast.success(`분석이 시작되었습니다. (${periodLabel})`);
    } catch (e) {
      toast.error('분석 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleStart(); }}
      disabled={loading}
      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '시작 중...' : '분석 시작'}
    </button>
  );
}

function CreateReportButton({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    if (!isMonday) {
      toast.error('보고서는 매주 월요일에 생성할 수 있습니다.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('인증이 필요합니다.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (!res.ok) throw new Error('보고서 생성 실패');

      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
      toast.success(`보고서가 생성되었습니다. (${data.period_start} ~ ${data.period_end})`);
    } catch (e) {
      toast.error('보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '생성 중...' : '보고서 생성'}
    </button>
  );
}

type ReportFilterTab = 'all' | 'weekly' | 'daily';

function isFilterTab(v: string | null): v is ReportFilterTab {
  return v === 'all' || v === 'weekly' || v === 'daily';
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId as string;

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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { data: reports, isLoading } = useReports(workspaceId);
  const { data: progressList } = useReportProgress(workspaceId);
  useReportRealtimeSync(workspaceId);

  // initial(월간)은 '주간' 탭에 포함 — weekly 흐름의 첫 번째 30일치라 의미상 같은 축
  const filteredReports = useMemo(() => {
    if (!reports) return reports;
    if (currentTab === 'all') return reports;
    if (currentTab === 'daily') return reports.filter((r) => r.type === 'daily');
    return reports.filter((r) => r.type !== 'daily');
  }, [reports, currentTab]);

  // 진행 중인 보고서는 기본 열림, 완료된 보고서는 닫힘
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 진행 중인 보고서 자동 열기 (reports/progressList 로드 후)
  const [initialized, setInitialized] = useState(false);
  if (!initialized && reports && progressList) {
    const inProgress = new Set<string>();
    for (const report of reports) {
      if (report.status !== 'published') {
        inProgress.add(report.id);
      }
    }
    if (inProgress.size > 0) setExpandedIds(inProgress);
    setInitialized(true);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* 워크스페이스 정보 */}
        {workspace && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">{workspace.company_name}</h1>
              <TickerBadge ticker={workspace.ticker} />
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="회사 프로필 수정"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 15h6.75" />
                <path d="M12.375 2.625a1.591 1.591 0 0 1 2.25 2.25L5.25 14.25l-3 .75.75-3 9.375-9.375z" />
              </svg>
            </button>
          </div>
        )}

        {showEditProfile && (
          <EditProfileModal
            workspaceId={workspaceId}
            profile={profile ?? null}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {/* 리포트 목록 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">보고서</h2>
            <div className="flex gap-1">
              <ReportTabButton active={currentTab === 'all'} onClick={() => setTab('all')}>전체</ReportTabButton>
              <ReportTabButton active={currentTab === 'weekly'} onClick={() => setTab('weekly')}>주간</ReportTabButton>
              <ReportTabButton active={currentTab === 'daily'} onClick={() => setTab('daily')}>일간</ReportTabButton>
            </div>
          </div>

          {isLoading && <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>}

          {!isLoading && (!reports || reports.length === 0) && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-3">
              <span className="text-sm text-slate-400">아직 생성된 보고서가 없습니다</span>
              <CreateReportButton workspaceId={workspaceId} />
            </div>
          )}

          {!isLoading && reports && reports.length > 0 && filteredReports?.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-2">
              <span className="text-sm text-slate-400">
                {currentTab === 'daily' ? '일간' : '주간'} 보고서가 없습니다
              </span>
            </div>
          )}

          {filteredReports?.map((report) => {
            const periodStart = report.period_start.replace(/-/g, '.');
            const periodEnd = report.period_end.replace(/-/g, '.');
            const typeLabel =
              report.type === 'initial'
                ? '월간 보고서'
                : report.type === 'daily'
                  ? '일간 보고서'
                  : '주간 보고서';
            const isAutoPublished = report.type === 'daily' && report.status === 'published';
            const statusColor = isAutoPublished
              ? 'bg-violet-50 text-violet-700'
              : report.status === 'published'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700';
            const statusLabel = isAutoPublished
              ? '자동 발행'
              : report.status === 'published'
                ? '검토 완료'
                : '검토 대기';
            const isExpanded = expandedIds.has(report.id);
            const progress = progressList?.find(p => p.reportId === report.id);
            const isNotAnalyzed = !progress || progress.sessions.length === 0;
            const periodLabel = report.type === 'daily' ? periodStart : `${periodStart} ~ ${periodEnd}`;

            return (
              <div
                key={report.id}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                <div className="px-5 py-4 sm:px-6 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(report.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {isExpanded
                      ? <ChevronUp size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />
                    }
                  </button>
                  <button
                    onClick={() => router.push(`/workspace/${workspaceId}/${report.id}`)}
                    className="flex-1 flex items-center justify-between ml-3 text-left cursor-pointer"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {periodLabel}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{typeLabel}</span>
                    </div>
                    {!isNotAnalyzed && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 shrink-0">
                        <path d="M6 4l4 4-4 4" />
                      </svg>
                    )}
                  </button>
                  {isNotAnalyzed && (
                    <StartPipelineButton
                      workspaceId={workspaceId}
                      reportId={report.id}
                      periodLabel={periodLabel}
                    />
                  )}
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
            );
          })}
        </div>
      </div>
    </div>
  );
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
      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer ${
        active
          ? 'bg-slate-800 text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
