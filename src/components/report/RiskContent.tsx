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
            <RiskTable riskItems={riskItems ?? []} />
          </ReportCard>
        </ReportSubSection>
      </ReportSection>
    </div>
  );
}
