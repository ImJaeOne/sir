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
  isDaily?: boolean;
  hasPrev?: boolean;
  snapshotDiff?: SnapshotDiff;
}

export function Snapshot({
  score,
  totalItems,
  riskCount,
  sirRanking,
  isInitial,
  prevIsInitial,
  isDaily = false,
  hasPrev = false,
  snapshotDiff,
}: SnapshotProps) {
  const prefix = !hasPrev
    ? '기준점 대비 '
    : isDaily
      ? '전일 대비 '
      : prevIsInitial
        ? '전월 대비 '
        : '전주 대비 ';

  const period = isDaily ? '일간' : isInitial ? '월간' : '주간';

  const sirCard = {
    title: `${period} SIR 지수`,
    mobileTitle: `${period} SIR 지수`,
    description: '1,000점 만점 기준',
    value: `${Math.round(score)}점`,
    change: snapshotDiff
      ? formatChange(snapshotDiff.scoreDiff, '점', '상승', '하락', prefix)
      : undefined,
  };

  const itemsCard = {
    title: `${period} 수집된 평판 데이터 수`,
    mobileTitle: `${period} 수집된\n평판 데이터 수`,
    description: '뉴스, 영상, 게시글 수집',
    value: `${totalItems.toLocaleString()}개`,
    change: snapshotDiff
      ? formatChange(snapshotDiff.itemsDiff, '개', '증가', '감소', prefix)
      : undefined,
  };

  const riskCard = {
    title: `${period} 수집된 리스크 콘텐츠 수`,
    mobileTitle: `${period} 수집된\n리스크 콘텐츠 수`,
    description: '즉시 검토 권장',
    value: `${riskCount.toLocaleString()}개`,
    change: snapshotDiff
      ? formatChange(snapshotDiff.riskDiff, '개', '증가', '감소', prefix, true)
      : undefined,
  };

  // SIR 순위는 전체 기업 풀 비교 — daily 는 구독사가 제한적이라 모집단이 불완전해서 제외
  const rankingCard = {
    title: `${period} SIR 순위`,
    mobileTitle: `${period} SIR 순위`,
    description: `총 참여 기업 ${sirRanking.total}개`,
    value: getSirTier(score),
    change: snapshotDiff
      ? formatChange(snapshotDiff.tierDiff, '구간', '상승', '하락', prefix)
      : undefined,
  };

  const cards = isDaily
    ? [sirCard, itemsCard, riskCard]
    : [sirCard, itemsCard, riskCard, rankingCard];

  const gridCols = isDaily ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';

  return (
    <ReportSubSection title="Snapshot">
      <div className={`grid ${gridCols} gap-3 lg:gap-7`}>
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </ReportSubSection>
  );
}
