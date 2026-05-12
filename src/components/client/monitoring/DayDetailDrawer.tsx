'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Newspaper, FileText, Youtube, MessageSquare } from 'lucide-react';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { useMonitoringDayItems } from '@/hooks/monitoring/useMonitoringQuery';
import type { ChannelItem, NewsClusterResponse } from '@/types/report';

type SentimentKey = 'all' | 'positive' | 'neutral' | 'negative';
type ChannelTabId = 'news' | 'blog' | 'youtube' | 'community';

interface DayDetailDrawerProps {
  workspaceId: string;
  /** YYYY-MM-DD KST. null 이면 닫힘 상태. */
  date: string | null;
  onClose: () => void;
}

const CHANNEL_TABS: { id: ChannelTabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'news', label: '뉴스', icon: Newspaper },
  { id: 'blog', label: '블로그', icon: FileText },
  { id: 'youtube', label: '유튜브', icon: Youtube },
  { id: 'community', label: '커뮤니티', icon: MessageSquare },
];

const SENTIMENT_TABS: { id: SentimentKey; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'positive', label: '긍정' },
  { id: 'neutral', label: '중립' },
  { id: 'negative', label: '부정' },
];

function formatKstDateLong(date: string): string {
  // 2026-05-12 → 5월 12일 (화) 형태
  const d = new Date(`${date}T00:00:00+09:00`);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][
    (new Date(d.getTime() + 9 * 60 * 60 * 1000).getUTCDay())
  ];
  const m = parseInt(date.slice(5, 7), 10);
  const day = parseInt(date.slice(8, 10), 10);
  return `${date.slice(0, 4)}년 ${m}월 ${day}일 (${weekday})`;
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const cfg =
    sentiment === 'positive'
      ? { bg: 'bg-emerald-50', text: 'text-emerald-600', label: '긍정' }
      : sentiment === 'negative'
        ? { bg: 'bg-red-50', text: 'text-red-600', label: '부정' }
        : { bg: 'bg-slate-100', text: 'text-slate-500', label: '중립' };
  return (
    <span
      className={`inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} shrink-0`}
    >
      {cfg.label}
    </span>
  );
}

