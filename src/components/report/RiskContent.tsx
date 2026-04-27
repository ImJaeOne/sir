'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert } from 'lucide-react';
import { useRiskItemsSuspense, useRiskReportsSuspense, useReportInfoSuspense } from '@/hooks/report/useReportQuery';
import { useDeleteRiskReport } from '@/hooks/report/useReportMutation';
import { useWorkspaceSubscription } from '@/hooks/workspace/useWorkspaceQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { ReportCard } from '@/components/report/ReportCard';
import { Button } from '@/components/ui/Button';
import { RiskDetectionTable } from '@/components/report/risk-content/RiskDetectionTable';
import { RiskResultTable } from '@/components/report/risk-content/RiskResultTable';
import { LiskContentIcon } from '@/components/icons/LiskContentIcon';

const ServiceUpgradeModal = dynamic(
  () =>
    import('@/components/client/sidebar/ServiceUpgradeModal').then((m) => m.ServiceUpgradeModal),
  { ssr: false },
);

interface RiskContentProps {
  workspaceId: string;
  reportId: string;
  editable?: boolean;
  /** 신고 대행 요청 버튼 노출 여부. 보고서 내부에선 false, 위기 대응 센터에선 true */
  allowReport?: boolean;
  pdfMode?: boolean;
}

export function RiskContent({ workspaceId, reportId, editable = false, allowReport = false, pdfMode = false }: RiskContentProps) {
  const { data: report } = useReportInfoSuspense(reportId);
  const { data: riskItems } = useRiskItemsSuspense(workspaceId, reportId);
  const { data: riskReports } = useRiskReportsSuspense(workspaceId, reportId);
  const { data: subscription } = useWorkspaceSubscription(workspaceId);
  const deleteMutation = useDeleteRiskReport(workspaceId, reportId);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { reportedSourceIds, riskReportBySourceId } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, string>();
    for (const rr of riskReports) {
      ids.add(rr.source_id);
      map.set(rr.source_id, rr.id);
    }
    return { reportedSourceIds: ids, riskReportBySourceId: map };
  }, [riskReports]);

  const isDaily = report?.type === 'daily';
  // initial 보고서에 속한 항목은 신고 대행 요청 불가 (DB trigger 도 함께 enforce)
  const isInitial = report?.type === 'initial';
  // has_armor=false 워크스페이스는 신고 대행 자체가 차단 (RLS + UI)
  const hasArmor = subscription?.has_armor ?? false;
  const effectiveAllowReport = allowReport && !isInitial && hasArmor;

  return (
    <div className="print-break">
      <ReportSection id="section-risk" icon={<LiskContentIcon size={36} />} title="리스크 콘텐츠 관리">
        <div className="print-keep">
          <RiskDetectionTable
            riskItems={riskItems}
            workspaceId={workspaceId}
            reportId={reportId}
            reportedSourceIds={reportedSourceIds}
            riskReportBySourceId={riskReportBySourceId}
            onCancelReport={deleteMutation.mutate}
            editable={editable}
            allowReport={effectiveAllowReport}
            pdfMode={pdfMode}
          />
        </div>
        {!hasArmor ? (
          <div className="print-keep flex flex-col gap-3">
            <h3 className="text-base font-bold text-text-accent">리스크 콘텐츠 처리 결과</h3>
            <ReportCard px={20} py={32}>
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <ShieldAlert size={32} className="text-bg-accent" />
                <p className="text-base font-semibold text-text-dark">
                  서비스 업그레이드가 필요합니다
                </p>
                <p className="text-sm text-text-muted leading-relaxed">
                  신고 대행(아머)은 별도 구독이 필요한 서비스입니다.
                </p>
                {!pdfMode && (
                  <Button
                    variant="outlineAccent"
                    size="lg"
                    onClick={() => setShowUpgrade(true)}
                    className="mt-2"
                  >
                    서비스 신청하기
                  </Button>
                )}
              </div>
            </ReportCard>
          </div>
        ) : (
          report?.period_start && report?.period_end && (
            <div className="print-keep">
              <RiskResultTable
                workspaceId={workspaceId}
                periodStart={report.period_start}
                periodEnd={report.period_end}
                isDaily={isDaily}
              />
            </div>
          )
        )}
      </ReportSection>

      {!pdfMode && (
        <ServiceUpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          title="아머 서비스 신청"
          description="리스크 콘텐츠 신고 대행 서비스(아머)는 별도 구독이 필요합니다."
        />
      )}
    </div>
  );
}
