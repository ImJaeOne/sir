'use client';

import { useMemo } from 'react';
import { ReportSection } from '@/components/report/ReportSection';
import { SearchTrendPanel } from '@/components/report/reputation/SearchTrendPanel';
import { ChannelVolumePanel } from '@/components/report/reputation/ChannelVolumePanel';
import { ChannelSirPanel } from '@/components/report/reputation/ChannelSirPanel';
import { SentimentPanel } from '@/components/report/reputation/SentimentPanel';
import { ChannelDetailPanel } from '@/components/report/reputation/ChannelDetailPanel';
import { OnlineReputationIcon } from '@/components/icons/OnlineReputationIcon';
import type { ChannelStat, ChannelItem, NewsCluster } from '@/lib/api/reportApi';

interface TrendPoint {
  date: string;
  ratio: number;
}

export interface OnlineReputationProps {
  pdfMode?: boolean;
  naverTrend?: TrendPoint[];
  googleTrend?: TrendPoint[];
  channelStats?: ChannelStat[];
  channelItems?: ChannelItem[];
  newsClusters?: NewsCluster[];
  isInitial?: boolean;
}

export function OnlineReputation({
  pdfMode = false,
  naverTrend = [],
  googleTrend = [],
  channelStats = [],
  channelItems = [],
  newsClusters = [],
  isInitial = false,
}: OnlineReputationProps) {
  const searchTrendProps = useMemo(
    () => ({ naverTrend, googleTrend, pdfMode }),
    [naverTrend, googleTrend, pdfMode],
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
      <ReportSection icon={<OnlineReputationIcon size={36} />} title="온라인 평판 종합">
        <SearchTrendPanel {...searchTrendProps} />
        <ChannelVolumePanel {...channelVolumeProps} />
        <ChannelSirPanel channelStats={channelStats} isInitial={isInitial} />
        <SentimentPanel {...sentimentProps} />
        <ChannelDetailPanel {...channelDetailProps} />
      </ReportSection>
    </div>
  );
}
