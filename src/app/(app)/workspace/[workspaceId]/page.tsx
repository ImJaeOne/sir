'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';
import { TickerBadge } from '@/components/ui/Badge';
import { useWorkspace, useWorkspaceProfile } from '@/hooks/workspace/useWorkspaceQuery';
import { useUpdateWorkspaceProfile } from '@/hooks/workspace/useWorkspaceMutation';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';
import type { Report } from '@/lib/api/workspaceApi';
import type { WorkspaceProfile } from '@/types/workspace';

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

function formatPeriodDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function StartAnalysisModal({
  workspaceId,
  onClose,
  onTriggered,
}: {
  workspaceId: string;
  onClose: () => void;
  onTriggered: () => void;
}) {
  const trigger = useTriggerPipeline(workspaceId);

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() - 1);
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - 29);

  const handleConfirm = () => {
    trigger.mutate(undefined, {
      onSuccess: () => {
        toast.success('데이터 수집이 시작되었습니다.');
        onTriggered();
        onClose();
      },
      onError: (err) => {
        toast.error(err.message || '수집 시작에 실패했습니다.');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">데이터 수집 시작</h2>
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

        <div className="bg-slate-50 rounded-xl px-4 py-3.5 flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            수집 기간
          </span>
          <span className="text-sm font-semibold text-slate-800">
            {formatPeriodDate(periodStart)} ~ {formatPeriodDate(periodEnd)}
          </span>
          <span className="text-xs text-slate-400">
            뉴스, 커뮤니티, 블로그, 유튜브 5개 플랫폼에서 수집합니다
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={trigger.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={trigger.isPending}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            {trigger.isPending ? '시작 중...' : '수집 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getPlatformLabel(platformId: string | null): string {
  if (!platformId) return '기타';
  return PLATFORMS.find((p) => p.id === platformId)?.label ?? platformId;
}

function toDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

interface SessionGroup {
  dateKey: string;
  displayDate: string;
  sessions: CrawlSession[];
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: profile } = useWorkspaceProfile(workspaceId);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { data: reports, isLoading } = useReports(workspaceId);

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

            return (
              <button
                key={report.id}
                onClick={() => router.push(`/workspace/${workspaceId}/${report.id}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="px-5 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {periodStart} ~ {periodEnd}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {typeLabel}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-300 shrink-0">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
