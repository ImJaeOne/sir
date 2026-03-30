'use client';

import { ReportCard } from '@/components/report/ReportCard';
import type { ChannelItem } from '@/lib/api/reportApi';

const CHANNEL_ORDER = [
  { id: 'naver_news', title: '뉴스 TOP 3', description: '가장 많이 발행된 기사 기준으로 선정되었습니다.', useViews: false },
  { id: 'naver_blog', title: '블로그 TOP 3', description: 'AI 분석 기반 영향력이 높은 포스팅 기준으로 선정되었습니다.', useViews: false },
  { id: 'youtube', title: '유튜브 TOP 3', description: '가장 많이 조회된 영상 기준으로 선정되었습니다.', useViews: true },
  { id: 'naver_stock', title: '네이버 종목토론방 TOP 3', description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.', useViews: true },
  { id: 'dcinside', title: '디시인사이드 TOP 3', description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.', useViews: true },
];

export function SectionTopContent({ channelItems = [] }: { channelItems?: ChannelItem[] }) {
  // 플랫폼별 그룹핑
  const byPlatform = new Map<string, ChannelItem[]>();
  for (const item of channelItems) {
    if (!byPlatform.has(item.platform_id)) byPlatform.set(item.platform_id, []);
    byPlatform.get(item.platform_id)!.push(item);
  }

  // 채널별 Top 3 선정
  const channels = CHANNEL_ORDER
    .map(ch => {
      const items = byPlatform.get(ch.id) ?? [];
      const sorted = ch.useViews
        ? [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        : items;
      return { ...ch, items: sorted.slice(0, 3) };
    })
    .filter(ch => ch.items.length > 0);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">채널별 상위 콘텐츠</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {channels.map(ch => (
          <ReportCard key={ch.id} title={ch.title} description={ch.description}>
            <div className="flex flex-col gap-2.5">
              {ch.items.map((item, i) => (
                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2 transition-colors">
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                    {ch.useViews && item.views != null
                      ? <p className="text-xs text-slate-400 mt-0.5">조회수 {item.views.toLocaleString()}회</p>
                      : (item.summary || item.content) && <p className="text-xs text-slate-400 mt-0.5 truncate">{(item.summary || item.content || '').slice(0, 60)}</p>
                    }
                  </div>
                </a>
              ))}
            </div>
          </ReportCard>
        ))}
      </div>
    </section>
  );
}
