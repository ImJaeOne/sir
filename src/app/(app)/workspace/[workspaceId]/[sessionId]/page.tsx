'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AnalysisResult } from '@/components/pipeline/AnalysisResult';
import { ContentResult } from '@/components/pipeline/ContentResult';
import { StockSirChart } from '@/components/pipeline/StockSirChart';
import { useCrawlData } from '@/hooks/crawl/useCrawlData';
import { useSession } from '@/hooks/crawl/useSessionQuery';
import { useStockPrices } from '@/hooks/crawl/useStockQuery';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { Database, Radio, TrendingUp } from 'lucide-react';
import { CompanyBadge, TickerBadge } from '@/components/ui/Badge';
import { calculateSir } from '@/utils/sir';

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

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: session, isError: isSessionError } = useSession(sessionId);
  const { data: crawlData, isLoading, isError: isCrawlError } = useCrawlData(sessionId);
  const { data: stockPrices } = useStockPrices(workspaceId);

  const sessionStatus = session?.status ?? 'crawling';
  const hasAnalysis = sessionStatus === 'done' || sessionStatus === 'clustering';
  const hasStrategy = !!crawlData?.strategy;

  const standaloneItems = useMemo(
    () => crawlData?.crawlItems?.filter((item) => !item.cluster_id) ?? [],
    [crawlData]
  );

  // 통계 계산
  const stats = useMemo(() => {
    if (!crawlData) return null;

    const items = crawlData.crawlItems;
    const totalItems = items.length;
    const channels = new Set(items.map((i) => i.platform_id).filter(Boolean));
    const channelCount = channels.size;
    const sirScore = calculateSir(items);

    return { totalItems, channelCount, sirScore };
  }, [crawlData]);

  const goBack = () => router.push(`/workspace/${workspaceId}`);

  if (isLoading) {
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

  if (isSessionError || isCrawlError) {
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

  if (!hasAnalysis) {
    return (
      <>
        <DashboardHeader />
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {workspace && <SessionHeader workspace={workspace} onBack={goBack} />}
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-sm text-slate-500">아직 분석이 진행되지 않았습니다</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all cursor-pointer">
                분석 시작하기
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

          {/* 요약 카드 */}
          {stats && (
            <StatCards
              totalItems={stats.totalItems}
              channelCount={stats.channelCount}
              sirScore={stats.sirScore}
            />
          )}

          {/* 주가 & SIR 차트 */}
          {stockPrices && stockPrices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <StockSirChart
                stockPrices={stockPrices}
                crawlItems={crawlData?.crawlItems ?? []}
              />
            </div>
          )}

          {/* 분석 결과 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <AnalysisResult
              clusters={crawlData?.clusters ?? []}
              standaloneItems={standaloneItems}
              crawlItems={crawlData?.crawlItems ?? []}
            />
          </div>

          {/* 대응 전략 */}
          {hasStrategy && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <ContentResult strategy={crawlData?.strategy ?? null} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
