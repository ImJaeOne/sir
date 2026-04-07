'use client';

import { useMemo } from 'react';
import { ReportSection } from '@/components/report/ReportSection';
import { Snapshot } from '@/components/report/highlight/Snapshot';
import { Reputation } from '@/components/report/highlight/Reputation';
import { SirStockPanel } from '@/components/report/highlight/SirStockPanel';
import { SirRankingPanel } from '@/components/report/highlight/SirRankingPanel';
import { WeeklyHighlightIcon } from '@/components/icons/WeeklyHighlightIcon';
import type { SummarySection, SirStockPoint, SirRanking } from '@/lib/api/reportApi';

export interface SnapshotDiff {
  scoreDiff: number;
  tierDiff: number;
  itemsDiff: number;
  riskDiff: number;
}

interface HighlightProps {
  pdfMode?: boolean;
  sirScore?: number | null;
  totalItems?: number;
  riskCount?: number;
  summary?: SummarySection[];
  sirStockData?: SirStockPoint[];
  sirRanking?: SirRanking;
  companyName?: string;
  isInitial?: boolean;
  snapshotDiff?: SnapshotDiff;
}

const defaultRanking: SirRanking = { tiers: [], rank: 0, total: 0, average: 0 };

export function Highlight({
  pdfMode = false,
  sirScore,
  totalItems = 0,
  riskCount = 0,
  summary = [],
  sirStockData = [],
  sirRanking = defaultRanking,
  companyName = '',
  isInitial = false,
  snapshotDiff,
}: HighlightProps) {
  const score = sirScore ?? 0;

  const snapshotProps = useMemo(
    () => ({
      score,
      totalItems,
      riskCount,
      sirRanking,
      isInitial,
      snapshotDiff,
    }),
    [score, totalItems, riskCount, sirRanking, isInitial, snapshotDiff],
  );

  const sirStockProps = useMemo(
    () => ({ pdfMode, sirStockData }),
    [pdfMode, sirStockData],
  );

  const sirRankingProps = useMemo(
    () => ({ score, companyName, sirRanking, pdfMode }),
    [score, companyName, sirRanking, pdfMode],
  );

  return (
    <ReportSection icon={<WeeklyHighlightIcon size={36} />} title="주간 하이라이트">
      <Snapshot {...snapshotProps} />
      <Reputation summary={summary} />
      <SirStockPanel {...sirStockProps} />
      <SirRankingPanel {...sirRankingProps} />
    </ReportSection>
  );
}
