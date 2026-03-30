import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ── 주간 총평 ──

export async function getWeeklySummary(workspaceId: string): Promise<string[]> {
  const { data } = await supabase
    .from('session_strategies')
    .select('summary')
    .eq('workspace_id', workspaceId)
    .is('platform_id', null)
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.summary ?? [];
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
  { label: '하위 4구간 (0~9)', min: 0, max: 10 },
  { label: '하위 3구간 (10~19)', min: 10, max: 20 },
  { label: '하위 2구간 (20~29)', min: 20, max: 30 },
  { label: '하위 1구간 (30~39)', min: 30, max: 40 },
  { label: '중위 3구간 (40~49)', min: 40, max: 50 },
  { label: '중위 2구간 (50~59)', min: 50, max: 60 },
  { label: '중위 1구간 (60~69)', min: 60, max: 70 },
  { label: '상위 3구간 (70~79)', min: 70, max: 80 },
  { label: '상위 2구간 (80~89)', min: 80, max: 90 },
  { label: '상위 1구간 (90~100)', min: 90, max: 101 },
];

export async function getSirRanking(workspaceId: string): Promise<SirRanking> {
  const { data: resData } = await supabase.from('workspaces').select('id, sir_score');
  const all = (resData ?? []).filter((w: any) => w.sir_score != null);
  const myScore = all.find((w: any) => w.id === workspaceId)?.sir_score ?? 0;

  const myTierIdx = TIER_RANGES.findIndex(t => myScore >= t.min && myScore < t.max);
  const tiers = TIER_RANGES.map((t, i) => ({
    tier: t.label,
    count: all.filter((w: any) => w.sir_score >= t.min && w.sir_score < t.max).length,
    isCurrent: i === myTierIdx ? 1 : 0,
  }));

  const sorted = all.map((w: any) => w.sir_score as number).sort((a: number, b: number) => b - a);
  const rank = sorted.indexOf(myScore) + 1;
  const average = all.length ? Math.round(all.reduce((s: number, w: any) => s + (w.sir_score as number), 0) / all.length) : 0;

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

const CHANNEL_COLORS: Record<string, string> = {
  naver_news: '#6366f1',
  naver_blog: '#38bdf8',
  youtube: '#f43f5e',
  naver_stock: '#22c55e',
  dcinside: '#f59e0b',
};

/** channelItems + sessions 캐시에서 channelStats를 파생 */
export async function getChannelStats(workspaceId: string, channelItems: ChannelItem[]): Promise<ChannelStat[]> {
  // 플랫폼별 감성 집계
  const byPlatform = new Map<string, { positive: number; negative: number; neutral: number }>();
  for (const item of channelItems) {
    if (!byPlatform.has(item.platform_id)) {
      byPlatform.set(item.platform_id, { positive: 0, negative: 0, neutral: 0 });
    }
    const counts = byPlatform.get(item.platform_id)!;
    if (item.sentiment === 'positive') counts.positive++;
    else if (item.sentiment === 'negative') counts.negative++;
    else counts.neutral++;
  }

  // 세션별 SIR (1번만 쿼리)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('platform_id, sir_score')
    .eq('workspace_id', workspaceId)
    .eq('status', 'done')
    .order('created_at', { ascending: false });

  const sirMap = new Map<string, number>();
  for (const s of sessions ?? []) {
    if (!sirMap.has(s.platform_id) && s.sir_score != null) {
      sirMap.set(s.platform_id, s.sir_score);
    }
  }

  const PLATFORM_ORDER = ['naver_news', 'naver_blog', 'youtube', 'naver_stock', 'dcinside'];
  return PLATFORM_ORDER
    .filter(id => byPlatform.has(id))
    .map(id => {
      const counts = byPlatform.get(id)!;
      return {
        id,
        label: PLATFORM_LABELS[id] ?? id,
        value: counts.positive + counts.negative + counts.neutral,
        color: CHANNEL_COLORS[id] ?? '#94a3b8',
        sir: sirMap.get(id) ?? 50,
        positive: counts.positive,
        negative: counts.negative,
        neutral: counts.neutral,
      };
    });
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
  views: number | null;
  published_at: string | null;
  critical_type: string | null;
}

export async function getChannelItems(workspaceId: string): Promise<ChannelItem[]> {
  const [newsRes, communityRes, snsRes] = await Promise.all([
    supabase.from('news_items')
      .select('id, platform_id, title, summary, sentiment, link, published_at, critical_type')
      .eq('workspace_id', workspaceId).eq('is_relevant', true),
    supabase.from('community_items')
      .select('id, platform_id, title, content, sentiment, link, views, published_at, critical_type')
      .eq('workspace_id', workspaceId).eq('is_relevant', true),
    supabase.from('sns_items')
      .select('id, platform_id, title, content, summary, sentiment, link, views, published_at, critical_type')
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
      views: r.views ?? null,
      published_at: r.published_at ?? null,
      critical_type: r.critical_type ?? null,
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

export interface StrategyGroup {
  platform: string;
  backgrounds: string[];
  proposals: string[];
}

const STRATEGY_PLATFORM_MAP: Record<string, string> = {
  naver_news: '뉴스 채널 대응 전략',
  naver_blog: 'SNS 채널 대응 전략',
  youtube: 'SNS 채널 대응 전략',
  naver_stock: '커뮤니티 채널 대응 전략',
  dcinside: '커뮤니티 채널 대응 전략',
};

export async function getStrategies(workspaceId: string): Promise<StrategyGroup[]> {
  const { data } = await supabase
    .from('session_strategies')
    .select('platform_id, strategy_background, strategy_proposal')
    .eq('workspace_id', workspaceId)
    .not('platform_id', 'is', null)
    .order('created_at', { ascending: false });

  // platform_id → 카테고리별 그룹핑 (뉴스/SNS/커뮤니티)
  const grouped = new Map<string, { backgrounds: string[]; proposals: string[] }>();
  for (const row of data ?? []) {
    const category = STRATEGY_PLATFORM_MAP[row.platform_id] ?? row.platform_id;
    if (!grouped.has(category)) {
      grouped.set(category, { backgrounds: [], proposals: [] });
    }
    const g = grouped.get(category)!;
    g.backgrounds.push(...(row.strategy_background ?? []));
    g.proposals.push(...(row.strategy_proposal ?? []));
  }

  return Array.from(grouped.entries()).map(([platform, data]) => ({
    platform,
    backgrounds: data.backgrounds,
    proposals: data.proposals,
  }));
}

// ── 검색 트렌드 ──

export interface TrendPoint {
  date: string;
  ratio: number;
}

export async function getSearchTrend(workspaceId: string, days: number = 30, endDate?: string): Promise<TrendPoint[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (endDate) params.set('end_date', endDate);

  const res = await fetch(`http://localhost:8000/api/search-trend/${workspaceId}?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.trend ?? [];
}
