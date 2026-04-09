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
      description="각 채널명을 클릭하면 접고 펼치는 방식으로 수집된 세부 콘텐츠 목록을 확인할 수 있습니다."
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
