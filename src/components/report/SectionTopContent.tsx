'use client';

import { useState } from 'react';
import { ReportCard } from '@/components/report/ReportCard';
import type { ChannelItem, NewsCluster } from '@/lib/api/reportApi';

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

const CHANNEL_ORDER = [
  { id: 'blog', title: '블로그 TOP 3', description: 'AI 분석 기반 영향력이 높은 포스팅 기준으로 선정되었습니다.', sortBy: 'impact_score' as const },
  { id: 'youtube', title: '유튜브 TOP 3', description: '가장 많이 조회된 영상 기준으로 선정되었습니다.', sortBy: 'views' as const },
  { id: 'community', title: '커뮤니티 TOP 3', description: '가장 많이 조회된 게시글 기준으로 선정되었습니다.', sortBy: 'views' as const },
];

const PLATFORM_BADGES: Record<string, { label: string; className: string }> = {
  naver_stock: { label: 'N', className: 'bg-green-100 text-green-700' },
  dcinside: { label: 'DC', className: 'bg-amber-100 text-amber-700' },
};

function NewsClusterCard({ clusters }: { clusters: NewsCluster[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const top3 = [...clusters].sort((a, b) => b.items.length - a.items.length).slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <ReportCard>
      <h4 className="text-sm font-semibold text-slate-700 mb-1">뉴스 TOP 3</h4>
      <p className="text-xs text-slate-400 mb-3">관련 기사가 가장 많은 클러스터 기준으로 선정되었습니다.</p>
      <div className="flex flex-col gap-2.5">
        {top3.map((cluster, i) => (
          <div key={cluster.id} className="relative">
            <button
              onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              className="w-full flex items-start gap-3 hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2 transition-colors text-left"
            >
              <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-800 font-medium truncate">{cluster.representative_title}</p>
                  <span className="shrink-0 text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{cluster.items.length}건</span>
                </div>
                {cluster.summary && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{cluster.summary}</p>
                )}
              </div>
              <svg className={`shrink-0 w-4 h-4 text-slate-400 mt-1 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedIdx === i && (
              <div className="absolute left-0 right-0 mt-1 ml-10 mr-2 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                {cluster.items.map((article, j) => (
                  <a key={j} href={article.link} target="_blank" rel="noopener noreferrer" className="group flex items-baseline gap-2 hover:bg-slate-50 rounded px-2 py-1.5 transition-colors">
                    <p className="text-xs text-slate-700 group-hover:text-blue-600 transition-colors flex-1 min-w-0 truncate">{article.title}</p>
                    {article.source && <span className="text-[10px] text-slate-400 shrink-0">{article.source}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ReportCard>
  );
}

export function SectionTopContent({ channelItems = [], newsClusters = [] }: { channelItems?: ChannelItem[]; newsClusters?: NewsCluster[] }) {
  // 채널별 그룹핑 (뉴스 제외, 커뮤니티만 묶음)
  const byChannel = new Map<string, ChannelItem[]>();
  for (const item of channelItems) {
    if (item.platform_id === 'naver_news') continue;
    const channel = PLATFORM_TO_CHANNEL[item.platform_id] ?? item.platform_id;
    if (!byChannel.has(channel)) byChannel.set(channel, []);
    byChannel.get(channel)!.push(item);
  }

  // 채널별 Top 3 선정
  const channels = CHANNEL_ORDER
    .map(ch => {
      const items = byChannel.get(ch.id) ?? [];
      const sorted = [...items].sort((a, b) => {
        if (ch.sortBy === 'impact_score') return (b.impact_score ?? 0) - (a.impact_score ?? 0);
        return (b.views ?? 0) - (a.views ?? 0);
      });
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
        <NewsClusterCard clusters={newsClusters} />
        {channels.map(ch => (
          <ReportCard key={ch.id}>
            <h4 className="text-sm font-semibold text-slate-700 mb-1">{ch.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{ch.description}</p>
            <div className="flex flex-col gap-2.5">
              {ch.items.map((item, i) => {
                const badge = PLATFORM_BADGES[item.platform_id];
                return (
                  <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2 transition-colors">
                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${badge.className}`}>{badge.label}</span>}
                        <p className="text-sm text-slate-800 font-medium truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                      </div>
                      {ch.sortBy === 'views' && item.views != null
                        ? <p className="text-xs text-slate-400 mt-0.5">조회수 {item.views.toLocaleString()}회</p>
                        : (item.summary || item.content) && <p className="text-xs text-slate-400 mt-0.5 truncate">{(item.summary || item.content || '').slice(0, 60)}</p>
                      }
                    </div>
                  </a>
                );
              })}
            </div>
          </ReportCard>
        ))}
      </div>
    </section>
  );
}
