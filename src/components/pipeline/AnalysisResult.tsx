'use client';

import { useMemo, useState } from 'react';
import { PLATFORM_CATEGORIES, CATEGORY_LABELS } from '@/constants/platforms';
import { ChevronIcon } from '@/components/ui/ChevronIcon';
import { AnalysisCharts } from '@/components/pipeline/AnalysisCharts';
import { useToggleSet } from '@/hooks/useToggleSet';
import type { CrawlItem, Cluster, CommunityItem, SnsItem } from '@/types/news';
import type { PlatformAnalysis, AnalysisArticle } from '@/types/pipeline';
import { calculateSir } from '@/utils/sir';
import { PLATFORMS } from '@/constants/platforms';
import { Eye } from 'lucide-react';

interface AnalysisResultProps {
  clusters: Cluster[];
  standaloneItems: CrawlItem[];
  crawlItems: CrawlItem[];
  communityItems: CommunityItem[];
  snsItems: SnsItem[];
}

function SentimentTag({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const config = {
    positive: { label: '긍정', className: 'bg-green-50 text-green-700' },
    neutral: { label: '중립', className: 'bg-slate-100 text-slate-600' },
    negative: { label: '부정', className: 'bg-red-50 text-red-700' },
  };
  const { label, className } = config[sentiment];
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${className}`}>{label}</span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-green-50 text-green-700'
      : score >= 50
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-red-50 text-red-700';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

function buildAnalysisData(crawlItems: CrawlItem[], communityItems: CommunityItem[], snsItems: SnsItem[]): PlatformAnalysis[] {
  const result: PlatformAnalysis[] = [];

  // 뉴스
  const newsRelevant = crawlItems.filter((i) => i.sentiment);
  if (newsRelevant.length > 0) {
    const total = newsRelevant.length;
    result.push({
      platformId: 'news',
      platformLabel: '뉴스',
      category: 'news',
      sirScore: calculateSir(newsRelevant),
      positive: (newsRelevant.filter((i) => i.sentiment === 'positive').length / total) * 100,
      neutral: (newsRelevant.filter((i) => i.sentiment === 'neutral').length / total) * 100,
      negative: (newsRelevant.filter((i) => i.sentiment === 'negative').length / total) * 100,
      articles: [],
      flagged: [],
    });
  }

  // 커뮤니티 (플랫폼별)
  const communityByPlatform = new Map<string, CommunityItem[]>();
  for (const item of communityItems) {
    if (!item.sentiment) continue;
    const list = communityByPlatform.get(item.platform_id) ?? [];
    list.push(item);
    communityByPlatform.set(item.platform_id, list);
  }

  for (const [platformId, items] of communityByPlatform) {
    const total = items.length;
    const platform = PLATFORMS.find(p => p.id === platformId);
    result.push({
      platformId,
      platformLabel: platform?.label ?? platformId,
      category: platform?.category ?? 'community',
      sirScore: calculateSir(items.map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment }))),
      positive: (items.filter((i) => i.sentiment === 'positive').length / total) * 100,
      neutral: (items.filter((i) => i.sentiment === 'neutral').length / total) * 100,
      negative: (items.filter((i) => i.sentiment === 'negative').length / total) * 100,
      articles: [],
      flagged: [],
    });
  }

  // SNS (플랫폼별)
  const snsByPlatform = new Map<string, SnsItem[]>();
  for (const item of snsItems) {
    if (!item.sentiment) continue;
    const list = snsByPlatform.get(item.platform_id) ?? [];
    list.push(item);
    snsByPlatform.set(item.platform_id, list);
  }

  for (const [platformId, items] of snsByPlatform) {
    const total = items.length;
    const platform = PLATFORMS.find(p => p.id === platformId);
    result.push({
      platformId,
      platformLabel: platform?.label ?? platformId,
      category: platform?.category ?? 'sns',
      sirScore: calculateSir(items.map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment }))),
      positive: (items.filter((i) => i.sentiment === 'positive').length / total) * 100,
      neutral: (items.filter((i) => i.sentiment === 'neutral').length / total) * 100,
      negative: (items.filter((i) => i.sentiment === 'negative').length / total) * 100,
      articles: [],
      flagged: [],
    });
  }

  return result;
}

export function AnalysisResult({ clusters, standaloneItems, crawlItems, communityItems, snsItems }: AnalysisResultProps) {
  const categories = useToggleSet();
  const platforms = useToggleSet();
  const clusterToggles = useToggleSet();
  const [sentimentFilter, setSentimentFilter] = useState<Record<string, string | null>>({});

  const analysisData = useMemo(
    () => buildAnalysisData(crawlItems, communityItems, snsItems),
    [crawlItems, communityItems, snsItems]
  );

  const clusterItemsMap = useMemo(() => {
    const map = new Map<string, CrawlItem[]>();
    for (const item of crawlItems) {
      if (!item.cluster_id) continue;
      const list = map.get(item.cluster_id) ?? [];
      list.push(item);
      map.set(item.cluster_id, list);
    }
    return map;
  }, [crawlItems]);

  if (analysisData.length === 0) {
    return <p className="text-sm text-slate-400">분석 데이터가 없습니다</p>;
  }

  const allSirItems = [
    ...crawlItems.filter(i => i.sentiment).map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
    ...communityItems.filter(i => i.sentiment).map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
    ...snsItems.filter(i => i.sentiment).map(i => ({ platform_id: i.platform_id, sentiment: i.sentiment })),
  ];
  const totalScore = calculateSir(allSirItems);

  return (
    <div className="flex flex-col gap-4">
      {/* Total SIR */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">감성 분석 완료</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">종합 SIR 지수</span>
          <span
            className={`text-lg font-bold ${totalScore >= 70 ? 'text-green-600' : totalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
          >
            {totalScore}
          </span>
        </div>
      </div>

      {/* Charts */}
      <AnalysisCharts analysisData={analysisData} />

      {/* Categories */}
      {PLATFORM_CATEGORIES.map((category) => {
        const items = analysisData.filter((p) => p.category === category);
        if (items.length === 0) return null;

        const categoryScore = parseFloat(
          (items.reduce((sum, p) => sum + p.sirScore, 0) / items.length).toFixed(1)
        );
        const isCategoryOpen = categories.has(category);

        return (
          <div key={category} className="border border-slate-100 rounded-xl overflow-visible">
            <button
              onClick={() => categories.toggle(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{CATEGORY_LABELS[category] ?? category}</span>
                <ScoreBadge score={categoryScore} />
                <span className="relative group" onClick={(e) => e.stopPropagation()}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-slate-400 cursor-help">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="5" r="0.75" fill="currentColor" />
                  </svg>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-xs text-white bg-slate-800 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    같은 주제의 기사를 묶어놓았어요. 클릭하면 개별 기사를 확인할 수 있습니다.
                  </span>
                </span>
              </div>
              <ChevronIcon open={isCategoryOpen} />
            </button>

            {isCategoryOpen && (
              <div className="border-t border-slate-100">
                {items.map((platform) => {
                  const isPlatformOpen = platforms.has(platform.platformId);

                  return (
                    <div key={platform.platformId} className="border-t border-slate-50">
                      <button
                        onClick={() => platforms.toggle(platform.platformId)}
                        className="w-full flex items-center justify-between px-4 py-2.5 pl-6 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{platform.platformLabel}</span>
                          <ScoreBadge score={platform.sirScore} />
                          <span className="text-xs text-slate-400">
                            {platform.category === 'news'
                              ? `${crawlItems.filter(i => i.sentiment).length}건`
                              : platform.category === 'community'
                                ? `${communityItems.filter(i => i.platform_id === platform.platformId && i.sentiment).length}건`
                                : `${snsItems.filter(i => i.platform_id === platform.platformId && i.sentiment).length}건`
                            }
                          </span>
                        </div>
                        <ChevronIcon open={isPlatformOpen} />
                      </button>

                      {isPlatformOpen && (() => {
                        const filter = sentimentFilter[platform.platformId] ?? null;
                        const setFilter = (v: string | null) =>
                          setSentimentFilter((prev) => ({ ...prev, [platform.platformId]: v }));

                        return (
                        <div className="px-4 pl-6 pb-3 flex flex-col gap-2">
                          {/* 감성 필터 */}
                          <div className="flex items-center gap-1.5 py-1">
                            {([
                              { key: null, label: '전체' },
                              { key: 'positive', label: '긍정' },
                              { key: 'neutral', label: '중립' },
                              { key: 'negative', label: '부정' },
                            ] as const).map(({ key, label }) => (
                              <button
                                key={label}
                                onClick={() => setFilter(key)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                                  filter === key
                                    ? 'bg-slate-700 text-white border-slate-700'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {platform.category === 'news' ? (
                            <>
                              {/* 뉴스: 클러스터 + 단독 기사 */}
                              {(filter ? clusters.filter(c => c.sentiment === filter) : clusters).map((cluster) => {
                                const isClusterOpen = clusterToggles.has(cluster.id);
                                const items = clusterItemsMap.get(cluster.id) ?? [];
                                return (
                                  <div key={cluster.id} className="rounded-lg border border-slate-100 overflow-hidden">
                                    <button
                                      onClick={() => clusterToggles.toggle(cluster.id)}
                                      className="w-full flex flex-col gap-1 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        {cluster.sentiment && <SentimentTag sentiment={cluster.sentiment} />}
                                        <span className="text-sm text-slate-700 truncate flex-1">{cluster.representative_title}</span>
                                        <span className="text-xs text-slate-400 shrink-0">{cluster.article_count}건</span>
                                        <ChevronIcon open={isClusterOpen} />
                                      </div>
                                      {cluster.summary && <p className="text-xs text-slate-500 pl-1 pr-8">{cluster.summary}</p>}
                                    </button>
                                    {isClusterOpen && (
                                      <div className="border-t border-slate-50">
                                        <ul className="divide-y divide-slate-50">
                                          {items.map((item) => (
                                            <li key={item.id} className="flex items-center gap-2 px-3 py-2 pl-5 min-w-0">
                                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate flex-1 transition-colors">{item.title}</a>
                                              {item.source && <span className="text-xs text-slate-400 shrink-0">{item.source}</span>}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <ul className="flex flex-col gap-1">
                                {standaloneItems
                                  .filter(item => item.sentiment && (!filter || item.sentiment === filter))
                                  .map((item) => (
                                    <li key={item.id} className="flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-w-0">
                                      <div className="flex items-center gap-2">
                                        <SentimentTag sentiment={item.sentiment!} />
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate flex-1 transition-colors">{item.title}</a>
                                        {item.source && <span className="text-xs text-slate-400 shrink-0">{item.source}</span>}
                                      </div>
                                      {item.summary && <p className="text-xs text-slate-500 pl-9 pr-8">{item.summary}</p>}
                                    </li>
                                  ))}
                              </ul>
                            </>
                          ) : platform.category === 'community' ? (
                            <>
                              {/* 커뮤니티: 게시글 목록 (최신순) */}
                              <ul className="flex flex-col gap-1">
                                {communityItems
                                  .filter(item => item.platform_id === platform.platformId && item.sentiment && (!filter || item.sentiment === filter))
                                  .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
                                  .map((item) => {
                                    const dateStr = item.published_at ? item.published_at.slice(0, 10).replace(/\./g, '-') : '';
                                    const shortDate = dateStr ? `${dateStr.slice(5)}` : '';
                                    return (
                                    <li key={item.id} className="flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-w-0">
                                      <div className="flex items-center gap-2">
                                        <SentimentTag sentiment={item.sentiment!} />
                                        {item.critical_type && (
                                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 shrink-0">
                                            {item.critical_type === 'market_manipulation' ? '시세조종'
                                              : item.critical_type === 'rumor' ? '루머'
                                              : item.critical_type === 'legal_risk' ? '법적위험'
                                              : item.critical_type === 'threat' ? '위협' : item.critical_type}
                                          </span>
                                        )}
                                        {item.is_cleanbot && (
                                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 shrink-0">클린봇</span>
                                        )}
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate flex-1 transition-colors">{item.title}</a>
                                        {item.views > 0 && <span className="text-xs text-slate-400 shrink-0 flex items-center gap-0.5"><Eye size={12} />{item.views}</span>}
                                        <span className="text-xs text-slate-300 shrink-0 w-12 text-right">{shortDate}</span>
                                      </div>
                                    </li>
                                    );
                                  })}
                              </ul>
                            </>
                          ) : (
                            <>
                              {/* SNS: 블로그 등 게시글 목록 (최신순) */}
                              <ul className="flex flex-col gap-1">
                                {snsItems
                                  .filter(item => item.platform_id === platform.platformId && item.sentiment && (!filter || item.sentiment === filter))
                                  .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
                                  .map((item) => {
                                    const shortDate = item.published_at ? `${item.published_at.slice(5)}` : '';
                                    const postTypeLabel = item.post_type === 'analysis' ? '분석' : item.post_type === 'opinion' ? '의견' : null;
                                    return (
                                    <li key={item.id} className="flex flex-col gap-1 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors min-w-0">
                                      <div className="flex items-center gap-2">
                                        <SentimentTag sentiment={item.sentiment!} />
                                        {postTypeLabel && (
                                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 shrink-0">{postTypeLabel}</span>
                                        )}
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate flex-1 transition-colors">{item.title}</a>
                                        {item.author && <span className="text-xs text-slate-400 shrink-0">{item.author}</span>}
                                        <span className="text-xs text-slate-300 shrink-0 w-12 text-right">{shortDate}</span>
                                      </div>
                                    </li>
                                    );
                                  })}
                              </ul>
                            </>
                          )}
                        </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
