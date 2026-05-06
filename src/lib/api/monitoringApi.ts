import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

// ── 채널 매핑 ─────────────────────────────────────────────────────────
// platforms 테이블의 5종을 4채널로 묶음 (커뮤니티 = naver_stock + dcinside)

export type Channel = 'news' | 'blog' | 'youtube' | 'community';

export const MONITORING_CHANNELS: { id: Channel; label: string }[] = [
  { id: 'news', label: '뉴스' },
  { id: 'blog', label: '블로그' },
  { id: 'youtube', label: '유튜브' },
  { id: 'community', label: '커뮤니티' },
];

const PLATFORM_TO_CHANNEL: Record<string, Channel> = {
  naver_news: 'news',
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

export type CriticalType = Database['public']['Enums']['critical_type'];

export const CRITICAL_TYPES: { id: CriticalType; label: string }[] = [
  { id: 'defamation', label: '명예훼손' },
  { id: 'insult', label: '모욕' },
  { id: 'rumor', label: '허위사실' },
  { id: 'spam', label: '스팸/광고' },
];

// ── 반환 타입 ─────────────────────────────────────────────────────────

export interface MonitoringDayPoint {
  date: string;                                    // YYYY-MM-DD
  isCarried: boolean;
  channelVolume: Record<Channel, number>;
  totalVolume: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface MonitoringStockPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
}

export interface MonitoringRiskPoint {
  date: string;
  byType: Record<CriticalType, number>;
  total: number;
}

export interface MonitoringSearchPoint {
  date: string;
  naver: number | null;
  google: number | null;
}

// ── 페이지네이션 헬퍼 (reportApi.ts 와 동일 패턴) ────────────────────
const _PAGE = 1000;
async function fetchAllPaged<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let off = 0;
  while (true) {
    const { data } = await build(off, off + _PAGE - 1);
    const chunk = data ?? [];
    all.push(...chunk);
    if (chunk.length < _PAGE) break;
    off += _PAGE;
  }
  return all;
}

function emptyChannelVolume(): Record<Channel, number> {
  return { news: 0, blog: 0, youtube: 0, community: 0 };
}

function emptyByType(): Record<CriticalType, number> {
  return { defamation: 0, insult: 0, rumor: 0, spam: 0 };
}

// ── API ───────────────────────────────────────────────────────────────

