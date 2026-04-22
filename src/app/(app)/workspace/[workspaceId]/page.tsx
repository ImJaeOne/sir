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
import { useUpdateWorkspaceProfile, useRetryFailedReport } from '@/hooks/workspace/useWorkspaceMutation';
import { createClient } from '@/lib/supabase/client';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import type { WorkspaceProfile } from '@/types/workspace';
import { ChevronDown, ChevronUp, ChevronRight, RefreshCw, AlertCircle, Pencil } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-slate-800">회사 프로필 수정</h2>
            <Tooltip text="AI 분석의 정확도 향상을 위한 필드입니다." />
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              업종
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 게임, 반도체, 바이오"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              사업 개요
            </label>
            <textarea
              value={businessSummary}
              onChange={(e) => setBusinessSummary(e.target.value)}
              placeholder="주요 사업 내용, 매출 구조, 자회사 등"
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-y min-h-[96px] max-h-[200px]"
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
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:shadow-none"
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: '작업 전',       color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-100'   },
  crawling:   { label: '크롤링 중',     color: 'text-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  analyzing:  { label: '분석 중',       color: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
  clustering: { label: '클러스터링 중', color: 'text-violet-500',  bg: 'bg-violet-50',  border: 'border-violet-100'  },
  done:       { label: '완료',          color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  failed:     { label: '실패',          color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-100'     },
};

const STATUS_FALLBACK = STATUS_CONFIG.pending;

const FAILED_REASON_LABELS: Record<string, string> = {
  collect: '수집 실패',
  save: '저장 실패',
  analyze: '분석 실패',
  calculate: '계산 실패',
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

type ReportHealth = 'empty' | 'failed' | 'running' | 'done' | 'pending';

/** 진행 상태 기반 카드 좌측 stripe 색 결정 */
function getReportHealth(progress: ReportProgress | undefined): ReportHealth {
  if (!progress || progress.sessions.length === 0) return 'empty';
  const statuses = progress.sessions.map((s) => s.status);
  if (statuses.some((s) => s === 'failed')) return 'failed';
  if (statuses.some((s) => ['pending', 'crawling', 'pending_analysis', 'analyzing', 'clustering'].includes(s))) return 'running';
  if (statuses.every((s) => s === 'done')) return 'done';
  return 'pending';
}

const HEALTH_STRIPE: Record<ReportHealth, string> = {
  empty:   'bg-slate-200',
  failed:  'bg-red-400',
  running: 'bg-amber-400',
  done:    'bg-emerald-400',
  pending: 'bg-slate-200',
};


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
    status === 'done' ? 'bg-emerald-400' :
    status === 'failed' ? 'bg-red-400' :
    status === 'pending' ? 'bg-slate-200' :
    'bg-amber-400 animate-pulse';

  const summaryStatus = progress?.hasSummary ? 'done' : 'pending';
  const strategyStatus = (progress?.strategyCategories?.length ?? 0) > 0 ? 'done' : 'pending';

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
            title={`총평: ${summaryStatus === 'done' ? '완료' : '작업 전'}`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotClassFor(strategyStatus)}`}
            title={`대응 전략: ${strategyStatus === 'done' ? '완료' : '작업 전'}`}
          />
        </>
      )}
    </div>
  );
}

function FailedPlatformRow({
  platformId,
  session,
  cfg,
}: {
  platformId: string;
  session: ReportProgress['sessions'][number];
  cfg: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];
}) {
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
      <SessionStatusDot status="failed" />
      <span className="text-xs text-slate-700 font-medium">{PLATFORM_LABELS[platformId] ?? platformId}</span>
      <span className={`text-xs font-semibold ml-auto ${cfg.color} flex items-center gap-1`}>
        {session.failed_reason ? (FAILED_REASON_LABELS[session.failed_reason] ?? cfg.label) : cfg.label}
        {session.error_message && (
          <Tooltip text={session.error_message} variant="danger" position="left" />
        )}
      </span>
    </div>
  );
}

function RetryFailedButton({
  workspaceId,
  reportId,
  failedLabels,
  reportType,
}: {
  workspaceId: string;
  reportId: string;
  failedLabels: string[];
  reportType: Report['type'];
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

  const channelText = failedLabels.join(', ');
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        disabled={retry.isPending}
        title={`실패한 채널 재시도: ${channelText}`}
        className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white border border-red-200 rounded-md px-2 py-1 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={10} className={retry.isPending ? 'animate-spin' : ''} />
        {retry.isPending ? '재시도 중' : `실패 재시도 (${failedLabels.length})`}
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
            실패한 채널(<b>{channelText}</b>)에 대해 수집·분석을 재진행합니다.
            {reportType !== 'daily' && (
              <>
                <br />
                성공 시 전략·총평까지 자동으로 재생성됩니다.
              </>
            )}
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
  const failedPlatforms = ALL_PLATFORMS.filter((p) => sessionMap.get(p)?.status === 'failed');
  const failedLabels = failedPlatforms.map((p) => PLATFORM_LABELS[p] ?? p);
  const hasAnyFinalize = progress.hasSummary || progress.strategyCategories.length > 0;

  return (
    <div className="px-4 sm:px-5 py-4 flex flex-col gap-4">
      {/* 플랫폼별 세션 상태 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">채널별 수집·분석</span>
          {failedLabels.length > 0 && (
            <RetryFailedButton
              workspaceId={workspaceId}
              reportId={reportId}
              failedLabels={failedLabels}
              reportType={reportType}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_PLATFORMS.map((platformId) => {
            const s = sessionMap.get(platformId);
            const status = s?.status ?? 'pending';
            const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;

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
              <div key={platformId} className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
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

      {/* 총평 & 전략 — daily 는 finalize 없음, 노출 생략 */}
      {reportType !== 'daily' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">전략·총평 생성</span>
          </div>
          {failedLabels.length > 0 && hasAnyFinalize && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 leading-snug">
              <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
              <span>실패한 플랫폼 결과가 빠진 상태로 전략/총평이 생성되었습니다. 위 "실패 재시도" 버튼으로 일괄 복구하세요.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {(() => {
              const cfg = progress.hasSummary ? STATUS_CONFIG.done : STATUS_FALLBACK;
              return (
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
                  <SessionStatusDot status={progress.hasSummary ? 'done' : 'crawling'} />
                  <span className="text-xs text-slate-600 font-medium">총평</span>
                  <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
                    {progress.hasSummary ? '완료' : '작업 전'}
                  </span>
                </div>
              );
            })()}
            {(() => {
              const done = progress.strategyCategories.length > 0;
              const cfg = done ? STATUS_CONFIG.done : STATUS_FALLBACK;
              return (
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
                  <SessionStatusDot status={done ? 'done' : 'crawling'} />
                  <span className="text-xs text-slate-600 font-medium">대응 전략</span>
                  <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
                    {done ? `${progress.strategyCategories.length}개 채널` : '작업 전'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
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
    } catch {
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
    } catch {
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

  // 가장 최근 보고서 1개만 자동 열기 (reports 로드 후)
  const [initialized, setInitialized] = useState(false);
  if (!initialized && filteredReports && filteredReports.length > 0) {
    setExpandedIds(new Set([filteredReports[0].id]));
    setInitialized(true);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-7">
        {/* 워크스페이스 정보 */}
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
            <button
              onClick={() => setShowEditProfile(true)}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer"
              title="회사 프로필 수정"
            >
              <Pencil size={13} strokeWidth={1.8} />
              프로필 수정
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
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-slate-800">보고서</h2>
              {reports && reports.length > 0 && (
                <span className="text-xs text-slate-400 tabular-nums">({filteredReports?.length ?? 0})</span>
              )}
            </div>
            <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
              <ReportTabButton active={currentTab === 'all'} onClick={() => setTab('all')}>전체</ReportTabButton>
              <ReportTabButton active={currentTab === 'weekly'} onClick={() => setTab('weekly')}>주간</ReportTabButton>
              <ReportTabButton active={currentTab === 'daily'} onClick={() => setTab('daily')}>일간</ReportTabButton>
            </div>
          </div>

          {isLoading && <p className="text-sm text-slate-400 py-10 text-center">불러오는 중...</p>}

          {!isLoading && (!reports || reports.length === 0) && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-14 flex flex-col items-center gap-4">
              <span className="text-sm text-slate-400">아직 생성된 보고서가 없습니다</span>
              <CreateReportButton workspaceId={workspaceId} />
            </div>
          )}

          {!isLoading && reports && reports.length > 0 && filteredReports?.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-14 flex flex-col items-center gap-2">
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
            const health = getReportHealth(progress);
            const failedCount = progress?.sessions.filter((s) => s.status === 'failed').length ?? 0;

            return (
              <div
                key={report.id}
                className="group w-full bg-white rounded-2xl border border-slate-100 shadow-sm flex items-stretch overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200"
              >
                <div className={`w-1 shrink-0 ${HEALTH_STRIPE[health]}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="px-3 sm:px-4 py-3.5 flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(report.id)}
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
      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
        active
          ? 'bg-white text-slate-800 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
