'use client';

import { ResponsiveBar } from '@nivo/bar';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReportCard } from '@/components/report/ReportCard';
import { Badge, CountBadge } from '@/components/ui/Badge';
import type { ChannelStat, ChannelItem, NewsCluster } from '@/lib/api/reportApi';

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

const channelDescriptions: Record<string, string> = {
  '뉴스': '주요 포털 및 언론사 기사 수집',
  '블로그': '주요 포털 블로그 포스팅 수집',
  '유튜브': '영상 요약 기반 분석',
  '종토방': '투자자 의견 및 이슈 확산 게시물',
  '디시인사이드': '투자자 의견 및 이슈 확산 게시물',
};

function SentimentTag({ sentiment }: { sentiment: string }) {
  const config: Record<string, { label: string; className: string }> = {
    positive: { label: '긍정', className: 'bg-emerald-50 text-emerald-700' },
    neutral: { label: '중립', className: 'bg-slate-100 text-slate-600' },
    negative: { label: '부정', className: 'bg-red-50 text-red-700' },
  };
  const { label, className } = config[sentiment] ?? config.neutral;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}>{label}</span>
  );
}

const CHANNEL_SORT: Record<string, (a: ChannelItem, b: ChannelItem) => number> = {
  '블로그': (a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0),
  '유튜브': (a, b) => (b.views ?? 0) - (a.views ?? 0),
  '종토방': (a, b) => (b.views ?? 0) - (a.views ?? 0),
  '디시인사이드': (a, b) => (b.views ?? 0) - (a.views ?? 0),
};

const CHANNEL_MAX = 100;

const SENTIMENT_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'positive', label: '긍정' },
  { key: 'neutral', label: '중립' },
  { key: 'negative', label: '부정' },
] as const;

function ChannelAccordion({ name, total, trend, items }: { name: string; total: number; trend: string; items: ChannelItem[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const sortFn = CHANNEL_SORT[name];
  const sorted = sortFn ? [...items].sort(sortFn) : items;
  const filtered = filter === 'all' ? sorted : sorted.filter(i => i.sentiment === filter);
  const limited = filtered.slice(0, CHANNEL_MAX);

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer text-left ${open ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center justify-between flex-1">
          <div>
            <span className="text-sm font-semibold text-slate-700">{name}</span>
            <span className="text-xs text-slate-400 ml-2">{channelDescriptions[name] ?? ''}</span>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <CountBadge count={total} label="수집" />
            <Badge variant={trend.includes('긍정') ? 'green' : 'red'}>{trend}</Badge>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-50 px-4 py-2">
          <div className="flex gap-1.5 mb-3 mt-1">
            {SENTIMENT_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  filter === f.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-slate-50">
            {limited.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate transition-colors"
                    >
                      {item.title}
                    </a>
                    {item.source && <span className="text-[10px] text-slate-400 shrink-0">{item.source}</span>}
                  </div>
                  {(item.summary || item.content) && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {(item.summary || item.content || '').length > 60
                        ? (item.summary || item.content || '').slice(0, 60) + '…'
                        : (item.summary || item.content)}
                    </p>
                  )}
                </div>
                <SentimentTag sentiment={item.sentiment} />
              </li>
            ))}
          </ul>
          {filtered.length > CHANNEL_MAX && (
            <p className="text-xs text-slate-400 text-center py-2">최대 {CHANNEL_MAX}건까지 표시됩니다</p>
          )}
        </div>
      )}
    </div>
  );
}

