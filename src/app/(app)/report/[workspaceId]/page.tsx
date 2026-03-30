'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useWorkspaceSir, useWeeklySummary, useSirStockData, useSirRanking,
  useChannelItems, useChannelStats, useRiskItems, useStrategies,
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
  const { data: workspace } = useWorkspaceSir(workspaceId);           // workspace 캐시 재사용
  const { data: summary } = useWeeklySummary(workspaceId);            // summary만 1건
  const { data: sirStockData } = useSirStockData(workspaceId);        // daily_snapshots + stock_prices
  const { data: sirRanking } = useSirRanking(workspaceId);            // 전체 워크스페이스 SIR
  const { data: channelItems } = useChannelItems(workspaceId);        // 핵심: 모든 아이템 1번 fetch
  const { data: riskItems } = useRiskItems(workspaceId);              // critical_type not null
  const { data: strategies } = useStrategies(workspaceId);            // 전략
  // TODO: const { data: naverTrend } = useSearchTrend(workspaceId, 30, '2026-03-26');

  // 파생 쿼리 — channelItems 캐시에서 stats 계산 (추가 네트워크 요청 최소화)
  const { data: channelStats } = useChannelStats(workspaceId, channelItems);

  // highlight 데이터 — 캐시에서 조합
  const sirScore = workspace?.sir_score ?? null;
  const totalItems = channelItems?.length ?? 0;
  const riskCount = riskItems?.length ?? 0;

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
          <SectionReputation naverTrend={[]} channelStats={channelStats ?? []} />
        </div>

        <div className="print-break">
          <SectionSentimentDetail channelStats={channelStats ?? []} channelItems={channelItems ?? []} />
        </div>

        <div className="print-break">
          <SectionTopContent channelItems={channelItems ?? []} />
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
