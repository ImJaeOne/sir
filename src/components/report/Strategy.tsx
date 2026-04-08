'use client';

import { ReportSection, ReportSubSection } from '@/components/report/ReportSection';
import { StrategyCard } from '@/components/report/strategy/StrategyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StrategyIcon } from '@/components/icons/StrategyIcon';
import type { StrategyGroup } from '@/lib/api/reportApi';

export interface StrategyProps {
  strategies?: StrategyGroup[];
}

export function Strategy({ strategies = [] }: StrategyProps) {
  return (
    <div className="print-break">
      <ReportSection icon={<StrategyIcon size={36} />} title="대응 전략 제안">
        <ReportSubSection
          title="채널별 대응 전략"
          description="이번 주 온라인 여론 분석 결과를 바탕으로, 각 채널별 긍정 여론 확산 및 부정 여론 완화를 위한 주요 전략을 확인할 수 있습니다."
        >
          {strategies.length > 0 ? (
            <div className="flex flex-col gap-4">
              {strategies.map((s) => (
                <StrategyCard key={s.category} category={s.category} label={s.label} strategy={s.strategy} />
              ))}
            </div>
          ) : (
            <EmptyState message={"전략 데이터가 없습니다.\n전략 생성을 실행해주세요."} />
          )}
        </ReportSubSection>
      </ReportSection>
    </div>
  );
}
