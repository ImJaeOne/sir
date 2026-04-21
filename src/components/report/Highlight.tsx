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
  usePrevDailySnapshot,
  useReportInfo,
} from '@/hooks/report/useReportQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { Snapshot } from '@/components/report/highlight/Snapshot';
import { Reputation } from '@/components/report/highlight/Reputation';
import { EditableReputation } from '@/components/report/highlight/EditableReputation';
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
  editable?: boolean;
}

const defaultRanking: SirRanking = { tiers: [], rank: 0, total: 0, average: 0 };

export function Highlight({ workspaceId, reportId, pdfMode = false, editable = false }: HighlightProps) {
  const { data: workspace } = useWorkspaceSir(workspaceId);
  const { data: report } = useReportInfo(reportId);
  const { data: summary } = useWeeklySummary(workspaceId, reportId);
  const { data: sirStockData } = useSirStockData(workspaceId, reportId);
  const { data: sirRanking } = useSirRanking(workspaceId, reportId);
  const { data: channelItems } = useChannelItems(workspaceId, reportId);
  const { data: riskItems } = useRiskItems(workspaceId, reportId);
  const { data: prevReport } = usePrevReport(workspaceId, reportId);

  const isInitial = report?.type === 'initial';
  const isDaily = report?.type === 'daily';
  const sirScore = report?.sir_score ?? 0;
  const totalItems = channelItems?.length ?? 0;
  const riskCount = riskItems?.length ?? 0;

  // daily 는 이전 daily report 가 없어도(첫 daily) daily_snapshots 로 전일 비교
  const { data: prevDaily } = usePrevDailySnapshot(workspaceId, report?.period_end, isDaily);

  const snapshotDiff = useMemo(() => {
    const getTierIdx = (s: number) => Math.min(Math.floor(s / 100), 9);

    // daily: daily_snapshots 기반 전일 비교 (tierDiff 는 순위 카드가 daily 에서 안 보이므로 계산만)
    if (isDaily && prevDaily) {
      return {
        scoreDiff: Math.round(sirScore - prevDaily.sirScore),
        tierDiff: getTierIdx(sirScore) - getTierIdx(prevDaily.sirScore),
        itemsDiff: totalItems - prevDaily.totalItems,
        riskDiff: riskCount - prevDaily.riskCount,
      };
    }

    if (!prevReport) {
      // 첫 보고서 — SIR 500 기준, 나머지 0 기준
      return {
        scoreDiff: Math.round(sirScore - 500),
        tierDiff: getTierIdx(sirScore) - getTierIdx(500),
        itemsDiff: totalItems,
        riskDiff: riskCount,
      };
    }

    return {
      scoreDiff: Math.round(sirScore - prevReport.sirScore),
      tierDiff: getTierIdx(sirScore) - getTierIdx(prevReport.sirScore),
      itemsDiff: totalItems - prevReport.totalItems,
      riskDiff: riskCount - prevReport.riskCount,
    };
  }, [isDaily, prevDaily, sirScore, totalItems, riskCount, prevReport]);

  const prevIsInitial = prevReport?.type === 'initial';
  const hasPrev = isDaily ? !!prevDaily : !!prevReport;

  const snapshotProps = useMemo(
    () => ({ score: sirScore, totalItems, riskCount, sirRanking: sirRanking ?? defaultRanking, isInitial, prevIsInitial, isDaily, hasPrev, snapshotDiff }),
    [sirScore, totalItems, riskCount, sirRanking, isInitial, prevIsInitial, isDaily, hasPrev, snapshotDiff],
  );

  const sirStockProps = useMemo(
    () => ({ pdfMode, sirStockData: sirStockData ?? [] }),
    [pdfMode, sirStockData],
  );

  const avgScore = workspace?.sir_score ?? 0;

  const sirRankingProps = useMemo(
    () => ({ score: sirScore, avgScore, companyName: workspace?.company_name ?? '', sirRanking: sirRanking ?? defaultRanking, pdfMode, isDaily }),
    [sirScore, avgScore, workspace?.company_name, sirRanking, pdfMode, isDaily],
  );

  return (
    <ReportSection icon={<WeeklyHighlightIcon size={36} />} title={isDaily ? '일간 하이라이트' : '주간 하이라이트'}>
      <Snapshot {...snapshotProps} />
      {!isDaily && (
        <>
          {editable ? (
            <EditableReputation summary={summary ?? []} workspaceId={workspaceId} reportId={reportId} />
          ) : (
            <Reputation summary={summary ?? []} />
          )}
          <SirStockPanel {...sirStockProps} />
          <SirRankingPanel {...sirRankingProps} />
        </>
      )}
    </ReportSection>
  );
}
