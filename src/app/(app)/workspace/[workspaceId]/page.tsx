'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  TickerBadge,
  SirBadge,
  SirLevelBadge,
  CountBadge,
  StatusBadge,
} from '@/components/ui/Badge';
import { useWorkspace, useWorkspaceProfile } from '@/hooks/workspace/useWorkspaceQuery';
import { useUpdateWorkspaceProfile } from '@/hooks/workspace/useWorkspaceMutation';
import { useSessions } from '@/hooks/crawl/useSessionQuery';
import { useTriggerPipeline } from '@/hooks/crawl/usePipelineMutation';
import { getRelativeTime } from '@/utils/date';
import { PLATFORMS, CATEGORY_LABELS } from '@/constants/platforms';
import type { CrawlSession } from '@/types/news';
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
  const [showStartAnalysis, setShowStartAnalysis] = useState(false);
  const [pipelineTriggered, setPipelineTriggered] = useState(false);
  const { data: sessions, isLoading } = useSessions(workspaceId, pipelineTriggered);

  // 파이프라인 트리거 후 세션이 나타나면 폴링 종료
  useEffect(() => {
    if (pipelineTriggered && sessions && sessions.length > 0) {
      setPipelineTriggered(false);
    }
  }, [pipelineTriggered, sessions]);

  // 날짜별 그룹핑
  const groupedByDate = useMemo<SessionGroup[]>(() => {
    if (!sessions) return [];
    const map = new Map<string, CrawlSession[]>();
    for (const session of sessions) {
      const key = toDateKey(session.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(session);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, sessions], index, arr) => ({
        dateKey,
        displayDate: formatDateDisplay(dateKey),
        sessions,
      }));
  }, [sessions]);

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

        {showStartAnalysis && (
          <StartAnalysisModal
            workspaceId={workspaceId}
            onClose={() => setShowStartAnalysis(false)}
            onTriggered={() => setPipelineTriggered(true)}
          />
        )}

        {/* 세션 리스트 (날짜별 그룹핑) */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-700">수집 히스토리</h2>

          {isLoading && <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>}

          {!isLoading && groupedByDate.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-3">
              {pipelineTriggered ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-slate-500">수집 준비 중...</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-400">아직 수집된 데이터가 없습니다</span>
                  <button
                    onClick={() => setShowStartAnalysis(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    분석 시작하기
                  </button>
                </>
              )}
            </div>
          )}

          {groupedByDate.map((group, groupIndex) => {
            const groupNumber = groupedByDate.length - groupIndex;
            return (
              <button
                key={group.dateKey}
                onClick={() => router.push(`/workspace/${workspaceId}/${group.dateKey}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all cursor-pointer text-left"
              >
                {/* 그룹 헤더 */}
                <div className="px-5 py-3 sm:px-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      {groupNumber}차 수집
                    </span>
                    {(() => {
                      const allStarts = group.sessions
                        .map((s) => s.period_start)
                        .filter(Boolean) as string[];
                      const allEnds = group.sessions
                        .map((s) => s.period_end)
                        .filter(Boolean) as string[];
                      const minStart = allStarts.length
                        ? formatDateDisplay(allStarts.sort()[0])
                        : null;
                      const maxEnd = allEnds.length
                        ? formatDateDisplay(allEnds.sort().reverse()[0])
                        : null;
                      if (!minStart) return null;
                      const period = minStart === maxEnd ? minStart : `${minStart} ~ ${maxEnd}`;
                      return <span className="text-xs text-slate-400">({period})</span>;
                    })()}
                  </div>
                  <span className="text-xs text-slate-400">
                    {getRelativeTime(group.sessions[0].created_at)}
                  </span>
                </div>

                {/* 카테고리별 그룹핑 */}
                {(() => {
                  const byCategory: Record<string, typeof group.sessions> = {};
                  for (const session of group.sessions) {
                    const category =
                      PLATFORMS.find((p) => p.id === session.platform_id)?.category ?? 'unknown';
                    if (!byCategory[category]) byCategory[category] = [];
                    byCategory[category].push(session);
                  }

                  return Object.entries(byCategory).map(([category, catSessions]) => (
                    <div key={category}>
                      {/* 카테고리 헤더 */}
                      {category === 'news' && catSessions.length === 1 ? (
                        // 뉴스: 카테고리명만
                        <div className="px-5 py-3 sm:px-6 flex items-center justify-between gap-3 border-b border-slate-50 last:border-b-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                              {CATEGORY_LABELS[category] ?? category}
                            </span>
                            <CountBadge count={catSessions[0].total_items} label="수집" />
                            <StatusBadge status={catSessions[0].status} />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {catSessions[0].status === 'done' && (
                              <SirBadge score={catSessions[0].sir_score} />
                            )}
                          </div>
                        </div>
                      ) : (
                        // 다중 플랫폼 (커뮤니티 등): 카테고리 + 하위 플랫폼
                        <>
                          <div className="px-5 py-3 sm:px-6 border-b border-slate-50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                                {CATEGORY_LABELS[category] ?? category}
                              </span>
                              <CountBadge
                                count={catSessions.reduce((sum, s) => sum + s.total_items, 0)}
                                label="수집"
                              />
                              <StatusBadge
                                status={
                                  catSessions.every((s) => s.status === 'done')
                                    ? 'done'
                                    : catSessions.some((s) => s.status === 'failed')
                                      ? 'failed'
                                      : catSessions[0].status
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {catSessions.every((s) => s.status === 'done') &&
                                (() => {
                                  const scores = catSessions
                                    .map((s) => s.sir_score)
                                    .filter((s): s is number => s !== null);
                                  if (scores.length === 0) return null;
                                  const avg =
                                    Math.round(
                                      (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
                                    ) / 10;
                                  return <SirBadge score={avg} />;
                                })()}
                            </div>
                          </div>
                          {catSessions.map((session) => (
                            <div
                              key={session.id}
                              className="px-5 py-2.5 sm:px-6 pl-8 sm:pl-10 flex items-center justify-between gap-3 border-b border-slate-50 last:border-b-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  {getPlatformLabel(session.platform_id)}
                                </span>
                                <CountBadge count={session.total_items} label="수집" />
                                <StatusBadge status={session.status} />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {session.status === 'done' && (
                                  <SirBadge score={session.sir_score} />
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ));
                })()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
