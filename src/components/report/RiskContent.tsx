'use client';

import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRiskItems, useRiskReports, usePrevReport } from '@/hooks/report/useReportQuery';
import { deleteRiskReport } from '@/lib/api/reportApi';
import { reportKeys } from '@/hooks/report/useReportQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { RiskDetectionTable } from '@/components/report/risk-content/RiskDetectionTable';
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

  const { reportedSourceIds, riskReportBySourceId } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, string>();
    for (const rr of riskReports ?? []) {
      ids.add(rr.source_id);
      map.set(rr.source_id, rr.id);
    }
    return { reportedSourceIds: ids, riskReportBySourceId: map };
  }, [riskReports]);

  const handleCancelReport = useCallback(
    async (riskReportId: string) => {
      try {
        await deleteRiskReport(riskReportId);
        queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(workspaceId, reportId) });
        toast.success('신고가 취소되었습니다.');
      } catch {
        toast.error('신고 대행 취소에 실패했습니다.');
      }
    },
    [workspaceId, reportId, queryClient],
  );

  return (
    <div className="print-break">
      <ReportSection id="section-risk" icon={<LiskContentIcon size={36} />} title="리스크 콘텐츠 관리">
        <RiskDetectionTable
          riskItems={riskItems ?? []}
          workspaceId={workspaceId}
          reportId={reportId}
          reportedSourceIds={reportedSourceIds}
          riskReportBySourceId={riskReportBySourceId}
          onCancelReport={handleCancelReport}
        />
        {prevReport && <RiskResultTable workspaceId={workspaceId} prevReportId={prevReport.id} />}
      </ReportSection>
    </div>
  );
}
