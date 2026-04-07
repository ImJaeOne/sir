'use client';

import { ChannelAccordion } from '@/components/report/reputation/ChannelAccordion';
import { NewsClusterContent } from '@/components/report/reputation/NewsClusterContent';
import { ChannelItemContent } from '@/components/report/reputation/ChannelItemContent';
import type { ChannelStat, ChannelItem, NewsCluster } from '@/lib/api/reportApi';

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  naver_news: 'news',
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

interface ChannelDetailListProps {
  channelStats: ChannelStat[];
  channelItems: ChannelItem[];
  newsClusters: NewsCluster[];
}

export function ChannelDetailList({ channelStats, channelItems, newsClusters }: ChannelDetailListProps) {
  const itemsByChannel = new Map<string, ChannelItem[]>();
  for (const item of channelItems) {
    const channel = PLATFORM_TO_CHANNEL[item.platform_id] ?? item.platform_id;
    if (!itemsByChannel.has(channel)) itemsByChannel.set(channel, []);
    itemsByChannel.get(channel)!.push(item);
  }

  return (
    <div className="flex flex-col gap-2">
      {channelStats.map((ch) => {
        const trend = ch.positive >= ch.negative ? '긍정 우세' : '부정 우세';

        if (ch.id === 'news') {
          const unclustered = (itemsByChannel.get('news') ?? []).filter((i) => !i.cluster_id);
          return (
            <ChannelAccordion key={ch.id} name={ch.label} total={ch.value} trend={trend}>
              <NewsClusterContent clusters={newsClusters} unclustered={unclustered} />
            </ChannelAccordion>
          );
        }

        const items = itemsByChannel.get(ch.id) ?? [];
        return (
          <ChannelAccordion key={ch.id} name={ch.label} total={ch.value} trend={trend}>
            <ChannelItemContent name={ch.label} items={items} />
          </ChannelAccordion>
        );
      })}
    </div>
  );
}
