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
  snapshotDiff?: SnapshotDiff;
}

export function Snapshot({
  score,
  totalItems,
  riskCount,
  sirRanking,
  isInitial,
  snapshotDiff,
}: SnapshotProps) {
  const prefix = isInitial ? '' : '전주 대비 ';

  const cards = [
    {
      title: '오늘의 SIR 지수',
      description: '1,000점 만점 기준',
      value: `${Math.round(score)}점`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.scoreDiff, '점', '상승', '하락', prefix)
        : undefined,
    },
    {
      title: '이번 주 수집된 평판 데이터 수',
      description: '6개 채널 통합 수집',
      value: `${totalItems.toLocaleString()}개`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.itemsDiff, '개', '증가', '감소', prefix)
        : undefined,
    },
    {
      title: '이번 주 리스크 높은 콘텐츠 수',
      description: '즉시 검토 권장',
      value: `${riskCount.toLocaleString()}개`,
      change: snapshotDiff
        ? formatChange(snapshotDiff.riskDiff, '개', '증가', '감소', prefix, true)
        : undefined,
    },
    {
      title: 'SIR 순위',
      description: `총 참여 기업 ${sirRanking.total}개`,
      value: getSirTier(score),
      change: snapshotDiff
        ? formatChange(snapshotDiff.tierDiff, '구간', '상승', '하락', prefix)
        : undefined,
    },
  ];

  return (
    <ReportSubSection title="Snapshot">
      <div className="flex gap-7">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </ReportSubSection>
  );
}
