import { createClient } from '@/lib/supabase/client';

// ── 타입 re-export (기존 import 호환) ──
export type {
  SummarySubsection, SummarySection,
  SirStockPoint, TierItem, SirRanking,
  ChannelStat, ChannelItem, RiskItem,
  StrategyAction, StrategyData, StrategyGroup,
  PrevReport, TrendPoint, SearchTrendResult,
  RiskReport, NewsClusterResponse as NewsCluster,
} from '@/types/report';

import type {
  SummarySection, SirStockPoint, SirRanking,
  ChannelStat, ChannelItem, RiskItem,
  StrategyGroup, PrevReport, SearchTrendResult, RiskReport,
  NewsClusterResponse,
} from '@/types/report';

const supabase = createClient();

// ── Report Meta 캐시 (session IDs + period) ──

interface ReportMeta {
  sessionIds: string[];
  periodStart: string;
  periodEnd: string;
  sirScore: number;
}

const reportMetaCache = new Map<string, ReportMeta>();

async function getReportMeta(reportId: string): Promise<ReportMeta> {
  if (reportMetaCache.has(reportId)) return reportMetaCache.get(reportId)!;

  const [reportRes, sessionsRes] = await Promise.all([
    supabase
      .from('reports')
      .select('period_start, period_end, sir_score')
      .eq('id', reportId)
      .maybeSingle(),
    supabase.from('sessions').select('id').eq('report_id', reportId),
  ]);

  const meta: ReportMeta = {
    sessionIds: (sessionsRes.data ?? []).map((s) => s.id),
    periodStart: reportRes.data?.period_start ?? '',
    periodEnd: reportRes.data?.period_end ?? '',
    sirScore: reportRes.data?.sir_score ?? 0,
  };

  reportMetaCache.set(reportId, meta);
  return meta;
}

// ── 리포트 기본 정보 ──

export async function getReportInfo(reportId: string) {
  const { data } = await supabase
    .from('reports')
    .select('type, period_start, period_end, created_at, sir_score, status')
    .eq('id', reportId)
    .maybeSingle();
  return data;
}

// ── 리포트 발행 (관리자 전용) ──

export async function publishReport(reportId: string): Promise<void> {
  const res = await fetch('/api/admin/publish-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? '발행 실패');
  }
}

// ── 주간 총평 ──

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

export async function upsertWeeklySummary(workspaceId: string, reportId: string, sections: SummarySection[]): Promise<void> {
  // 기존 row 확인
  const { data: existing } = await supabase
    .from('session_strategies')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('report_id', reportId)
    .is('category', null)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('session_strategies')
      .update({ all_strategy: sections })
      .eq('id', existing[0].id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('session_strategies')
      .insert({
        workspace_id: workspaceId,
        report_id: reportId,
        category: null,
        all_strategy: sections,
      });
    if (error) throw error;
  }
}

// ── SIR & 주가 차트 ──

