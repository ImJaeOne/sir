'use client';

import { useMemo } from 'react';
import {
  useSearchTrend,
  useChannelItems,
  useChannelStats,
  useNewsClusters,
  useReportInfo,
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
  const { data: report } = useReportInfo(reportId);
  const { data: searchTrend } = useSearchTrend(workspaceId, reportId);
  const { data: channelItems } = useChannelItems(workspaceId);
  const { data: channelStats } = useChannelStats(workspaceId, channelItems);
  const { data: newsClusters } = useNewsClusters(workspaceId);

  const isInitial = report?.type === 'initial';

  const searchTrendProps = useMemo(
    () => ({ naverTrend: searchTrend?.naver ?? [], googleTrend: searchTrend?.google ?? [], pdfMode }),
    [searchTrend, pdfMode],
  );

  const channelVolumeProps = useMemo(
    () => ({ channelStats: channelStats ?? [], pdfMode }),
    [channelStats, pdfMode],
  );

  const sentimentProps = useMemo(
    () => ({ channelStats: channelStats ?? [], pdfMode }),
    [channelStats, pdfMode],
  );

  const channelDetailProps = useMemo(
    () => ({ channelStats: channelStats ?? [], channelItems: channelItems ?? [], newsClusters: newsClusters ?? [] }),
    [channelStats, channelItems, newsClusters],
  );

  return (
    <div className="print-break">
      <ReportSection id="section-reputation" icon={<OnlineReputationIcon size={36} />} title="온라인 평판 종합">
        <SearchTrendPanel {...searchTrendProps} />
        <ChannelVolumePanel {...channelVolumeProps} />
        <ChannelSirPanel channelStats={channelStats ?? []} isInitial={isInitial} />
        <SentimentPanel {...sentimentProps} />
        <ChannelDetailPanel {...channelDetailProps} />
      </ReportSection>
    </div>
  );
}
