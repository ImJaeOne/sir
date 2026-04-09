'use client';

import { useChannelItems, useNewsClusters } from '@/hooks/report/useReportQuery';
import { ReportSection } from '@/components/report/ReportSection';
import { TopContentCard } from '@/components/report/top-content/TopContentCard';
import { NewsTopList } from '@/components/report/top-content/NewsTopList';
import { ChannelTopList } from '@/components/report/top-content/ChannelTopList';
import { TopContentsIcon } from '@/components/icons/TopContentsIcon';

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

const CHANNEL_ORDER = [
  {
    id: 'blog',
    title: '블로그 TOP 3',
    description: 'AI 분석 기반 영향력이 높은 포스팅 기준으로 선정되었습니다.',
    sortBy: 'impact_score' as const,
  },
  {
    id: 'youtube',
    title: '유튜브 TOP 3',
    description: '가장 많이 조회된 영상 기준으로 선정되었습니다.',
    sortBy: 'views' as const,
  },
  {
    id: 'community',
    title: '커뮤니티 TOP 3',
    description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.',
    sortBy: 'views' as const,
  },
];

interface TopContentProps {
  workspaceId: string;
}

export function TopContent({ workspaceId }: TopContentProps) {
  const { data: channelItems } = useChannelItems(workspaceId);
  const { data: newsClusters } = useNewsClusters(workspaceId);

  const byChannel = new Map<string, typeof channelItems extends (infer T)[] | undefined ? T[] : never>();
  for (const item of channelItems ?? []) {
    if (item.platform_id === 'naver_news') continue;
    const channel = PLATFORM_TO_CHANNEL[item.platform_id] ?? item.platform_id;
    if (!byChannel.has(channel)) byChannel.set(channel, []);
    byChannel.get(channel)!.push(item);
  }

  const channels = CHANNEL_ORDER.map((ch) => {
    const items = byChannel.get(ch.id) ?? [];
    const sorted = [...items].sort((a, b) => {
      if (ch.sortBy === 'impact_score') return (b.impact_score ?? 0) - (a.impact_score ?? 0);
      return (b.views ?? 0) - (a.views ?? 0);
    });
    return { ...ch, items: sorted.slice(0, 3) };
  });

  return (
    <div className="print-break">
      <ReportSection icon={<TopContentsIcon size={36} />} title="채널별 상위 콘텐츠">
        <div className="grid grid-cols-2 gap-6">
          <TopContentCard
            channelId="news"
            title="뉴스 TOP 3"
            description="관련 기사가 가장 많은 클러스터 기준으로 선정되었습니다."
          >
            <NewsTopList clusters={newsClusters ?? []} />
          </TopContentCard>

          {channels.map((ch) => (
            <TopContentCard
              key={ch.id}
              channelId={ch.id}
              title={ch.title}
              description={ch.description}
            >
              <ChannelTopList items={ch.items} sortBy={ch.sortBy} />
            </TopContentCard>
          ))}
        </div>
      </ReportSection>
    </div>
  );
}
