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

// 3분기 — neutral 이 최다면 중립 우세. positive==negative==0(중립만 있는) 케이스가
// 이전 `>= ` 비교에선 '긍정 우세' 로 잘못 떨어졌었다.
function getTrendLabel(positive: number, neutral: number, negative: number): string {
  if (neutral >= positive && neutral >= negative) return '중립 우세';
  if (positive > negative) return '긍정 우세';
  return '부정 우세';
}

// 뉴스 채널 "우세" 는 클러스터 단위 sentiment(×기사수) + 미클러스터 기사 로 집계한다.
// 채널 stat 의 개별 기사 sentiment 로 세면, 같은 패널의 클러스터 배지/필터칩(cluster.sentiment 기준)과
// 어긋난다. (예: AI 가 positive 로 묶은 클러스터 안에 개별 neutral 기사가 섞이면 pos==neu 동점 → 중립 우세)
function getNewsTrend(clusters: NewsCluster[], unclustered: ChannelItem[]): string {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  const add = (sentiment: string | null | undefined, count: number) => {
    if (sentiment === 'positive') positive += count;
    else if (sentiment === 'negative') negative += count;
    else neutral += count; // null/neutral/미상 — 클러스터 배지의 `?? 'neutral'` 과 동일
  };
  for (const c of clusters) add(c.sentiment, c.items.length);
  for (const i of unclustered) add(i.sentiment, 1);
  return getTrendLabel(positive, neutral, negative);
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
        const trend = getTrendLabel(ch.positive, ch.neutral, ch.negative);

        if (ch.id === 'news') {
          const unclustered = (itemsByChannel.get('news') ?? []).filter((i) => !i.cluster_id);
          const newsTrend = getNewsTrend(newsClusters, unclustered);
          return (
            <ChannelAccordion key={ch.id} name={ch.label} total={ch.value} trend={newsTrend}>
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