/** daily_snapshots + daily_platform_stats 머지. 채널별 수집량/감정 일자 시계열. */
export async function getMonitoringDaily(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringDayPoint[]> {
  const snapshots = await fetchAllPaged((from, to) =>
    supabase
      .from('daily_snapshots')
      .select('id, date, is_carried')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .range(from, to),
  );

  if (snapshots.length === 0) return [];

  const ids = snapshots.map((s) => s.id);
  const stats = await fetchAllPaged((from, to) =>
    supabase
      .from('daily_platform_stats')
      .select(
        'daily_snapshot_id, platform_id, content_count, positive_count, negative_count, neutral_count',
      )
      .in('daily_snapshot_id', ids)
      .range(from, to),
  );

  type Acc = {
    channelVolume: Record<Channel, number>;
    positive: number;
    neutral: number;
    negative: number;
    totalVolume: number;
  };
  const accBySnap = new Map<string, Acc>();
  for (const s of stats) {
    const channel = PLATFORM_TO_CHANNEL[s.platform_id];
    if (!channel) continue;
    const cur =
      accBySnap.get(s.daily_snapshot_id) ?? {
        channelVolume: emptyChannelVolume(),
        positive: 0,
        neutral: 0,
        negative: 0,
        totalVolume: 0,
      };
    cur.channelVolume[channel] += s.content_count;
    cur.positive += s.positive_count;
    cur.neutral += s.neutral_count;
    cur.negative += s.negative_count;
    cur.totalVolume += s.content_count;
    accBySnap.set(s.daily_snapshot_id, cur);
  }

  return snapshots.map((s) => {
    const acc = accBySnap.get(s.id) ?? {
      channelVolume: emptyChannelVolume(),
      positive: 0,
      neutral: 0,
      negative: 0,
      totalVolume: 0,
    };
    return {
      date: s.date,
      isCarried: s.is_carried,
      channelVolume: acc.channelVolume,
      totalVolume: acc.totalVolume,
      positive: acc.positive,
      neutral: acc.neutral,
      negative: acc.negative,
    };
  });
}

/** stock_prices 시계열. close 는 NOT NULL, 나머지는 nullable. */
export async function getMonitoringStock(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringStockPoint[]> {
  const rows = await fetchAllPaged((from, to) =>
    supabase
      .from('stock_prices')
      .select('date, open_price, high_price, low_price, close_price')
      .eq('workspace_id', workspaceId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .range(from, to),
  );

  return rows.map((r) => ({
    date: r.date,
    open: r.open_price,
    high: r.high_price,
    low: r.low_price,
    close: r.close_price,
  }));
}

/** news_items + community_items + sns_items 의 critical_type 발생을 일자/타입별로 집계.
 *  published_at 기준. 필터에 `+09:00` offset 을 명시해 KST 자정 경계 어긋남 방지. */
export async function getMonitoringRisks(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringRiskPoint[]> {
  const startISO = `${startDate}T00:00:00+09:00`;
  // endDate 자정까지 포함 → 다음날 00:00 미만
  const endNext = new Date(`${endDate}T00:00:00+09:00`);
  endNext.setDate(endNext.getDate() + 1);
  const endISO = endNext.toISOString();

  type Row = { published_at: string | null; critical_type: CriticalType | null };

  const buildItemQuery = (table: 'news_items' | 'community_items' | 'sns_items') => (
    from: number,
    to: number,
  ) =>
    supabase
      .from(table)
      .select('published_at, critical_type')
      .eq('workspace_id', workspaceId)
      .not('critical_type', 'is', null)
      .gte('published_at', startISO)
      .lt('published_at', endISO)
      .range(from, to);

  const [news, community, sns] = await Promise.all([
    fetchAllPaged<Row>(buildItemQuery('news_items')),
    fetchAllPaged<Row>(buildItemQuery('community_items')),
    fetchAllPaged<Row>(buildItemQuery('sns_items')),
  ]);

  const byDate = new Map<string, Record<CriticalType, number>>();
  for (const r of [...news, ...community, ...sns]) {
    if (!r.published_at || !r.critical_type) continue;
    // published_at 은 UTC ISO. KST 일자로 변환해서 묶음.
    const kst = new Date(new Date(r.published_at).getTime() + 9 * 60 * 60 * 1000);
    const date = kst.toISOString().slice(0, 10);
    const cur = byDate.get(date) ?? emptyByType();
    cur[r.critical_type] += 1;
    byDate.set(date, cur);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, byType]) => ({
      date,
      byType,
      total: byType.defamation + byType.insult + byType.rumor + byType.spam,
    }));
}

/** workspace 의 모든 search_trends.trend_data 를 일자 단위로 머지.
 *  search_trends 는 보고서 발행 시점 기준 30일치 [{date, ratio}] 라 같은 날짜가 여러
 *  보고서에 중복 저장될 수 있다. 보고서별 정규화 baseline 이 다르므로 같은 날짜는
 *  보고서 created_at 이 가장 최신인 값 1개만 채택해 시각적 점프를 줄인다. */
export async function getMonitoringSearchTrend(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringSearchPoint[]> {
  type Row = {
    provider: 'naver' | 'google';
    trend_data: { date: string; ratio: number }[] | null;
    reports: { created_at: string | null } | null;
  };

  // search_trends 만 단독으로 가져오면 created_at(보고서) 우선순위를 알 수 없어 nested select.
  // 같은 ws 안에서만 머지되므로 RLS 통과. row 수가 워크스페이스 보고서 수 * 2(provider) 라 fetchAllPaged 까지는 불필요(50개 미만 예상).
  const { data } = await supabase
    .from('search_trends')
    .select('provider, trend_data, reports!inner(created_at)')
    .eq('workspace_id', workspaceId)
    .returns<Row[]>();

  // 같은 (date, provider) 의 가장 최신 보고서 ratio 만 남김
  type Slot = { ratio: number; reportTs: number };
  const naverByDate = new Map<string, Slot>();
  const googleByDate = new Map<string, Slot>();

  for (const r of data ?? []) {
    const target = r.provider === 'naver' ? naverByDate : r.provider === 'google' ? googleByDate : null;
    if (!target) continue;
    const reportTs = r.reports?.created_at ? new Date(r.reports.created_at).getTime() : 0;
    for (const p of r.trend_data ?? []) {
      if (!p?.date || typeof p.ratio !== 'number') continue;
      const cur = target.get(p.date);
      if (!cur || cur.reportTs < reportTs) target.set(p.date, { ratio: p.ratio, reportTs });
    }
  }

  // 범위 필터 + 일자 join
  const allDates = new Set<string>([
    ...Array.from(naverByDate.keys()).filter((d) => d >= startDate && d <= endDate),
    ...Array.from(googleByDate.keys()).filter((d) => d >= startDate && d <= endDate),
  ]);

  return Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      naver: naverByDate.get(date)?.ratio ?? null,
      google: googleByDate.get(date)?.ratio ?? null,
    }));
}
