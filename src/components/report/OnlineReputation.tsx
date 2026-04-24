'use client';

import { useMemo } from 'react';
import {
  useSearchTrendSuspense,
  useChannelItemsSuspense,
  useChannelStatsSuspense,
  useNewsClustersSuspense,
  useReportInfoSuspense,
  usePrevReportSuspense,
  usePrevDailySnapshotSuspense,
} from '@/hooks/report/useReportQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { SearchTrendPanel } from '@/components/report/reputation/SearchTrendPanel';
import { ChannelVolumePanel } from '@/components/report/reputation/ChannelVolumePanel';
import { ChannelSirPanel } from '@/components/report/reputation/ChannelSirPanel';
import { SentimentPanel } from '@/components/report/reputation/SentimentPanel';
import { ChannelDetailPanel } from '@/components/report/reputation/ChannelDetailPanel';
import { OnlineReputationIcon } from '@/components/icons/OnlineReputationIcon';

interface OnlineReputationProps {
  workspaceId: string;
  reportId: string;
  pdfMode?: boolean;
}

export function OnlineReputation({ workspaceId, reportId, pdfMode = false }: OnlineReputationProps) {
  const { data: report } = useReportInfoSuspense(reportId);
  const { data: searchTrend } = useSearchTrendSuspense(workspaceId, reportId);
  const { data: channelItems } = useChannelItemsSuspense(workspaceId, reportId);
  const { data: channelStats } = useChannelStatsSuspense(workspaceId, channelItems, reportId);
  const { data: newsClusters } = useNewsClustersSuspense(workspaceId, reportId);
  const { data: prevReport } = usePrevReportSuspense(workspaceId, reportId);

  const isInitial = report?.type === 'initial';
  const isDaily = report?.type === 'daily';
  const prevIsInitial = prevReport?.type === 'initial';

  // daily 는 이전 daily report 가 없어도 daily_snapshots 로 전일 채널별 SIR 비교
  const { data: prevDaily } = usePrevDailySnapshotSuspense(workspaceId, report?.period_end, isDaily);
  const prevChannelSirMap = isDaily
    ? (prevDaily?.channelSirMap ?? {})
    : (prevReport?.channelSirMap ?? {});

  const searchTrendProps = useMemo(
    () => ({
      naverTrend: searchTrend.naver,
      googleTrend: searchTrend.google,
      pdfMode,
      workspaceId,
      reportId,
    }),
    [searchTrend, pdfMode, workspaceId, reportId],
  );

  const channelVolumeProps = useMemo(
    () => ({ channelStats, pdfMode }),
    [channelStats, pdfMode],
  );

  const sentimentProps = useMemo(
    () => ({ channelStats, pdfMode }),
    [channelStats, pdfMode],
  );

  const channelDetailProps = useMemo(
    () => ({ channelStats, channelItems, newsClusters }),
    [channelStats, channelItems, newsClusters],
  );

  return (
    <div className="print-break">
      <ReportSection id="section-reputation" icon={<OnlineReputationIcon size={36} />} title="온라인 평판 종합">
        {!isDaily && <div className="print-keep"><SearchTrendPanel {...searchTrendProps} /></div>}
        <div className="print-keep"><ChannelVolumePanel {...channelVolumeProps} /></div>
        <div className="print-keep">
          <ChannelSirPanel channelStats={channelStats} isInitial={isInitial} prevIsInitial={prevIsInitial} isDaily={isDaily} prevChannelSirMap={prevChannelSirMap} />
        </div>
        <div className="print-keep"><SentimentPanel {...sentimentProps} /></div>
        <div className="print-keep"><ChannelDetailPanel {...channelDetailProps} /></div>
      </ReportSection>
    </div>
  );
}
