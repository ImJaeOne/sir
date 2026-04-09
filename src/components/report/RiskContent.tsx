'use client';

import { useRiskItems } from '@/hooks/report/useReportQuery';
import { ReportSection, ReportSubSection } from '@/components/report/ReportSection';
import { ReportCard } from '@/components/report/ReportCard';
import { RiskTable } from '@/components/report/risk-content/RiskTable';
import { LiskContentIcon } from '@/components/icons/LiskContentIcon';

interface RiskContentProps {
  workspaceId: string;
}

export function RiskContent({ workspaceId }: RiskContentProps) {
  const { data: riskItems } = useRiskItems(workspaceId);

  return (
    <div className="print-break">
      <ReportSection id="section-risk" icon={<LiskContentIcon size={36} />} title="리스크 콘텐츠 관리">
        <ReportSubSection
          title="리스크 콘텐츠 탐지 내역"
          description="부정적 게시물 중 위험 수위가 높은 게시물을 AI가 분류한 것으로 고객 확인을 거쳐 신고 및 게시물 삭제 등의 후속조치 여부 결정이 필요합니다."
          tooltip={"SIR 팀에 신고 대행을 요청하거나 직접 신고\n처리를 통해 리스크를 해결하시기 바랍니다."}
          tooltipVariant="danger"
        >
          <ReportCard px={20} py={10}>
            <RiskTable riskItems={riskItems ?? []} />
          </ReportCard>
        </ReportSubSection>
      </ReportSection>
    </div>
  );
}
