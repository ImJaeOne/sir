'use client';

import { SirScoreDonut } from '@/components/chart/SirScoreDonut';
import { TierStack } from '@/components/chart/TierStack';
import { SirRankingBar } from '@/components/chart/SirRankingBar';
import { MobileSirRankingBar } from '@/components/chart/MobileSirRankingBar';
import { ReportSubSection } from '@/components/report/ReportSection';
import { SirRankingCard } from '@/components/report/highlight/SirRankingCard';
import { SirScoreIcon } from '@/components/icons/SirScoreIcon';
import { SirAvgIcon } from '@/components/icons/SirAvgIcon';
import { getSirTier } from '@/utils/sir';
import type { SirRanking } from '@/lib/api/reportApi';

interface SirRankingPanelProps {
  score: number;
  avgScore: number;
  companyName: string;
  sirRanking: SirRanking;
  pdfMode: boolean;
  isDaily?: boolean;
  isInitial?: boolean;
}

export function SirRankingPanel({ score, avgScore, companyName, sirRanking, pdfMode, isDaily = false, isInitial = false }: SirRankingPanelProps) {
  const periodLabel = isDaily ? '일간' : isInitial ? '월간' : '주간';
  return (
    <ReportSubSection
      title={`SIR ${periodLabel} 순위`}
      description="SIR을 사용중인 전체 기업 중 우리 회사의 순위를 확인할 수 있습니다."
      className={`flex flex-col lg:flex-row gap-4 ${pdfMode ? 'lg:items-stretch' : ''}`}
    >
      <div className="shrink-0 lg:w-[300px] flex flex-col gap-3">
        <SirRankingCard label={`${companyName} SIR 점수`} value={`${Math.round(score)}점`}>
          <SirScoreDonut score={score} icon={<SirScoreIcon size={18} />} />
        </SirRankingCard>
        <SirRankingCard label={`${companyName} 순위`} value={getSirTier(score)}>
          <TierStack score={score} />
        </SirRankingCard>
        <SirRankingCard label="SIR 전체 평균 점수" value={`${avgScore}점`}>
          <SirScoreDonut score={avgScore} icon={<SirAvgIcon size={18} />} />
        </SirRankingCard>
      </div>
      <div className={pdfMode ? 'hidden lg:flex w-full' : 'hidden lg:block w-full'}>
        <SirRankingBar tiers={sirRanking.tiers} pdfMode={pdfMode} />
      </div>
      <div className="lg:hidden w-full">
        <MobileSirRankingBar tiers={sirRanking.tiers} />
      </div>
    </ReportSubSection>
  );
}
