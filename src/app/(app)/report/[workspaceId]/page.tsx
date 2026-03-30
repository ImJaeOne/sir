'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSearchTrend } from '@/hooks/useSearchTrend';
import { useReportHighlight } from '@/hooks/useReportData';
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
  const { data: naverTrend } = useSearchTrend(workspaceId, 30, '2026-03-26');
  const { data: highlight } = useReportHighlight(workspaceId);

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
            <h1 className="text-xl font-bold text-slate-800">DN오토모티브 (A007340)</h1>
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

        {/* P1. 주간 하이라이트 */}
        <SectionHighlight sirScore={highlight.sirScore} totalItems={highlight.totalItems} riskCount={highlight.riskCount} summary={highlight.summary} />

        {/* P2. 온라인 평판 종합 — 검색 추이, 수집량, SIR 지수 */}
        <div className="print-break">
          <SectionReputation naverTrend={naverTrend} />
        </div>

        {/* P3. 온라인 평판 종합 — 감성 분석 상세 */}
        <div className="print-break">
          <SectionSentimentDetail />
        </div>

        {/* P4. 채널별 상위 콘텐츠 */}
        <div className="print-break">
          <SectionTopContent />
        </div>

        {/* P5. 리스크 콘텐츠 관리 */}
        <div className="print-break">
          <SectionRiskContent />
        </div>

        {/* P6. 대응 전략 제안 */}
        <div className="print-break">
          <SectionStrategy />
        </div>
      </div>
    </div>
  );
}
