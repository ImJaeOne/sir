'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CompanyBadge, TickerBadge, KeywordBadge, SirBadge, SirLevelBadge, CountBadge, StatusBadge } from '@/components/ui/Badge';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { useSessions } from '@/hooks/crawl/useSessionQuery';
import { getRelativeTime } from '@/utils/date';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: sessions, isLoading } = useSessions(workspaceId);

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

          {/* 세션 리스트 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-700">수집 히스토리</h2>

            {isLoading && (
              <p className="text-sm text-slate-400 py-8 text-center">불러오는 중...</p>
            )}

            {!isLoading && (!sessions || sessions.length === 0) && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-12 flex flex-col items-center gap-2">
                <span className="text-sm text-slate-400">수집된 데이터가 없습니다</span>
                <span className="text-xs text-slate-300">크롤링을 실행하면 여기에 표시됩니다</span>
              </div>
            )}

            {sessions?.map((session, index) => {
              const sessionNumber = sessions.length - index;
              const period = session.period_start === session.period_end
                ? session.period_start
                : `${session.period_start} ~ ${session.period_end}`;
              const isDone = session.status === 'done';

              return (
                <button
                  key={session.id}
                  onClick={() => router.push(`/workspace/${workspaceId}/${session.id}`)}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 sm:px-6 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer text-left flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-700">
                      {sessionNumber}차 수집
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">{period}</span>
                      <SirBadge score={session.sir_score} />
                      <CountBadge count={session.total_items} label="수집" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isDone
                      ? <SirLevelBadge score={session.sir_score} />
                      : <StatusBadge status={session.status} />
                    }
                    <span className="text-xs text-slate-300">
                      {getRelativeTime(session.created_at)}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="text-slate-300"
                    >
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
