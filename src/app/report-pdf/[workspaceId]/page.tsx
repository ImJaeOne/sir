'use client';

import { useParams } from 'next/navigation';
import { useSearchTrend } from '@/hooks/useSearchTrend';
import { SectionHighlight } from '@/components/report/SectionHighlight';
import { SectionReputation } from '@/components/report/SectionReputation';
import { SectionSentimentDetail } from '@/components/report/SectionSentimentDetail';
import { SectionTopContent } from '@/components/report/SectionTopContent';
import { SectionRiskContent } from '@/components/report/SectionRiskContent';
import { SectionStrategy } from '@/components/report/SectionStrategy';

function PageHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-800">DN오토모티브 (A007340)</h1>
      <p className="text-sm text-slate-400 mt-1">
        분석 기간: 2026.02.24 ~ 2026.03.25 &nbsp;·&nbsp; 보고서 생성 기준일 2026.03.27 / 09:00
      </p>
    </div>
  );
}

export default function ReportPdfPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { data: naverTrend } = useSearchTrend(workspaceId, 30, '2026-03-26');

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* P1. 주간 하이라이트 */}
        <div>
          <PageHeader />
          <SectionHighlight pdfMode />
        </div>

        {/* P2. 온라인 평판 종합 */}
        <div className="print-break">
          <PageHeader />
          <SectionReputation pdfMode naverTrend={naverTrend} />
        </div>

        {/* P3. 감성 분석 상세 */}
        <div className="print-break">
          <PageHeader />
          <SectionSentimentDetail pdfMode />
        </div>

        {/* P4. 채널별 상위 콘텐츠 */}
        <div className="print-break">
          <PageHeader />
          <SectionTopContent />
        </div>

        {/* P5. 리스크 콘텐츠 관리 */}
        <div className="print-break">
          <PageHeader />
          <SectionRiskContent />
        </div>

        {/* P6. 대응 전략 제안 */}
        <div className="print-break">
          <PageHeader />
          <SectionStrategy />
        </div>
      </div>
    </div>
  );
}
