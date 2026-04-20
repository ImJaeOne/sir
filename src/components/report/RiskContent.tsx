'use client';

import { useMemo } from 'react';
import { useRiskItems, useRiskReports, useReportInfo } from '@/hooks/report/useReportQuery';
import { useDeleteRiskReport } from '@/hooks/report/useReportMutation';
import { ReportSection } from '@/components/report/ReportSection';
import { RiskDetectionTable } from '@/components/report/risk-content/RiskDetectionTable';
import { RiskResultTable } from '@/components/report/risk-content/RiskResultTable';
import { LiskContentIcon } from '@/components/icons/LiskContentIcon';

interface RiskContentProps {
  workspaceId: string;
  reportId: string;
  editable?: boolean;
}

export function RiskContent({ workspaceId, reportId, editable = false }: RiskContentProps) {
  const { data: report } = useReportInfo(reportId);
  const { data: riskItems } = useRiskItems(workspaceId, reportId);
  const { data: riskReports } = useRiskReports(workspaceId, reportId);
  const deleteMutation = useDeleteRiskReport(workspaceId, reportId);

  const { reportedSourceIds, riskReportBySourceId } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, string>();
    for (const rr of riskReports ?? []) {
      ids.add(rr.source_id);
      map.set(rr.source_id, rr.id);
    }
    return { reportedSourceIds: ids, riskReportBySourceId: map };
  }, [riskReports]);

  const isDaily = report?.type === 'daily';

  return (
    <div className="print-break">
      <ReportSection id="section-risk" icon={<LiskContentIcon size={36} />} title="리스크 콘텐츠 관리">
        <RiskDetectionTable
          riskItems={riskItems ?? []}
          workspaceId={workspaceId}
          reportId={reportId}
          reportedSourceIds={reportedSourceIds}
          riskReportBySourceId={riskReportBySourceId}
          onCancelReport={deleteMutation.mutate}
          editable={editable}
        />
        {report?.period_start && report?.period_end && (
          <RiskResultTable
            workspaceId={workspaceId}
            periodStart={report.period_start}
            periodEnd={report.period_end}
            isDaily={isDaily}
          />
        )}
      </ReportSection>
    </div>
  );
}
