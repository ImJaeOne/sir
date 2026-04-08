'use client';

import { useParams } from 'next/navigation';
import {
  useWorkspaceSir, useWeeklySummary, useSirStockData, useSirRanking,
  useChannelItems, useChannelStats, useNewsClusters, useRiskItems, useStrategies,
} from '@/hooks/report/useReportQuery';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { SectionStrategy } from '@/components/report/SectionStrategy';

function PageHeader({ companyName, ticker }: { companyName: string; ticker: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-800">{companyName} ({ticker})</h1>
      <p className="text-sm text-slate-400 mt-1">
        분석 기간: 2026.02.24 ~ 2026.03.25 &nbsp;·&nbsp; 보고서 생성 기준일 2026.03.27 / 09:00
      </p>
    </div>
  );
}

export default function ReportPdfPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace } = useWorkspaceSir(workspaceId);
  const { data: summary } = useWeeklySummary(workspaceId);
  const { data: sirStockData } = useSirStockData(workspaceId);
  const { data: sirRanking } = useSirRanking(workspaceId);
  const { data: channelItems } = useChannelItems(workspaceId);
  const { data: newsClusters } = useNewsClusters(workspaceId);
  const { data: riskItems } = useRiskItems(workspaceId);
  const { data: strategies } = useStrategies(workspaceId);
  const { data: channelStats } = useChannelStats(workspaceId, channelItems);

  const companyName = workspace?.company_name ?? '';
  const ticker = workspace?.ticker ?? '';

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div>
          <PageHeader companyName={companyName} ticker={ticker} />
          <Highlight pdfMode sirScore={workspace?.sir_score} totalItems={channelItems?.length} riskCount={riskItems?.length} summary={summary ?? []} sirStockData={sirStockData ?? []} sirRanking={sirRanking} companyName={companyName} />
        </div>
        <div className="print-break">
          <PageHeader companyName={companyName} ticker={ticker} />
          <OnlineReputation pdfMode naverTrend={[]} googleTrend={[]} channelStats={channelStats ?? []} channelItems={channelItems ?? []} newsClusters={newsClusters ?? []} />
        </div>
        <div className="print-break">
          <PageHeader companyName={companyName} ticker={ticker} />
          <TopContent channelItems={channelItems ?? []} newsClusters={newsClusters ?? []} />
        </div>
        <div className="print-break">
          <PageHeader companyName={companyName} ticker={ticker} />
          <RiskContent riskItems={riskItems ?? []} />
        </div>
        <div className="print-break">
          <PageHeader companyName={companyName} ticker={ticker} />
          <SectionStrategy strategies={strategies ?? []} />
        </div>
      </div>
    </div>
  );
}