function ChannelTabBar({
  value,
  onChange,
  counts,
}: {
  value: ChannelTabId;
  onChange: (id: ChannelTabId) => void;
  counts: Record<ChannelTabId, number>;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 px-5 pt-4 shrink-0">
      {CHANNEL_TABS.map((t) => {
        const active = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-colors cursor-pointer ${
              active
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            <span className="text-[11px] font-semibold tracking-[-0.005em]">
              {t.label} {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SentimentTabBar({
  value,
  onChange,
  counts,
}: {
  value: SentimentKey;
  onChange: (k: SentimentKey) => void;
  counts: Record<SentimentKey, number>;
}) {
  return (
    <div className="flex items-center gap-1 px-5 pt-3 shrink-0">
      {SENTIMENT_TABS.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`flex-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
              active
                ? 'bg-slate-100 border-slate-200 text-slate-900'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
          >
            {s.label} <span className="tabular-nums">{counts[s.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: NewsClusterResponse }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* 상단 — 감성/카운트/대표 제목/요약. 항상 노출. 클릭 영역 아님. */}
      <div className="px-3.5 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SentimentDot sentiment={cluster.sentiment ?? 'neutral'} />
          <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {cluster.items.length}건 묶음
          </span>
        </div>
        <p className="text-[13px] font-semibold text-slate-900 leading-relaxed mt-1.5">
          {cluster.representative_title}
        </p>
        {cluster.summary && (
          <p className="text-[12px] text-slate-500 leading-relaxed mt-1">{cluster.summary}</p>
        )}
      </div>

      {/* 토글 — 항상 보이는 상단(요약 포함)과 분리. 클릭 시 개별 기사 링크 펼침. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-2 flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-t border-slate-100 transition-colors cursor-pointer"
      >
        <span>{open ? '관련 기사 접기' : `관련 기사 ${cluster.items.length}건 보기`}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-2 flex flex-col">
          {cluster.items.map((it, i) => (
            <a
              key={i}
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2 py-1.5 hover:bg-white rounded transition-colors px-1.5"
            >
              <span className="text-[12px] text-slate-700 group-hover:text-blue-600 flex-1 min-w-0 truncate">
                {it.title}
              </span>
              {it.source && (
                <span className="text-[10px] text-slate-400 shrink-0">{it.source}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

type ItemDisplay = 'news' | 'blog' | 'youtube' | 'community';

function ItemMeta({ item, display }: { item: ChannelItem; display: ItemDisplay }) {
  // 채널별 메타 표시 규칙:
  //   blog       → impact_score 만 (조회수·블로그명 미노출)
  //   youtube    → 조회수만
  //   community  → 조회수 + (있으면) source
  //   news       → source(언론사) 우측 정렬
  if (display === 'blog') {
    if (item.impact_score == null) return null;
    return (
      <span className="text-[10.5px] text-slate-400 tabular-nums">
        영향력 {item.impact_score.toFixed(1)}
      </span>
    );
  }
  if (display === 'youtube') {
    if (item.views == null) return null;
    return (
      <span className="text-[10.5px] text-slate-400 tabular-nums">
        조회 {item.views.toLocaleString()}
      </span>
    );
  }
  if (display === 'community') {
    return (
      <>
        {item.views != null && (
          <span className="text-[10.5px] text-slate-400 tabular-nums">
            조회 {item.views.toLocaleString()}
          </span>
        )}
        {item.source && (
          <span className="text-[10.5px] text-slate-400 ml-auto truncate max-w-[140px]">
            {item.source}
          </span>
        )}
      </>
    );
  }
  // news
  return item.source ? (
    <span className="text-[10.5px] text-slate-400 ml-auto truncate max-w-[140px]">
      {item.source}
    </span>
  ) : null;
}

function ItemCard({ item, display }: { item: ChannelItem; display: ItemDisplay }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-slate-200 bg-white px-3.5 py-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <SentimentDot sentiment={item.sentiment} />
        <ItemMeta item={item} display={display} />
      </div>
      <p className="text-[13px] font-semibold text-slate-900 leading-relaxed mt-1.5">
        {item.title}
      </p>
      {(item.summary ?? item.content) && (
        <p className="text-[12px] text-slate-500 leading-relaxed mt-1 line-clamp-3">
          {item.summary ?? item.content}
        </p>
      )}
    </a>
  );
}

function filterBySentiment<T extends { sentiment: string }>(items: T[], s: SentimentKey): T[] {
  if (s === 'all') return items;
  return items.filter((it) => it.sentiment === s);
}

export function DayDetailDrawer({ workspaceId, date, onClose }: DayDetailDrawerProps) {
  const { data, isLoading, isError } = useMonitoringDayItems(workspaceId, date);
  const [channelTab, setChannelTab] = useState<ChannelTabId>('news');
  const [sentimentTab, setSentimentTab] = useState<SentimentKey>('all');

  const channelCounts: Record<ChannelTabId, number> = {
    news: data?.totals.byChannel.news ?? 0,
    blog: data?.totals.byChannel.blog ?? 0,
    youtube: data?.totals.byChannel.youtube ?? 0,
    community: data?.totals.byChannel.community ?? 0,
  };

  const sentimentCounts: Record<SentimentKey, number> = useMemo(() => {
    if (!data)
      return { all: 0, positive: 0, neutral: 0, negative: 0 };
    // 현재 채널 탭 한정 감성 카운트 (탭에 따라 동적으로 바뀜).
    const items: ChannelItem[] = (() => {
      if (channelTab === 'news') {
        // 클러스터 + 비클러스터 합산. 클러스터는 감성 라벨이 representative 라 그 값으로 계산.
        const clusterAsItems: { sentiment: string }[] = data.newsClusters.flatMap((c) =>
          c.items.map(() => ({ sentiment: c.sentiment ?? 'neutral' })),
        );
        return [
          ...clusterAsItems.map((c) => ({ ...c }) as ChannelItem),
          ...data.newsUnclustered,
        ];
      }
      return data[channelTab];
    })();
    return {
      all: items.length,
      positive: items.filter((i) => i.sentiment === 'positive').length,
      neutral: items.filter((i) => i.sentiment === 'neutral').length,
      negative: items.filter((i) => i.sentiment === 'negative').length,
    };
  }, [data, channelTab]);

  const totalsHeader = data
    ? `전체 ${data.totals.total.toLocaleString()}건 · 긍정 ${data.totals.bySentiment.positive} · 중립 ${data.totals.bySentiment.neutral} · 부정 ${data.totals.bySentiment.negative}`
    : '';

  return (
    <SideDrawer
      open={!!date}
      onClose={onClose}
      title={date ? formatKstDateLong(date) : ''}
      subtitle={totalsHeader || (isLoading ? '불러오는 중…' : '')}
      width={480}
    >
      {!date ? null : isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-slate-400">
          데이터를 불러오는 중입니다…
        </div>
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-red-500">
          데이터를 불러오지 못했습니다.
        </div>
      ) : !data || data.totals.total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-slate-400">
          이 날 수집된 데이터가 없습니다.
        </div>
      ) : (
        <>
          {/* 채널/감성 탭은 고정. 아래 리스트만 남은 높이 차지 + 내부 스크롤. */}
          <ChannelTabBar value={channelTab} onChange={setChannelTab} counts={channelCounts} />
          <SentimentTabBar value={sentimentTab} onChange={setSentimentTab} counts={sentimentCounts} />

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
            {channelTab === 'news' && (
              <NewsList
                clusters={data.newsClusters}
                unclustered={data.newsUnclustered}
                sentiment={sentimentTab}
              />
            )}
            {channelTab === 'blog' && (
              <SimpleList items={filterBySentiment(data.blog, sentimentTab)} display="blog" />
            )}
            {channelTab === 'youtube' && (
              <SimpleList items={filterBySentiment(data.youtube, sentimentTab)} display="youtube" />
            )}
            {channelTab === 'community' && (
              <SimpleList items={filterBySentiment(data.community, sentimentTab)} display="community" />
            )}
          </div>
        </>
      )}
    </SideDrawer>
  );
}

function NewsList({
  clusters,
  unclustered,
  sentiment,
}: {
  clusters: NewsClusterResponse[];
  unclustered: ChannelItem[];
  sentiment: SentimentKey;
}) {
  // 클러스터 sentiment 는 representative 감성. 필터링도 그 값 기준.
  const filteredClusters =
    sentiment === 'all'
      ? clusters
      : clusters.filter((c) => (c.sentiment ?? 'neutral') === sentiment);
  const sortedClusters = [...filteredClusters].sort((a, b) => b.items.length - a.items.length);
  const filteredUnclustered = filterBySentiment(unclustered, sentiment);

  if (sortedClusters.length === 0 && filteredUnclustered.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-slate-400">
        해당 조건의 뉴스가 없습니다.
      </div>
    );
  }

  // 묶음 보도 + 개별 보도를 하나의 wrapper 로 명시적으로 묶는다. (스크롤 컨테이너는 부모)
  return (
    <div className="flex flex-col gap-5">
      {sortedClusters.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-slate-400">
            묶음 보도 · {sortedClusters.length}
          </p>
          {sortedClusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </section>
      )}
      {filteredUnclustered.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-slate-400">
            개별 보도 · {filteredUnclustered.length}
          </p>
          {filteredUnclustered.map((item) => (
            <ItemCard key={item.id} item={item} display="news" />
          ))}
        </section>
      )}
    </div>
  );
}

function SimpleList({ items, display }: { items: ChannelItem[]; display: ItemDisplay }) {
  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-slate-400">
        해당 조건의 데이터가 없습니다.
      </div>
    );
  }
  // 채널별 정렬 우선순위:
  //   blog       → impact_score
  //   youtube    → views
  //   community  → views
  const sorted = [...items].sort((a, b) => {
    const pick = (it: ChannelItem) =>
      display === 'blog' ? (it.impact_score ?? 0) : (it.views ?? 0);
    const av = pick(a);
    const bv = pick(b);
    if (av !== bv) return bv - av;
    return (b.published_at ?? '').localeCompare(a.published_at ?? '');
  });
  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((item) => (
        <ItemCard key={item.id} item={item} display={display} />
      ))}
    </div>
  );
}
