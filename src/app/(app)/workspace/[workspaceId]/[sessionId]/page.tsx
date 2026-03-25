'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AnalysisResult } from '@/components/pipeline/AnalysisResult';
import { ContentResult } from '@/components/pipeline/ContentResult';
import { StockSirChart } from '@/components/pipeline/StockSirChart';
import { useCrawlDataMulti } from '@/hooks/crawl/useCrawlData';
import { useSessionsByDate, useSession } from '@/hooks/crawl/useSessionQuery';
import { useStockPrices } from '@/hooks/crawl/useStockQuery';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { Database, Radio, TrendingUp } from 'lucide-react';
import { CompanyBadge, TickerBadge, StatusBadge } from '@/components/ui/Badge';
import { PLATFORMS } from '@/constants/platforms';
import { calculateSir } from '@/utils/sir';

const isDateKey = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function getPlatformLabel(platformId: string | null): string {
  if (!platformId) return '기타';
  return PLATFORMS.find((p) => p.id === platformId)?.label ?? platformId;
}

function SessionHeader({
  workspace,
  onBack,
}: {
  workspace: { name: string; company_name: string; ticker: string };
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
      <button
        onClick={onBack}
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 4l-6 6 6 6" />
        </svg>
      </button>
      <h1 className="text-xl font-bold text-slate-800">{workspace.name}</h1>
      <div className="flex items-center gap-1">
        <CompanyBadge companyName={workspace.company_name} />
        <TickerBadge ticker={workspace.ticker} />
      </div>
    </div>
  );
}

function StatCards({
  totalItems,
  channelCount,
  sirScore,
}: {
  totalItems: number;
  channelCount: number;
  sirScore: number;
}) {
  const sirColor = sirScore >= 70 ? 'text-emerald-600' : sirScore >= 50 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 shadow-sm">
        <Database size={20} className="text-violet-500" />
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">{totalItems}</span>
          <span className="text-xs text-slate-400">건</span>
        </div>
        <span className="text-xs text-slate-500">수집 데이터</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 shadow-sm">
        <Radio size={20} className="text-emerald-500" />
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">{channelCount}</span>
          <span className="text-xs text-slate-400">개</span>
        </div>
        <span className="text-xs text-slate-500">모니터링 채널</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 shadow-sm">
        <TrendingUp size={20} className={sirScore >= 70 ? 'text-emerald-500' : sirScore >= 50 ? 'text-amber-500' : 'text-red-500'} />
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${sirColor}`}>{sirScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
        <span className="text-xs text-slate-500">SIR 지수</span>
      </div>
    </div>
  );
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string;
  const sessionId = params?.sessionId as string;

  const isDate = isDateKey(sessionId);

  const { data: workspace } = useWorkspace(workspaceId);

  // 날짜 기반: 해당 날짜 세션 전부 조회 / UUID: 단일 세션
  const { data: dateSessions } = useSessionsByDate(
    isDate ? workspaceId : '', isDate ? sessionId : ''
  );
  const { data: singleSession } = useSession(!isDate ? sessionId : '');

  const sessions = isDate ? dateSessions : (singleSession ? [singleSession] : []);
  const sessionIds = sessions?.map((s) => s.id) ?? [];

  const { data: crawlData, isLoading, isError } = useCrawlDataMulti(sessionIds);
  const { data: stockPrices } = useStockPrices(workspaceId);

  const allDone = sessions?.every((s) => s.status === 'done') ?? false;
  const hasAnalysis = sessions?.some((s) => s.status === 'done' || s.status === 'clustering') ?? false;
  const hasStrategy = (crawlData?.strategies?.length ?? 0) > 0;

  const standaloneItems = useMemo(
    () => crawlData?.newsItems?.filter((item) => !item.cluster_id) ?? [],
    [crawlData]
  );

  const stats = useMemo(() => {
    if (!crawlData) return null;

    const newsCount = crawlData.newsItems.length;
    const communityCount = crawlData.communityItems.length;
    const snsCount = crawlData.snsItems.length;
    const totalItems = newsCount + communityCount + snsCount;

    // SIR 계산용: 뉴스 + 커뮤니티 + SNS 통합
    const allSirItems = [
      ...crawlData.newsItems.map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
      ...crawlData.communityItems.map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
      ...crawlData.snsItems.map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
    ];
    const channels = new Set(allSirItems.map(i => i.platform_id).filter(Boolean));
    const channelCount = channels.size;
    const sirScore = calculateSir(allSirItems);

    return { totalItems, newsCount, communityCount, snsCount, channelCount, sirScore };
  }, [crawlData]);

  const goBack = () => router.push(`/workspace/${workspaceId}`);

  if (isLoading || (!sessions || sessions.length === 0)) {
    return (
      <>
        <DashboardHeader />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="47 16" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-slate-500">데이터 불러오는 중...</span>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <DashboardHeader />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {workspace && <SessionHeader workspace={workspace} onBack={goBack} />}
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-red-500">데이터를 불러오는 중 오류가 발생했습니다</p>
              <button
                onClick={goBack}
                className="border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                돌아가기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {workspace && <SessionHeader workspace={workspace} onBack={goBack} />}

          {/* 세션 상태 요약 */}
          {sessions && sessions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">{getPlatformLabel(s.platform_id)}</span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}

          {/* 요약 카드 */}
          {stats && hasAnalysis && (
            <StatCards
              totalItems={stats.totalItems}
              channelCount={stats.channelCount}
              sirScore={stats.sirScore}
            />
          )}

          {/* 주가 & SIR 차트 */}
          {stockPrices && stockPrices.length > 0 && hasAnalysis && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <StockSirChart
                stockPrices={stockPrices}
                crawlItems={[
                  ...(crawlData?.newsItems ?? []).map(i => ({
                    platform_id: i.platform_id,
                    sentiment: i.sentiment,
                    published_at: i.published_at,
                  })),
                  ...(crawlData?.communityItems ?? []).map(i => ({
                    platform_id: i.platform_id,
                    sentiment: i.sentiment,
                    published_at: i.published_at ? i.published_at.replace(/\./g, '-').split(' ')[0] : null,
                  })),
                  ...(crawlData?.snsItems ?? []).map(i => ({
                    platform_id: i.platform_id,
                    sentiment: i.sentiment,
                    published_at: i.published_at,
                  })),
                ]}
              />
            </div>
          )}

          {/* 분석 결과 */}
          {hasAnalysis && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <AnalysisResult
                clusters={crawlData?.clusters ?? []}
                standaloneItems={standaloneItems}
                crawlItems={crawlData?.newsItems ?? []}
                communityItems={crawlData?.communityItems ?? []}
                snsItems={crawlData?.snsItems ?? []}
              />
            </div>
          )}

          {/* 대응 전략 */}
          {hasStrategy && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <ContentResult strategy={crawlData?.strategies?.[0] ?? null} />
            </div>
          )}

          {/* 분석 미완료 */}
          {!hasAnalysis && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-slate-500">아직 분석이 진행되지 않았습니다</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
