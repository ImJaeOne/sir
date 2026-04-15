import { StatCard, formatChange } from '@/components/report/highlight/StatCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { getSirTier } from '@/utils/sir';
import type { SnapshotDiff } from '@/components/report/Highlight';
import type { SirRanking } from '@/lib/api/reportApi';

interface SnapshotProps {
  score: number;
  totalItems: number;
  riskCount: number;
  sirRanking: SirRanking;
  isInitial: boolean;
  prevIsInitial: boolean;
  snapshotDiff?: SnapshotDiff;
}

export function Snapshot({
  score,
  totalItems,
  riskCount,
  sirRanking,
  isInitial,
  prevIsInitial,
  snapshotDiff,
}: SnapshotProps) {
  const prefix = isInitial ? '' : prevIsInitial ? '전월 대비 ' : '전주 대비 ';

  const cards = [
    {
      title: '주간 SIR 지수',
      mobileTitle: '주간 SIR 지수',
      description: '1,000점 만점 기준',
      value: `${Math.round(score)}점`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.scoreDiff, '점', '상승', '하락', prefix)
        : undefined,
    },
    {
      title: '주간 수집된 평판 데이터 수',
      mobileTitle: '주간 수집된\n평판 데이터 수',
      description: '6개 채널 통합 수집',
      value: `${totalItems.toLocaleString()}개`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.itemsDiff, '개', '증가', '감소', prefix)
        : undefined,
    },
    {
      title: '주간 리스크 높은 콘텐츠 수',
      mobileTitle: '주간 리스크\n높은 콘텐츠 수',
      description: '즉시 검토 권장',
      value: `${riskCount.toLocaleString()}개`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.riskDiff, '개', '증가', '감소', prefix, true)
        : undefined,
    },
    {
      title: '주간 SIR 순위',
      mobileTitle: '주간 SIR 순위',
      description: `총 참여 기업 ${sirRanking.total}개`,
      value: getSirTier(score),
      change: snapshotDiff
        ? formatChange(snapshotDiff.tierDiff, '구간', '상승', '하락', prefix)
        : undefined,
    },
  ];

  return (
    <ReportSubSection title="Snapshot">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-7">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </ReportSubSection>
  );
}
