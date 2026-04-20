'use client';

import { ReportSubSection } from '@/components/report/ReportSection';
import { ReportCard } from '@/components/report/ReportCard';
import { RiskTable } from '@/components/report/risk-content/RiskTable';
import type { RiskItem } from '@/lib/api/reportApi';

interface RiskDetectionTableProps {
  riskItems: RiskItem[];
  workspaceId: string;
  reportId: string;
  reportedSourceIds: Set<string>;
  riskReportBySourceId: Map<string, string>;
  onCancelReport: (riskReportId: string) => void;
  editable?: boolean;
}

export function RiskDetectionTable({
  riskItems,
  workspaceId,
  reportId,
  reportedSourceIds,
  riskReportBySourceId,
  onCancelReport,
  editable = false,
}: RiskDetectionTableProps) {
  return (
    <ReportSubSection
      title="리스크 콘텐츠 탐지 내역"
      description="부정적 게시물 중 위험 수위가 높은 게시물을 AI가 분류한 것으로 고객 확인을 거쳐 신고 및 게시물 삭제 등의 후속조치 여부 결정이 필요합니다."
      tooltip="뉴스는 공공성을 고려해 수집 대상에서 제외됩니다."
    >
      <ReportCard px={20} py={10}>
        <RiskTable
          riskItems={riskItems}
          workspaceId={workspaceId}
          reportId={reportId}
          reportedSourceIds={reportedSourceIds}
          riskReportBySourceId={riskReportBySourceId}
          onCancelReport={onCancelReport}
          editable={editable}
        />
      </ReportCard>
    </ReportSubSection>
  );
}
