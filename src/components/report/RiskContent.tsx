'use client';

import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRiskItems, useRiskReports, usePrevReport } from '@/hooks/report/useReportQuery';
import { deleteRiskReport } from '@/lib/api/reportApi';
import { reportKeys } from '@/hooks/report/useReportQuery';
import { ReportSection, ReportSubSection } from '@/components/report/ReportSection';
import { ReportCard } from '@/components/report/ReportCard';
import { RiskTable } from '@/components/report/risk-content/RiskTable';
import { RiskResultTable } from '@/components/report/risk-content/RiskResultTable';
import { LiskContentIcon } from '@/components/icons/LiskContentIcon';

interface RiskContentProps {
  workspaceId: string;
  reportId: string;
}

export function RiskContent({ workspaceId, reportId }: RiskContentProps) {
  const { data: riskItems } = useRiskItems(workspaceId, reportId);
  const { data: riskReports } = useRiskReports(workspaceId, reportId);
  const { data: prevReport } = usePrevReport(workspaceId, reportId);
  const queryClient = useQueryClient();

  // 현재 report에서 신고된 source_id set + source_id → risk_report_id 맵
  const { reportedSourceIds, riskReportBySourceId } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, string>();
    for (const rr of riskReports ?? []) {
      ids.add(rr.source_id);
      map.set(rr.source_id, rr.id);
    }
    return { reportedSourceIds: ids, riskReportBySourceId: map };
  }, [riskReports]);

  const handleCancelReport = useCallback(async (riskReportId: string) => {
    try {
      await deleteRiskReport(riskReportId);
      queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(workspaceId, reportId) });
      toast.success('신고가 취소되었습니다.');
    } catch {
      toast.error('신고 취소에 실패했습니다.');
    }
  }, [workspaceId, reportId, queryClient]);

  return (
    <div className="print-break">
      <ReportSection
        id="section-risk"
        icon={<LiskContentIcon size={36} />}
        title="리스크 콘텐츠 관리"
      >
        <ReportSubSection
          title="리스크 콘텐츠 탐지 내역"
          description="부정적 게시물 중 위험 수위가 높은 게시물을 AI가 분류한 것으로 고객 확인을 거쳐 신고 및 게시물 삭제 등의 후속조치 여부 결정이 필요합니다."
          tooltip={
            '신고된 게시물은 해당 채널 운영자의 판단에 의해 삭제되지 않을 수 있으며, 신고 후 2주가 지나도 삭제되지 않을 경우 자동으로 반려된 것으로 간주합니다.'
          }
        >
          <ReportCard px={20} py={10}>
            <RiskTable
              riskItems={riskItems ?? []}
              workspaceId={workspaceId}
              reportId={reportId}
              reportedSourceIds={reportedSourceIds}
              riskReportBySourceId={riskReportBySourceId}
              onCancelReport={handleCancelReport}
            />
          </ReportCard>
        </ReportSubSection>

        {prevReport && (
          <RiskResultTable workspaceId={workspaceId} prevReportId={prevReport.id} />
        )}
      </ReportSection>
    </div>
  );
}
