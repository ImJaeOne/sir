'use client';

import { SirScoreDonut } from '@/components/chart/SirScoreDonut';
import { TierStack } from '@/components/chart/TierStack';
import { SirRankingBar } from '@/components/chart/SirRankingBar';
import { ReportSubSection } from '@/components/report/ReportSection';
import { SirRankingCard } from '@/components/report/highlight/SirRankingCard';
import { SirScoreIcon } from '@/components/icons/SirScoreIcon';
import { SirAvgIcon } from '@/components/icons/SirAvgIcon';
import { getSirTier } from '@/utils/sir';
import type { SirRanking } from '@/lib/api/reportApi';

interface SirRankingPanelProps {
  score: number;
  companyName: string;
  sirRanking: SirRanking;
  pdfMode: boolean;
}

export function SirRankingPanel({ score, companyName, sirRanking, pdfMode }: SirRankingPanelProps) {
  return (
    <ReportSubSection
      title="SIR 주간 순위"
      description="SIR을 사용중인 전체 기업 중 우리 회사의 순위를 확인할 수 있습니다."
      className="flex gap-4"
    >
      <div className="shrink-0 w-[300px] flex flex-col gap-3">
        <SirRankingCard label={`${companyName} SIR 점수`} value={`${Math.round(score)}점`}>
          <SirScoreDonut score={score} icon={<SirScoreIcon size={18} />} />
        </SirRankingCard>
        <SirRankingCard label={`${companyName} 순위`} value={getSirTier(score)}>
          <TierStack score={score} />
        </SirRankingCard>
        <SirRankingCard label="SIR 전체 평균 점수" value={`${sirRanking.average}점`}>
          <SirScoreDonut score={sirRanking.average} icon={<SirAvgIcon size={18} />} />
        </SirRankingCard>
      </div>
      <SirRankingBar tiers={sirRanking.tiers} pdfMode={pdfMode} />
    </ReportSubSection>
  );
}
