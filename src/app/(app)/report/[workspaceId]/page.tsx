'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useWorkspaceSir, useWeeklySummary, useSirStockData, useSirRanking,
  useChannelItems, useChannelStats, useNewsClusters, useRiskItems, useStrategies,
  useSearchTrend,
} from '@/hooks/report/useReportQuery';
import { SectionHighlight } from '@/components/report/SectionHighlight';
import { SectionReputation } from '@/components/report/SectionReputation';
import { SectionSentimentDetail } from '@/components/report/SectionSentimentDetail';
import { SectionTopContent } from '@/components/report/SectionTopContent';
import { SectionRiskContent } from '@/components/report/SectionRiskContent';
import { SectionStrategy } from '@/components/report/SectionStrategy';

export default function ReportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [downloading, setDownloading] = useState(false);

  // 기초 쿼리 (네트워크 요청)
  const { data: workspace, isLoading: wsLoading } = useWorkspaceSir(workspaceId);
  const { data: summary } = useWeeklySummary(workspaceId);
  const { data: sirStockData } = useSirStockData(workspaceId);
  const { data: sirRanking } = useSirRanking(workspaceId);
  const { data: channelItems, isLoading: itemsLoading } = useChannelItems(workspaceId);
  const { data: newsClusters } = useNewsClusters(workspaceId);
  const { data: riskItems } = useRiskItems(workspaceId);
  const { data: strategies } = useStrategies(workspaceId);
  const { data: searchTrend } = useSearchTrend(workspaceId);

  // 파생 쿼리 — channelItems 캐시에서 stats 계산
  const { data: channelStats } = useChannelStats(workspaceId, channelItems);

  const sirScore = workspace?.sir_score ?? null;
  const totalItems = channelItems?.length ?? 0;
  const riskCount = riskItems?.length ?? 0;

  const loadingSteps = [
    { loading: wsLoading, label: '워크스페이스 접근 중...' },
    { loading: !channelItems && !itemsLoading === false, label: '세션 접근 중...' },
    { loading: itemsLoading, label: '데이터 준비 중...' },
    { loading: !channelStats, label: '보고서 준비 중...' },
  ];
  const currentStep = loadingSteps.find(s => s.loading);

  if (currentStep) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-49px)] gap-3">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400">{currentStep.label}</p>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/report/${workspaceId}/pdf`);
      if (!res.ok) throw new Error('PDF 생성 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${workspaceId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{workspace?.company_name ?? ''} ({workspace?.ticker ?? ''})</h1>
            <p className="text-sm text-slate-400 mt-1">
              분석 기간: 2026.02.24 ~ 2026.03.25 &nbsp;·&nbsp; 보고서 생성 기준일 2026.03.27 / 09:00
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
        </div>

        <SectionHighlight
          sirScore={sirScore}
          totalItems={totalItems}
          riskCount={riskCount}
          summary={summary ?? []}
          sirStockData={sirStockData ?? []}
          sirRanking={sirRanking}
          companyName={workspace?.company_name ?? ''}
        />

        <div className="print-break">
          <SectionReputation naverTrend={searchTrend?.naver ?? []} googleTrend={searchTrend?.google ?? []} channelStats={channelStats ?? []} />
        </div>

        <div className="print-break">
          <SectionSentimentDetail channelStats={channelStats ?? []} channelItems={channelItems ?? []} newsClusters={newsClusters ?? []} />
        </div>

        <div className="print-break">
          <SectionTopContent channelItems={channelItems ?? []} newsClusters={newsClusters ?? []} />
        </div>

        <div className="print-break">
          <SectionRiskContent riskItems={riskItems ?? []} />
        </div>

        <div className="print-break">
          <SectionStrategy strategies={strategies ?? []} />
        </div>
      </div>
    </div>
  );
}