export async function getSirStockData(workspaceId: string, reportId?: string): Promise<SirStockPoint[]> {
  let snapshotQuery = supabase.from('daily_snapshots').select('date, sir_score').eq('workspace_id', workspaceId).order('date');
  let stockQuery = supabase.from('stock_prices').select('date, open_price, high_price, low_price, close_price').eq('workspace_id', workspaceId).order('date');

  if (reportId) {
    const meta = await getReportMeta(reportId);
    if (meta.periodEnd) {
      // 최대 1년치 (weekly 52주 대응)
      const end = new Date(meta.periodEnd);
      const start365 = new Date(end);
      start365.setDate(start365.getDate() - 364);
      const startStr = start365.toISOString().slice(0, 10);
      snapshotQuery = snapshotQuery.gte('date', startStr).lte('date', meta.periodEnd);
      stockQuery = stockQuery.gte('date', startStr).lte('date', meta.periodEnd);
    }
  }

  const [snapshotsRes, stockRes] = await Promise.all([snapshotQuery, stockQuery]);

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

export async function getSirRanking(workspaceId: string, reportId?: string): Promise<SirRanking> {
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

  // reportId가 있으면 해당 report의 sir_score 사용, 없으면 workspace 최신값
  let myScore = latestByWs.get(workspaceId) ?? 0;
  if (reportId) {
    const meta = await getReportMeta(reportId);
    myScore = meta.sirScore;
  }

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
export async function getChannelStats(workspaceId: string, channelItems: ChannelItem[], reportId?: string): Promise<ChannelStat[]> {
  // channelItems가 이미 report-scoped이므로 비어있으면 빈 stats 반환
  if (channelItems.length === 0 && reportId) return [];
  // 채널별 감정 집계
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
  let sessionsQuery = supabase
    .from('sessions')
    .select('platform_id, sir_score')
    .eq('workspace_id', workspaceId)
    .eq('status', 'done')
    .order('created_at', { ascending: false });

  if (reportId) {
    sessionsQuery = sessionsQuery.eq('report_id', reportId);
  }

  const { data: sessions } = await sessionsQuery;

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

export async function getNewsClusters(workspaceId: string, reportId?: string): Promise<NewsClusterResponse[]> {
  if (reportId) {
    const meta = await getReportMeta(reportId);
    if (meta.sessionIds.length === 0) return [];

    const [clusterRes, itemsRes] = await Promise.all([
      supabase.from('news_clusters')
        .select('id, representative_title, sentiment, summary')
        .eq('workspace_id', workspaceId).eq('is_relevant', true)
        .in('session_id', meta.sessionIds)
        .order('created_at', { ascending: false }),
      supabase.from('news_items')
        .select('cluster_id, title, source, link')
        .eq('workspace_id', workspaceId).not('cluster_id', 'is', null)
        .in('session_id', meta.sessionIds),
    ]);

    const itemsByCluster = new Map<string, { title: string; source: string; link: string }[]>();
    for (const item of itemsRes.data ?? []) {
      if (!itemsByCluster.has(item.cluster_id)) itemsByCluster.set(item.cluster_id, []);
      itemsByCluster.get(item.cluster_id)!.push({ title: item.title, source: item.source ?? '', link: item.link ?? '#' });
    }

    return (clusterRes.data ?? []).map(c => ({
      id: c.id, representative_title: c.representative_title, sentiment: c.sentiment,
      summary: c.summary, items: itemsByCluster.get(c.id) ?? [],
    }));
  }

  const [clusterRes, itemsRes] = await Promise.all([
    supabase.from('news_clusters')
      .select('id, representative_title, sentiment, summary')
      .eq('workspace_id', workspaceId).eq('is_relevant', true)
      .order('created_at', { ascending: false }),
    supabase.from('news_items')
      .select('cluster_id, title, source, link')
      .eq('workspace_id', workspaceId).not('cluster_id', 'is', null),
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

// ── 채널별 아이템 (감정 상세 + 상위 콘텐츠 공유) ──

export async function getChannelItems(workspaceId: string, reportId?: string): Promise<ChannelItem[]> {
  if (reportId) {
    const meta = await getReportMeta(reportId);
    if (meta.sessionIds.length === 0) return [];
    const [newsRes, communityRes, snsRes] = await Promise.all([
      supabase.from('news_items')
        .select('id, platform_id, title, summary, sentiment, link, source, published_at, critical_type, cluster_id')
        .eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
      supabase.from('community_items')
        .select('id, platform_id, title, content, sentiment, link, views, published_at, critical_type')
        .eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
      supabase.from('sns_items')
        .select('id, platform_id, title, content, summary, sentiment, link, author, views, published_at, critical_type, impact_score')
        .eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
    ]);

    const normalize = (rows: any[], defaults: Partial<ChannelItem> = {}): ChannelItem[] =>
      (rows ?? []).map(r => ({
        id: r.id, platform_id: r.platform_id, title: r.title ?? '', content: r.content ?? null,
        summary: r.summary ?? null, sentiment: r.sentiment ?? 'neutral', link: r.link ?? '#',
        source: r.source ?? r.author ?? null, views: r.views ?? null, published_at: r.published_at ?? null,
        critical_type: r.critical_type ?? null, cluster_id: r.cluster_id ?? null, impact_score: r.impact_score ?? null,
        ...defaults,
      }));

    return [...normalize(newsRes.data ?? []), ...normalize(communityRes.data ?? []), ...normalize(snsRes.data ?? [])];
  }

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

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

export async function getRiskItems(workspaceId: string, reportId?: string): Promise<RiskItem[]> {
  if (reportId) {
    const meta = await getReportMeta(reportId);
    if (meta.sessionIds.length === 0) return [];
    const [communityRes, snsRes] = await Promise.all([
      supabase.from('community_items')
        .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
        .eq('workspace_id', workspaceId).not('critical_type', 'is', null).in('session_id', meta.sessionIds),
      supabase.from('sns_items')
        .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
        .eq('workspace_id', workspaceId).not('critical_type', 'is', null).in('session_id', meta.sessionIds),
    ]);
    return [...(communityRes.data ?? []), ...(snsRes.data ?? [])]
      .map(r => ({
        id: r.id, platform_id: r.platform_id, title: r.title ?? '', link: r.link ?? '#',
        critical_type: r.critical_type, critical_reason: r.critical_reason ?? null, published_at: r.published_at ?? null,
      }))
      .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
  }

  const [communityRes, snsRes] = await Promise.all([
    supabase.from('community_items')
      .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
      .eq('workspace_id', workspaceId).not('critical_type', 'is', null),
    supabase.from('sns_items')
      .select('id, platform_id, title, link, critical_type, critical_reason, published_at')
      .eq('workspace_id', workspaceId).not('critical_type', 'is', null),
  ]);

  return [...(communityRes.data ?? []), ...(snsRes.data ?? [])]
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

/**
 * daily ↔ daily, weekly ↔ weekly|initial 로 매칭해서 비교할 이전 보고서를 찾는다.
 * daily 가 있는 워크스페이스에서 daily 와 weekly 가 혼재해도 비교 기준 기간이 일관되도록.
 */
export async function getPrevReport(workspaceId: string, currentReportId: string): Promise<PrevReport | null> {
  const { data } = await supabase
    .from('reports')
    .select('id, type, sir_score, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (!data || data.length < 2) return null;

  const currIdx = data.findIndex(r => r.id === currentReportId);
  if (currIdx === -1) return null;

  const currType = data[currIdx].type;
  const compatibleTypes = currType === 'daily' ? ['daily'] : ['weekly', 'initial'];

  const prev = data.slice(currIdx + 1).find(r => compatibleTypes.includes(r.type));
  if (!prev) return null;

  // 이전 report의 아이템/리스크 건수 조회 (session 기반)
  const meta = await getReportMeta(prev.id);
  let totalItems = 0;
  let riskCount = 0;

  if (meta.sessionIds.length > 0) {
    const [newsCount, communityCount, snsCount, newsRisk, communityRisk, snsRisk] = await Promise.all([
      supabase.from('news_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
      supabase.from('community_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
      supabase.from('sns_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('is_relevant', true).in('session_id', meta.sessionIds),
      supabase.from('news_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null).in('session_id', meta.sessionIds),
      supabase.from('community_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null).in('session_id', meta.sessionIds),
      supabase.from('sns_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null).in('session_id', meta.sessionIds),
    ]);
    totalItems = (newsCount.count ?? 0) + (communityCount.count ?? 0) + (snsCount.count ?? 0);
    riskCount = (newsRisk.count ?? 0) + (communityRisk.count ?? 0) + (snsRisk.count ?? 0);
  }

  // 이전 report의 채널별 SIR 평균
  const { data: prevSessions } = await supabase
    .from('sessions')
    .select('platform_id, sir_score')
    .eq('report_id', prev.id)
    .eq('status', 'done');

  const sirByChannel = new Map<string, number[]>();
  for (const s of prevSessions ?? []) {
    if (s.sir_score == null) continue;
    const channel = PLATFORM_TO_CHANNEL[s.platform_id] ?? s.platform_id;
    if (!sirByChannel.has(channel)) sirByChannel.set(channel, []);
    sirByChannel.get(channel)!.push(s.sir_score);
  }

  const channelSirMap: Record<string, number> = {};
  for (const [ch, scores] of sirByChannel) {
    channelSirMap[ch] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return { id: prev.id, type: prev.type as string, sirScore: prev.sir_score ?? 0, createdAt: prev.created_at, totalItems, riskCount, channelSirMap };
}

// ── 검색 트렌드 ──

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

// ── 신고 대행 요청 ──

export async function getRiskReports(workspaceId: string, reportId?: string): Promise<RiskReport[]> {
  let query = supabase.from('risk_reports').select('*').order('requested_at', { ascending: false });
  if (workspaceId && workspaceId !== '_all') query = query.eq('workspace_id', workspaceId);
  if (reportId) query = query.eq('report_id', reportId);
  const { data } = await query;
  return data ?? [];
}

/**
 * 보고서 기간 내에 "처리 완료" 또는 "반려" 로 결과가 확정된 신고 건만 반환.
 * 접수 시점이 아닌 resolved_at 기준 → 처리 결과가 확정된 날의 익일 보고서에 반영됨.
 */
export async function getResolvedRiskReports(workspaceId: string, periodStart: string, periodEnd: string): Promise<RiskReport[]> {
  const startIso = `${periodStart}T00:00:00`;
  const endIso = `${periodEnd}T23:59:59.999`;
  const { data } = await supabase
    .from('risk_reports')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['resolved', 'rejected'])
    .gte('resolved_at', startIso)
    .lte('resolved_at', endIso)
    .order('resolved_at', { ascending: false });
  return data ?? [];
}

export async function deleteRiskReport(id: string): Promise<void> {
  // Storage 파일 삭제 후 DB row 삭제
  const { data } = await supabase.from('risk_reports').select('file_urls').eq('id', id).single();
  const fileUrls = data?.file_urls ?? [];
  if (fileUrls.length > 0) {
    await supabase.storage.from('risk-attachments').remove(fileUrls);
  }
  const { error } = await supabase.from('risk_reports').delete().eq('id', id);
  if (error) throw error;
}

// 신고 대상 아이템의 platform_id → risk_reports.source_table
const RISK_SOURCE_TABLE: Record<string, string> = {
  naver_news: 'news_items',
  naver_blog: 'sns_items',
  youtube: 'sns_items',
  naver_stock: 'community_items',
  dcinside: 'community_items',
};

export interface SubmitRiskReportInput {
  workspaceId: string;
  reportId: string;
  item: RiskItem;
  reason: string;
  evidence: string;
  files: File[];
}

export async function submitRiskReport(input: SubmitRiskReportInput): Promise<void> {
  const { workspaceId, reportId, item, reason, evidence, files } = input;

  const fileUrls: string[] = [];
  for (const f of files) {
    const ext = f.name.split('.').pop() ?? '';
    const path = `${workspaceId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('risk-attachments').upload(path, f);
    if (error) throw error;
    fileUrls.push(path);
  }

  const { error } = await supabase.from('risk_reports').insert({
    workspace_id: workspaceId,
    report_id: reportId,
    source_table: RISK_SOURCE_TABLE[item.platform_id] ?? 'community_items',
    source_id: item.id,
    platform_id: item.platform_id,
    title: item.title,
    link: item.link,
    critical_type: item.critical_type,
    reason,
    evidence,
    file_urls: fileUrls,
    status: 'requested',
  });
  if (error) throw error;
}

export async function updateRiskReport(id: string, body: { status?: string; admin_note?: string }): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/risk-report/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('상태 업데이트 실패');
}

// ── 대응 전략 수정 ──

// ── 리스크 해제 (관리자 전용) ──

export async function clearCriticalType(platformId: string, itemId: string): Promise<void> {
  const res = await fetch('/api/admin/clear-critical', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform_id: platformId, id: itemId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? '리스크 해제 실패');
  }
}

export async function updateStrategies(workspaceId: string, reportId: string, strategies: StrategyGroup[]): Promise<void> {
  for (const group of strategies) {
    const { error } = await supabase
      .from('session_strategies')
      .update({ strategy: group.strategy })
      .eq('workspace_id', workspaceId)
      .eq('report_id', reportId)
      .eq('category', group.category);
    if (error) throw error;
  }
}

// ── 주가 데이터 ──

export async function getStockPrices(workspaceId: string) {
  const { data, error } = await supabase
    .from('stock_prices')
    .select('date, close_price')
    .eq('workspace_id', workspaceId)
    .order('date');
  if (error) throw error;
  return data as { date: string; close_price: number }[];
}