function ClusterItem({ cluster }: { cluster: NewsCluster }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SentimentTag sentiment={cluster.sentiment ?? 'neutral'} />
          <span className="text-sm text-slate-700 truncate">{cluster.representative_title}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{cluster.items.length}건</span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
      </button>
      {cluster.summary && (
        <p className="text-xs text-slate-400 pl-1 pb-1">{cluster.summary}</p>
      )}
      {open && (
        <ul className="pl-4 pb-2">
          {cluster.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 py-1">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-blue-600 hover:underline truncate transition-colors">
                {item.title}
              </a>
              <span className="text-[10px] text-slate-400 shrink-0">{item.source}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewsClusterAccordion({ total, trend, clusters, unclustered }: { total: number; trend: string; clusters: NewsCluster[]; unclustered: ChannelItem[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const sortedClusters = [...clusters].sort((a, b) => b.items.length - a.items.length);
  const filteredClusters = filter === 'all'
    ? sortedClusters
    : sortedClusters.filter(c => c.sentiment === filter);
  const filteredUnclustered = filter === 'all'
    ? unclustered
    : unclustered.filter(i => i.sentiment === filter);

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer text-left ${open ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center justify-between flex-1">
          <div>
            <span className="text-sm font-semibold text-slate-700">뉴스</span>
            <span className="text-xs text-slate-400 ml-2">{channelDescriptions['뉴스']}</span>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <CountBadge count={total} label="수집" />
            <Badge variant={trend.includes('긍정') ? 'green' : 'red'}>{trend}</Badge>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-50 px-4 py-2">
          <div className="flex gap-1.5 mb-3 mt-1">
            {SENTIMENT_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  filter === f.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filteredClusters.map((cluster) => (
            <ClusterItem key={cluster.id} cluster={cluster} />
          ))}
          {filteredUnclustered.length > 0 && (
            <>
              <div className="border-t border-slate-100 my-2" />
              <p className="text-[10px] text-slate-400 mb-1">미분류 기사</p>
              {filteredUnclustered.map((item, i) => (
                <div key={i} className="py-1.5">
                  <div className="flex items-center gap-2">
                    <SentimentTag sentiment={item.sentiment} />
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 hover:text-blue-600 hover:underline truncate transition-colors">
                      {item.title}
                    </a>
                    {item.source && <span className="text-[10px] text-slate-400 shrink-0">{item.source}</span>}
                  </div>
                  {item.summary && (
                    <p className="text-[11px] text-slate-400 mt-0.5 pl-1 truncate">{item.summary}</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function SectionSentimentDetail({ pdfMode = false, channelStats = [], channelItems = [], newsClusters = [] }: {
  pdfMode?: boolean;
  channelStats?: ChannelStat[];
  channelItems?: ChannelItem[];
  newsClusters?: NewsCluster[];
}) {
  // channelStats → 바 차트 데이터
  const sentimentData = channelStats.map(ch => ({
    channel: ch.label,
    긍정: ch.positive,
    중립: ch.neutral,
    부정: ch.negative,
  }));

  // channelItems → 채널별 그룹핑
  const itemsByChannel = new Map<string, ChannelItem[]>();
  for (const item of channelItems) {
    const label = PLATFORM_LABELS[item.platform_id] ?? item.platform_id;
    if (!itemsByChannel.has(label)) itemsByChannel.set(label, []);
    itemsByChannel.get(label)!.push(item);
  }

  const totalPositive = sentimentData.reduce((s, d) => s + d.긍정, 0);
  const totalNeutral = sentimentData.reduce((s, d) => s + d.중립, 0);
  const totalNegative = sentimentData.reduce((s, d) => s + d.부정, 0);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">온라인 평판 종합</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* 긍정/중립/부정 비율 차트 */}
      <ReportCard
        title="채널별 긍정·중립·부정 여론 비중"
        description="채널별 감정 분포를 100% 누적 막대로 비교하여 여론 구조를 직관적으로 보여줍니다."
      >
        <div className="flex items-stretch gap-3">
          <div className="shrink-0 w-44 flex flex-col justify-evenly pr-3 border-r border-slate-100 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center gap-1.5">
              <span className="text-xs text-emerald-600">긍정적 평판</span>
              <span className="text-2xl font-bold text-emerald-600">{totalPositive.toLocaleString()}개</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-500">중립적 평판</span>
              <span className="text-2xl font-bold text-slate-600">{totalNeutral.toLocaleString()}개</span>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center gap-1.5">
              <span className="text-xs text-red-500">부정적 평판</span>
              <span className="text-2xl font-bold text-red-500">{totalNegative.toLocaleString()}개</span>
            </div>
          </div>
          <div className={`flex-1 ${pdfMode ? "h-48" : "h-64"}`}>
            <ResponsiveBar
              data={sentimentData.map((d) => {
                const total = d.긍정 + d.중립 + d.부정;
                return {
                  channel: d.channel,
                  긍정: total > 0 ? Math.round((d.긍정 / total) * 100) : 0,
                  중립: total > 0 ? Math.round((d.중립 / total) * 100) : 0,
                  부정: total > 0 ? Math.round((d.부정 / total) * 100) : 0,
                };
              })}
              keys={['긍정', '중립', '부정']}
              indexBy="channel"
              layout="vertical"
              margin={{ top: 20, right: 10, bottom: 20, left: 35 }}
              padding={0.65}
              colors={['#34d399', '#cbd5e1', '#f87171']}
              borderRadius={3}
              axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: [0, 20, 40, 60, 80, 100], format: (v) => `${v}%` }}
              axisBottom={{ tickSize: 0, tickPadding: 8 }}
              valueScale={{ type: 'linear', min: 0, max: 100 }}
              enableGridX={false}
              enableGridY={true}
              gridYValues={[0, 20, 40, 60, 80, 100]}
              enableLabel={false}
              theme={{
                axis: { ticks: { text: { fontSize: 11, fill: '#94a3b8' } } },
                grid: { line: { stroke: '#f1f5f9' } },
              }}
              tooltip={({ indexValue }) => {
                const raw = sentimentData.find(d => d.channel === indexValue);
                if (!raw) return null;
                const total = raw.긍정 + raw.중립 + raw.부정;
                return (
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-md text-xs min-w-[160px]">
                    <p className="font-semibold text-slate-700 mb-1">{indexValue} <span className="font-normal text-slate-400">총 {total.toLocaleString()}건</span></p>
                    <p className="text-emerald-600">긍정: {total > 0 ? Math.round(raw.긍정 / total * 100) : 0}% ({raw.긍정.toLocaleString()}건)</p>
                    <p className="text-slate-500">중립: {total > 0 ? Math.round(raw.중립 / total * 100) : 0}% ({raw.중립.toLocaleString()}건)</p>
                    <p className="text-red-500">부정: {total > 0 ? Math.round(raw.부정 / total * 100) : 0}% ({raw.부정.toLocaleString()}건)</p>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </ReportCard>

      {/* 채널별 수집 데이터 상세 */}
      <ReportCard
        title="채널별 수집 데이터 상세 보기"
        description="각 채널명을 클릭하면 접고 펼치는 방식으로 수집된 세부 콘텐츠 목록을 확인할 수 있습니다."
      >
        <div className="flex flex-col gap-2">
          {channelStats.map(ch => {
            const trend = ch.positive >= ch.negative ? '긍정 우세' : '부정 우세';
            if (ch.id === 'naver_news') {
              const unclustered = (itemsByChannel.get('뉴스') ?? []).filter(i => !i.cluster_id);
              return <NewsClusterAccordion key={ch.id} total={ch.value} trend={trend} clusters={newsClusters} unclustered={unclustered} />;
            }
            const items = itemsByChannel.get(ch.label) ?? [];
            return <ChannelAccordion key={ch.id} name={ch.label} total={ch.value} trend={trend} items={items} />;
          })}
        </div>
      </ReportCard>
    </section>
  );
}
