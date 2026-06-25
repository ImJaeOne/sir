export type ReportChannel = 'news' | 'blog' | 'youtube' | 'community';

export const REPORT_CHANNELS: { name: string; key: ReportChannel; color: string }[] = [
  { name: '뉴스', key: 'news', color: '#362cff' },
  { name: '블로그', key: 'blog', color: '#9747ff' },
  { name: '유튜브', key: 'youtube', color: '#ff0000' },
  { name: '커뮤니티', key: 'community', color: '#17d82d' },
];

export const PLATFORM_TO_REPORT_CHANNEL: Record<string, ReportChannel> = {
  naver_news: 'news',
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

export const REPORT_CHANNEL_LABEL: Record<ReportChannel, string> = REPORT_CHANNELS.reduce(
  (acc, channel) => {
    acc[channel.key] = channel.name;
    return acc;
  },
  {} as Record<ReportChannel, string>,
);

export const REPORT_CHANNEL_COLOR: Record<ReportChannel, string> = REPORT_CHANNELS.reduce(
  (acc, channel) => {
    acc[channel.key] = channel.color;
    return acc;
  },
  {} as Record<ReportChannel, string>,
);
