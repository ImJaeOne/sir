'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CompanyBadge, TickerBadge, KeywordBadge, SirBadge, SirLevelBadge, CountBadge, StatusBadge } from '@/components/ui/Badge';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { useSessions } from '@/hooks/crawl/useSessionQuery';
import { getRelativeTime } from '@/utils/date';
import { PLATFORMS, CATEGORY_LABELS } from '@/constants/platforms';
import type { CrawlSession } from '@/types/news';

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
  const { data: sessions, isLoading } = useSessions(workspaceId);

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
    <>
      <DashboardHeader />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* 워크스페이스 정보 */}
          {workspace && (
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <h1 className="text-xl font-bold text-slate-800">{workspace.name}</h1>
              <div className="flex items-center gap-1 flex-wrap">
                <CompanyBadge companyName={workspace.company_name} />
                <TickerBadge ticker={workspace.ticker} />
                {workspace.keywords.map((kw) => (
                  <KeywordBadge key={kw} keyword={kw} />
                ))}
              </div>
            </div>
          )}

          {/* 세션 리스트 (날짜별 그룹핑) */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700">수집 히스토리</h2>

            {isLoading && (
              <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>
            )}

            {!isLoading && groupedByDate.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-2">
                <span className="text-sm text-slate-400">수집된 데이터가 없습니다</span>
                <span className="text-xs text-slate-300">크롤링을 실행하면 여기에 표시됩니다</span>
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
                        const allStarts = group.sessions.map(s => s.period_start).filter(Boolean) as string[];
                        const allEnds = group.sessions.map(s => s.period_end).filter(Boolean) as string[];
                        const minStart = allStarts.length ? formatDateDisplay(allStarts.sort()[0]) : null;
                        const maxEnd = allEnds.length ? formatDateDisplay(allEnds.sort().reverse()[0]) : null;
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
                      const category = PLATFORMS.find(p => p.id === session.platform_id)?.category ?? 'unknown';
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
                              {catSessions[0].status === 'done' && <SirBadge score={catSessions[0].sir_score} />}
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
                                <CountBadge count={catSessions.reduce((sum, s) => sum + s.total_items, 0)} label="수집" />
                                <StatusBadge status={catSessions.every(s => s.status === 'done') ? 'done' : catSessions.some(s => s.status === 'failed') ? 'failed' : catSessions[0].status} />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {catSessions.every(s => s.status === 'done') && (() => {
                                  const scores = catSessions.map(s => s.sir_score).filter((s): s is number => s !== null);
                                  if (scores.length === 0) return null;
                                  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
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
                                  {session.status === 'done' && <SirBadge score={session.sir_score} />}
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
    </>
  );
}
