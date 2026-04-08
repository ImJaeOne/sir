'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  useWorkspaceSir,
  useWeeklySummary,
  useSirStockData,
  useSirRanking,
  useChannelItems,
  useChannelStats,
  useNewsClusters,
  useRiskItems,
  useStrategies,
  useSearchTrend,
  usePrevReport,
} from '@/hooks/report/useReportQuery';
import { Highlight } from '@/components/report/Highlight';
import { OnlineReputation } from '@/components/report/OnlineReputation';
import { TopContent } from '@/components/report/TopContent';
import { RiskContent } from '@/components/report/RiskContent';
import { SectionStrategy } from '@/components/report/SectionStrategy';

export default function ReportPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const reportId = params?.reportId as string;
  const [downloading, setDownloading] = useState(false);

  // 리포트 정보
  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('reports').select('type').eq('id', reportId).single();
      return data;
    },
    enabled: !!reportId,
  });
  const isInitial = report?.type === 'initial';

  // 기초 쿼리 (네트워크 요청)
  const { data: workspace, isLoading: wsLoading } = useWorkspaceSir(workspaceId);
  const { data: summary } = useWeeklySummary(workspaceId);
  const { data: sirStockData } = useSirStockData(workspaceId);
  const { data: sirRanking } = useSirRanking(workspaceId);
  const { data: channelItems, isLoading: itemsLoading } = useChannelItems(workspaceId);
  const { data: newsClusters } = useNewsClusters(workspaceId);
  const { data: riskItems } = useRiskItems(workspaceId);
  const { data: strategies } = useStrategies(workspaceId);
  const { data: searchTrend } = useSearchTrend(workspaceId, reportId);
  const { data: prevReport } = usePrevReport(workspaceId, reportId);

  // 파생 쿼리 — channelItems 캐시에서 stats 계산
  const { data: channelStats } = useChannelStats(workspaceId, channelItems);

  const sirScore = workspace?.sir_score ?? null;
  const totalItems = channelItems?.length ?? 0;
  const riskCount = riskItems?.length ?? 0;

  // 이전 리포트 대비 변화량 (첫 보고서: SIR 500 기준, 나머지 0 기준)
  const snapshotDiff = (() => {
    const currScore = sirScore ?? 0;
    const getTierIdx = (s: number) => Math.min(Math.floor(s / 100), 9);

    if (!prevReport) {
      // 첫 보고서 — SIR은 500 기준, 나머지는 0 기준
      return {
        scoreDiff: Math.round(currScore - 500),
        tierDiff: getTierIdx(currScore) - getTierIdx(500),
        itemsDiff: totalItems,
        riskDiff: riskCount,
      };
    }

    const prevDate = prevReport.createdAt;
    const currItems = (channelItems ?? []).filter(
      (i) => i.published_at && i.published_at >= prevDate
    ).length;
    const prevItems = (channelItems ?? []).filter(
      (i) => i.published_at && i.published_at < prevDate
    ).length;
    const currRisk = (riskItems ?? []).filter(
      (i) => i.published_at && i.published_at >= prevDate
    ).length;
    const prevRisk = (riskItems ?? []).filter(
      (i) => i.published_at && i.published_at < prevDate
    ).length;

    return {
      scoreDiff: Math.round(currScore - prevReport.sirScore),
      tierDiff: getTierIdx(currScore) - getTierIdx(prevReport.sirScore),
      itemsDiff: currItems - prevItems,
      riskDiff: currRisk - prevRisk,
    };
  })();

  const highlightProps = useMemo(
    () => ({
      sirScore,
      totalItems,
      riskCount,
      summary: summary ?? [],
      sirStockData: sirStockData ?? [],
      sirRanking,
      companyName: workspace?.company_name ?? '',
      isInitial,
      snapshotDiff,
    }),
    [
      sirScore,
      totalItems,
      riskCount,
      summary,
      sirStockData,
      sirRanking,
      workspace?.company_name,
      isInitial,
      snapshotDiff,
    ]
  );

  const onlineReputationProps = useMemo(
    () => ({
      naverTrend: searchTrend?.naver ?? [],
      googleTrend: searchTrend?.google ?? [],
      channelStats: channelStats ?? [],
      channelItems: channelItems ?? [],
      newsClusters: newsClusters ?? [],
      isInitial,
    }),
    [searchTrend, channelStats, channelItems, newsClusters, isInitial]
  );

  const topContentProps = useMemo(
    () => ({
      channelItems: channelItems ?? [],
      newsClusters: newsClusters ?? [],
    }),
    [channelItems, newsClusters]
  );

  const riskItemProps = useMemo(
    () => ({ riskItems: riskItems ?? [] }),
    [riskItems],
  );

  const loadingSteps = [
    { loading: wsLoading, label: '워크스페이스 접근 중...' },
    { loading: !channelItems && !itemsLoading === false, label: '세션 접근 중...' },
    { loading: itemsLoading, label: '데이터 준비 중...' },
    { loading: !channelStats, label: '보고서 준비 중...' },
  ];
  const currentStep = loadingSteps.find((s) => s.loading);

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
    <div className="px-10 py-10 bg-bg-light">
      <div className="mx-auto w-[1200px] flex flex-col gap-10">
        {/* 헤더 */}
        <div className="flex flex-col gap-4">
          <div className="w-full flex justify-between items-center">
            <p className="text-base text-text-muted font-bold">SIR Weekly Report</p>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="text-base font-bold text-text-muted bg-bg-gray-button hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-[10px] transition-colors cursor-pointer shrink-0"
            >
              {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
            </button>
          </div>
          <div className="flex items-center justify-between bg-bg-dark px-10 py-8 rounded-xl">
            <h1 className="flex items-center gap-3 font-bold">
              <span className="text-white text-[36px]">{workspace?.company_name ?? ''}</span>
              <span className="text-text-muted text-[22px]">({workspace?.ticker ?? ''})</span>
            </h1>
            <div className="flex flex-col gap-2 text-sm">
              <p className="test-sm flex gap-22">
                <span className="text-white font-bold">분석 기간</span>
                <span className="text-text-muted">2026.02.24 ~ 2026.03.25</span>
              </p>
              <p className="text-sm flex gap-9">
                <span className="text-white font-bold">보고서 생성 기준일</span>
                <span className="text-text-muted">2026.03.27 09:00</span>
              </p>
            </div>
          </div>
        </div>
        <Highlight {...highlightProps} />
        <OnlineReputation {...onlineReputationProps} />
        <TopContent {...topContentProps} />
        <RiskContent {...riskItemProps} />

        <div className="print-break">
          <SectionStrategy strategies={strategies ?? []} />
        </div>
      </div>
    </div>
  );
}
