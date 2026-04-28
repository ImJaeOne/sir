'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ChannelDetailList } from '@/components/report/reputation/ChannelDetailList';
import type { ChannelStat, ChannelItem, NewsCluster } from '@/lib/api/reportApi';

interface ChannelDetailPanelProps {
  channelStats: ChannelStat[];
  channelItems: ChannelItem[];
  newsClusters: NewsCluster[];
}

export function ChannelDetailPanel({ channelStats, channelItems, newsClusters }: ChannelDetailPanelProps) {
  return (
    <ReportSubSection
      title="채널별 수집 데이터 상세 보기"
      description="각 채널명을 클릭하면 수집된 모든 콘텐츠와 AI가 요약한 핵심 내용을 확인할 수 있습니다."
    >
      <ReportCard px={20} py={20}>
        <ChannelDetailList
          channelStats={channelStats}
          channelItems={channelItems}
          newsClusters={newsClusters}
        />
      </ReportCard>
    </ReportSubSection>
  );
}
