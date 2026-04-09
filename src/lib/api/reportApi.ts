import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ── 주간 총평 ──

export interface SummarySubsection {
  title: string;
  points: string[];
}

export interface SummarySection {
  summary: string;
  subsections: SummarySubsection[];
}

export async function getWeeklySummary(workspaceId: string, reportId?: string): Promise<SummarySection[]> {
  let query = supabase
    .from('session_strategies')
    .select('all_strategy')
    .eq('workspace_id', workspaceId)
    .is('category', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (reportId) {
    query = query.eq('report_id', reportId);
  }

  const { data } = await query;
  return data?.[0]?.all_strategy ?? [];
}

// ── SIR & 주가 차트 ──

export interface SirStockPoint {
  date: string;
  fullDate: string;
  sir: number | null;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  close_price: number | null;
}

export async function getSirStockData(workspaceId: string): Promise<SirStockPoint[]> {
  const [snapshotsRes, stockRes] = await Promise.all([
    supabase.from('daily_snapshots').select('date, sir_score').eq('workspace_id', workspaceId).order('date'),
    supabase.from('stock_prices').select('date, open_price, high_price, low_price, close_price').eq('workspace_id', workspaceId).order('date'),
  ]);

  const sirMap = new Map<string, number>();
  for (const s of snapshotsRes.data ?? []) {
    if (s.sir_score != null) sirMap.set(s.date, s.sir_score);
  }

  const stockMap = new Map<string, { open_price: number; high_price: number; low_price: number; close_price: number }>();
  for (const s of stockRes.data ?? []) {
    stockMap.set(s.date, { open_price: s.open_price, high_price: s.high_price, low_price: s.low_price, close_price: s.close_price });
  }

  const allDates = new Set([...sirMap.keys(), ...stockMap.keys()]);
  const sorted = Array.from(allDates).sort();
  const sirValues = sorted.map((date) => sirMap.get(date) ?? null);

  // 3일 이동평균
  const sirMA = sirValues.map((_, i) => {
    const window = sirValues.slice(Math.max(0, i - 2), i + 1).filter((v): v is number => v != null);
    return window.length ? Math.round(window.reduce((a, b) => a + b, 0) / window.length * 10) / 10 : null;
  });

  return sorted.map((date, i) => ({
    date: date.slice(5),
    fullDate: date,
    sir: sirMA[i],
    open_price: stockMap.get(date)?.open_price ?? null,
    high_price: stockMap.get(date)?.high_price ?? null,
    low_price: stockMap.get(date)?.low_price ?? null,
    close_price: stockMap.get(date)?.close_price ?? null,
  }));
}

// ── SIR 순위 ──

export type TierItem = {
  [key: string]: string | number;
  tier: string;
  count: number;
  isCurrent: number;
};

export interface SirRanking {
  tiers: TierItem[];
  rank: number;
  total: number;
  average: number;
}

const TIER_RANGES = [
  { label: '상위 1구간 (900~1000)', min: 900, max: 1001 },
  { label: '상위 2구간 (800~899)', min: 800, max: 900 },
  { label: '상위 3구간 (700~799)', min: 700, max: 800 },
  { label: '중위 1구간 (600~699)', min: 600, max: 700 },
  { label: '중위 2구간 (500~599)', min: 500, max: 600 },
  { label: '중위 3구간 (400~499)', min: 400, max: 500 },
  { label: '하위 1구간 (300~399)', min: 300, max: 400 },
  { label: '하위 2구간 (200~299)', min: 200, max: 300 },
  { label: '하위 3구간 (100~199)', min: 100, max: 200 },
  { label: '하위 4구간 (0~99)', min: 0, max: 100 },
];

export async function getSirRanking(workspaceId: string): Promise<SirRanking> {
  // 각 워크스페이스의 최신 report sir_score 조회
  const { data: reports } = await supabase
    .from('reports')
    .select('workspace_id, sir_score')
    .not('sir_score', 'is', null)
    .order('created_at', { ascending: false });

  // 워크스페이스별 최신 report sir_score만 추출
  const latestByWs = new Map<string, number>();
  for (const r of reports ?? []) {
    if (!latestByWs.has(r.workspace_id)) {
      latestByWs.set(r.workspace_id, r.sir_score);
    }
  }

  const all = Array.from(latestByWs.entries()).map(([id, score]) => ({ id, sir_score: score }));
  const myScore = latestByWs.get(workspaceId) ?? 0;

  const myTierIdx = TIER_RANGES.findIndex(t => myScore >= t.min && myScore < t.max);
  const tiers = TIER_RANGES.map((t, i) => ({
    tier: t.label,
    count: all.filter(w => w.sir_score >= t.min && w.sir_score < t.max).length,
    isCurrent: i === myTierIdx ? 1 : 0,
  }));

  const sorted = all.map(w => w.sir_score).sort((a, b) => b - a);
  const rank = sorted.indexOf(myScore) + 1;
  const average = all.length ? Math.round(all.reduce((s, w) => s + w.sir_score, 0) / all.length) : 0;

  return { tiers, rank, total: all.length, average };
}

// ── 채널별 통계 ──

export interface ChannelStat {
  id: string;
  label: string;
  value: number;
  color: string;
  sir: number;
  positive: number;
  negative: number;
  neutral: number;
}

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  naver_news: 'news',
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

const CHANNEL_CONFIG: { id: string; label: string; color: string }[] = [
  { id: 'news', label: '뉴스', color: '#6366f1' },
  { id: 'blog', label: '블로그', color: '#38bdf8' },
  { id: 'youtube', label: '유튜브', color: '#f43f5e' },
  { id: 'community', label: '커뮤니티', color: '#22c55e' },
];

/** channelItems + sessions 캐시에서 channelStats를 파생 (카테고리 기반) */
export async function getChannelStats(workspaceId: string, channelItems: ChannelItem[]): Promise<ChannelStat[]> {
  // 채널별 감성 집계
  const byChannel = new Map<string, { positive: number; negative: number; neutral: number }>();
  for (const item of channelItems) {
    const channel = PLATFORM_TO_CHANNEL[item.platform_id] ?? item.platform_id;
    if (!byChannel.has(channel)) {
      byChannel.set(channel, { positive: 0, negative: 0, neutral: 0 });
    }
    const counts = byChannel.get(channel)!;
    if (item.sentiment === 'positive') counts.positive++;
    else if (item.sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  }

  // 세션별 SIR → 카테고리별 평균
  const { data: sessions } = await supabase
    .from('sessions')
    .select('platform_id, sir_score')
    .eq('workspace_id', workspaceId)
    .eq('status', 'done')
    .order('created_at', { ascending: false });

  const sirByChannel = new Map<string, number[]>();
  for (const s of sessions ?? []) {
    if (s.sir_score == null) continue;
    const channel = PLATFORM_TO_CHANNEL[s.platform_id] ?? s.platform_id;
    if (!sirByChannel.has(channel)) sirByChannel.set(channel, []);
    sirByChannel.get(channel)!.push(s.sir_score);
  }

  return CHANNEL_CONFIG
    .map(c => {
      const counts = byChannel.get(c.id) ?? { positive: 0, negative: 0, neutral: 0 };
      const sirScores = sirByChannel.get(c.id) ?? [];
      const avgSir = sirScores.length > 0 ? Math.round(sirScores.reduce((a, b) => a + b, 0) / sirScores.length) : 500;
      return {
        id: c.id,
        label: c.label,
        value: counts.positive + counts.negative + counts.neutral,
        color: c.color,
        sir: avgSir,
        positive: counts.positive,
        negative: counts.negative,
        neutral: counts.neutral,
      };
    });
}

// ── 뉴스 클러스터 ──

export interface NewsCluster {
  id: string;
  representative_title: string;
  sentiment: string | null;
  summary: string | null;
  items: { title: string; source: string; link: string }[];
}

export async function getNewsClusters(workspaceId: string): Promise<NewsCluster[]> {
  const [clusterRes, itemsRes] = await Promise.all([
    supabase.from('news_clusters')
      .select('id, representative_title, sentiment, summary')
      .eq('workspace_id', workspaceId)
      .eq('is_relevant', true)
      .order('created_at', { ascending: false }),
    supabase.from('news_items')
      .select('cluster_id, title, source, link')
      .eq('workspace_id', workspaceId)
      .not('cluster_id', 'is', null),
  ]);

  const itemsByCluster = new Map<string, { title: string; source: string; link: string }[]>();
  for (const item of itemsRes.data ?? []) {
    if (!itemsByCluster.has(item.cluster_id)) itemsByCluster.set(item.cluster_id, []);
    itemsByCluster.get(item.cluster_id)!.push({ title: item.title, source: item.source ?? '', link: item.link ?? '#' });
  }

  return (clusterRes.data ?? []).map(c => ({
    id: c.id,
    representative_title: c.representative_title,
    sentiment: c.sentiment,
    summary: c.summary,
    items: itemsByCluster.get(c.id) ?? [],
  }));
}

// ── 채널별 아이템 (감성 상세 + 상위 콘텐츠 공유) ──

export interface ChannelItem {
  id: string;
  platform_id: string;
  title: string;
  content: string | null;
  summary: string | null;
  sentiment: string;
  link: string;
  source: string | null;
  views: number | null;
  published_at: string | null;
  critical_type: string | null;
  cluster_id: string | null;
  impact_score: number | null;
}

export async function getChannelItems(workspaceId: string): Promise<ChannelItem[]> {
  const [newsRes, communityRes, snsRes] = await Promise.all([
    supabase.from('news_items')
      .select('id, platform_id, title, summary, sentiment, link, source, published_at, critical_type, cluster_id')
      .eq('workspace_id', workspaceId).eq('is_relevant', true),
    supabase.from('community_items')
      .select('id, platform_id, title, content, sentiment, link, views, published_at, critical_type')
      .eq('workspace_id', workspaceId).eq('is_relevant', true),
    supabase.from('sns_items')
      .select('id, platform_id, title, content, summary, sentiment, link, author, views, published_at, critical_type, impact_score')
      .eq('workspace_id', workspaceId).eq('is_relevant', true),
  ]);

  const normalize = (rows: any[], defaults: Partial<ChannelItem> = {}): ChannelItem[] =>
    (rows ?? []).map(r => ({
      id: r.id,
      platform_id: r.platform_id,
      title: r.title ?? '',
      content: r.content ?? null,
      summary: r.summary ?? null,
      sentiment: r.sentiment ?? 'neutral',
      link: r.link ?? '#',
      source: r.source ?? r.author ?? null,
      views: r.views ?? null,
      published_at: r.published_at ?? null,
      critical_type: r.critical_type ?? null,
      cluster_id: r.cluster_id ?? null,
      impact_score: r.impact_score ?? null,
      ...defaults,
    }));

  return [
    ...normalize(newsRes.data ?? []),
    ...normalize(communityRes.data ?? []),
    ...normalize(snsRes.data ?? []),
  ];
}

// ── 리스크 콘텐츠 ──

export interface RiskItem {
  id: string;
  platform_id: string;
  title: string;
  link: string;
  critical_type: string;
  critical_reason: string | null;
  published_at: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

export async function getRiskItems(workspaceId: string): Promise<RiskItem[]> {
  const [newsRes, communityRes, snsRes] = await Promise.all([
    supabase.from('news_items')
      .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
      .eq('workspace_id', workspaceId).not('critical_type', 'is', null),
    supabase.from('community_items')
      .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
      .eq('workspace_id', workspaceId).not('critical_type', 'is', null),
    supabase.from('sns_items')
      .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
      .eq('workspace_id', workspaceId).not('critical_type', 'is', null),
  ]);

  return [...(newsRes.data ?? []), ...(communityRes.data ?? []), ...(snsRes.data ?? [])]
    .map(r => ({
      id: r.id,
      platform_id: r.platform_id,
      title: r.title ?? '',
      link: r.link ?? '#',
      critical_type: r.critical_type,
      critical_reason: r.critical_reason ?? null,
      published_at: r.published_at ?? null,
    }))
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
}

// ── 대응 전략 ──

export interface StrategyAction {
  platform: string;
  topic: string;
  contents: string[];
}

export interface StrategyData {
  background: {
    summary: string;
    points: string[];
  };
  proposal: {
    summary: string;
    actions: StrategyAction[];
  };
  effect: {
    summary: string;
    points: string[];
  };
}

export interface StrategyGroup {
  category: string;
  label: string;
  strategy: StrategyData;
}

const CATEGORY_LABELS: Record<string, string> = {
  news: '뉴스 채널 대응 전략',
  sns: 'SNS 채널 대응 전략',
  community: '커뮤니티 채널 대응 전략',
};

const CATEGORY_ORDER = ['news', 'sns', 'community'];

export async function getStrategies(workspaceId: string, reportId?: string): Promise<StrategyGroup[]> {
  let query = supabase
    .from('session_strategies')
    .select('category, strategy')
    .eq('workspace_id', workspaceId)
    .not('category', 'is', null)
    .order('created_at', { ascending: false });

  if (reportId) {
    query = query.eq('report_id', reportId);
  }

  const { data } = await query;

  const items = (data ?? []).map((row) => ({
    category: row.category,
    label: CATEGORY_LABELS[row.category] ?? row.category,
    strategy: row.strategy ?? { background: { summary: '', points: [] }, proposal: { summary: '', actions: [] }, effect: { summary: '', points: [] } },
  }));

  return items.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
}

// ── 이전 리포트 비교 ──

export interface PrevReport {
  sirScore: number;
  createdAt: string;
}

export async function getPrevReport(workspaceId: string, currentReportId: string): Promise<PrevReport | null> {
  const { data } = await supabase
    .from('reports')
    .select('id, sir_score, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (!data || data.length < 2) return null;

  const currIdx = data.findIndex(r => r.id === currentReportId);
  if (currIdx === -1 || currIdx + 1 >= data.length) return null;

  const prev = data[currIdx + 1];
  return { sirScore: prev.sir_score ?? 0, createdAt: prev.created_at };
}

// ── 검색 트렌드 ──

export interface TrendPoint {
  date: string;
  ratio: number;
}

export interface SearchTrendResult {
  naver: TrendPoint[];
  google: TrendPoint[];
}

export async function getSearchTrend(workspaceId: string, reportId?: string): Promise<SearchTrendResult> {
  if (!reportId) return { naver: [], google: [] };

  const { data } = await supabase
    .from('search_trends')
    .select('provider, trend_data')
    .eq('report_id', reportId);

  const result: SearchTrendResult = { naver: [], google: [] };
  for (const row of data ?? []) {
    if (row.provider === 'naver') result.naver = row.trend_data ?? [];
    if (row.provider === 'google') result.google = row.trend_data ?? [];
  }
  return result;
}
