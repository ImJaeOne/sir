'use client';

import { useMemo } from 'react';
import {
  useWorkspaceSir,
  useWeeklySummary,
  useSirStockData,
  useSirRanking,
  useChannelItems,
  useRiskItems,
  usePrevReport,
  useReportInfo,
} from '@/hooks/report/useReportQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { Snapshot } from '@/components/report/highlight/Snapshot';
import { Reputation } from '@/components/report/highlight/Reputation';
import { SirStockPanel } from '@/components/report/highlight/SirStockPanel';
import { SirRankingPanel } from '@/components/report/highlight/SirRankingPanel';
import { WeeklyHighlightIcon } from '@/components/icons/WeeklyHighlightIcon';
import type { SirRanking } from '@/lib/api/reportApi';

export interface SnapshotDiff {
  scoreDiff: number;
  tierDiff: number;
  itemsDiff: number;
  riskDiff: number;
}

interface HighlightProps {
  workspaceId: string;
  reportId: string;
  pdfMode?: boolean;
}

const defaultRanking: SirRanking = { tiers: [], rank: 0, total: 0, average: 0 };

export function Highlight({ workspaceId, reportId, pdfMode = false }: HighlightProps) {
  const { data: workspace } = useWorkspaceSir(workspaceId);
  const { data: report } = useReportInfo(reportId);
  const { data: summary } = useWeeklySummary(workspaceId, reportId);
  const { data: sirStockData } = useSirStockData(workspaceId);
  const { data: sirRanking } = useSirRanking(workspaceId);
  const { data: channelItems } = useChannelItems(workspaceId);
  const { data: riskItems } = useRiskItems(workspaceId);
  const { data: prevReport } = usePrevReport(workspaceId, reportId);

  const isInitial = report?.type === 'initial';
  const sirScore = workspace?.sir_score ?? 0;
  const totalItems = channelItems?.length ?? 0;
  const riskCount = riskItems?.length ?? 0;

  const snapshotDiff = useMemo(() => {
    const getTierIdx = (s: number) => Math.min(Math.floor(s / 100), 9);

    if (!prevReport) {
      return {
        scoreDiff: Math.round(sirScore - 500),
        tierDiff: getTierIdx(sirScore) - getTierIdx(500),
        itemsDiff: totalItems,
        riskDiff: riskCount,
      };
    }

    const prevDate = prevReport.createdAt;
    const currItems = (channelItems ?? []).filter((i) => i.published_at && i.published_at >= prevDate).length;
    const prevItems = (channelItems ?? []).filter((i) => i.published_at && i.published_at < prevDate).length;
    const currRisk = (riskItems ?? []).filter((i) => i.published_at && i.published_at >= prevDate).length;
    const prevRisk = (riskItems ?? []).filter((i) => i.published_at && i.published_at < prevDate).length;

    return {
      scoreDiff: Math.round(sirScore - prevReport.sirScore),
      tierDiff: getTierIdx(sirScore) - getTierIdx(prevReport.sirScore),
      itemsDiff: currItems - prevItems,
      riskDiff: currRisk - prevRisk,
    };
  }, [sirScore, totalItems, riskCount, prevReport, channelItems, riskItems]);

  const snapshotProps = useMemo(
    () => ({ score: sirScore, totalItems, riskCount, sirRanking: sirRanking ?? defaultRanking, isInitial, snapshotDiff }),
    [sirScore, totalItems, riskCount, sirRanking, isInitial, snapshotDiff],
  );

  const sirStockProps = useMemo(
    () => ({ pdfMode, sirStockData: sirStockData ?? [] }),
    [pdfMode, sirStockData],
  );

  const sirRankingProps = useMemo(
    () => ({ score: sirScore, companyName: workspace?.company_name ?? '', sirRanking: sirRanking ?? defaultRanking, pdfMode }),
    [sirScore, workspace?.company_name, sirRanking, pdfMode],
  );

  return (
    <ReportSection icon={<WeeklyHighlightIcon size={36} />} title="주간 하이라이트">
      <Snapshot {...snapshotProps} />
      <Reputation summary={summary ?? []} />
      <SirStockPanel {...sirStockProps} />
      <SirRankingPanel {...sirRankingProps} />
    </ReportSection>
  );
}
