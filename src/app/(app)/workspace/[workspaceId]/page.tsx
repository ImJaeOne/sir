'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from '@/components/ui/Tooltip';
import { TickerBadge } from '@/components/ui/Badge';
import { useWorkspace, useWorkspaceProfile, useReports, useReportProgress, workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import { useUpdateWorkspaceProfile } from '@/hooks/workspace/useWorkspaceMutation';
import { createClient } from '@/lib/supabase/client';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import type { WorkspaceProfile } from '@/types/workspace';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

  const hasChanges =
    industry.trim() !== initialIndustry || businessSummary.trim() !== initialSummary;

  const handleSave = () => {
    if (!hasChanges) return;
    updateProfile.mutate(
      {
        industry: industry.trim() || null,
        business_summary: businessSummary.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('회사 프로필이 저장되었습니다.');
          onClose();
        },
        onError: () => {
          toast.error('저장에 실패했습니다.');
        },
      }
    );
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
    'bg-amber-400 animate-pulse';
  return <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />;
}

function ReportProgressPanel({ progress }: { progress: ReportProgress }) {
  return (
    <div className="px-5 pb-4 flex flex-col gap-3">
      {/* 플랫폼별 세션 상태 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-500">플랫폼별 수집 현황</span>
        <div className="grid grid-cols-2 gap-1.5">
          {progress.sessions.map((s, i) => {
            const cfg = STATUS_CONFIG[s.status] ?? { label: s.status, color: 'text-slate-400' };
            return (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <SessionStatusDot status={s.status} />
                <span className="text-xs text-slate-600 font-medium">{PLATFORM_LABELS[s.platform_id] ?? s.platform_id}</span>
                <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
                  {s.status === 'failed' && s.failed_reason ? `${cfg.label} (${s.failed_reason})` : cfg.label}
                </span>
                {s.status === 'done' && s.total_items > 0 && (
                  <span className="text-[10px] text-slate-400">{s.total_items}건</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 총평 & 전략 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-500">보고서 생성 현황</span>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <SessionStatusDot status={progress.hasSummary ? 'done' : 'crawling'} />
            <span className="text-xs text-slate-600 font-medium">총평</span>
            <span className={`text-xs font-semibold ml-auto ${progress.hasSummary ? 'text-emerald-500' : 'text-slate-400'}`}>
              {progress.hasSummary ? '완료' : '대기'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <SessionStatusDot status={progress.strategyCategories.length > 0 ? 'done' : 'crawling'} />
            <span className="text-xs text-slate-600 font-medium">대응 전략</span>
            <span className={`text-xs font-semibold ml-auto ${progress.strategyCategories.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {progress.strategyCategories.length > 0 ? `${progress.strategyCategories.length}개 채널` : '대기'}
            </span>
          </div>
        </div>
      </div>
    </div>
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
      toast.success(`보고서가 생성되었습니다. (${data.period_start} ~ ${data.period_end})`);
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
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
      {loading ? '생성 중...' : '첫 보고서 생성하기'}
    </button>
  );
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: profile } = useWorkspaceProfile(workspaceId);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { data: reports, isLoading } = useReports(workspaceId);
  const { data: progressList } = useReportProgress(workspaceId);

  console.log('reports:', reports);
  console.log('progressList:', progressList);

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
          <h2 className="text-sm font-semibold text-slate-700">보고서</h2>

          {isLoading && <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>}

          {!isLoading && (!reports || reports.length === 0) && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-3">
              <span className="text-sm text-slate-400">아직 생성된 보고서가 없습니다</span>
              <CreateReportButton workspaceId={workspaceId} />
            </div>
          )}

          {reports?.map((report) => {
            const periodStart = report.period_start.replace(/-/g, '.');
            const periodEnd = report.period_end.replace(/-/g, '.');
            const typeLabel = report.type === 'initial' ? '월간 보고서' : '주간 보고서';
            const statusColor = report.status === 'published'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700';
            const statusLabel = report.status === 'published' ? '검토 완료' : '검토 대기';
            const isExpanded = expandedIds.has(report.id);
            const progress = progressList?.find(p => p.reportId === report.id);

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
                          {periodStart} ~ {periodEnd}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{typeLabel}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 shrink-0">
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </button>
                </div>
                {isExpanded && progress && (
                  <div className="border-t border-slate-100">
                    <ReportProgressPanel progress={progress} />
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
