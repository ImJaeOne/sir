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

// ── 채널 매트릭스 (E 탭 sentiment 토글용) ─────────────────────────
// 일자×채널×sentiment 카운트. is_relevant=true 인 항목만 집계해 동명 노이즈
// (예: "대교" 검색 시 "광안대교") 를 제외한다.

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type SentimentFilter = 'all' | Sentiment;

export interface ChannelMatrixCell {
  positive: number;
  neutral: number;
  negative: number;
  unknown: number; // sentiment === null (분석 실패/대기)
}

export interface MonitoringChannelMatrixPoint {
  date: string;
  byChannel: Record<Channel, ChannelMatrixCell>;
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

function emptyMatrixCell(): ChannelMatrixCell {
  return { positive: 0, neutral: 0, negative: 0, unknown: 0 };
}

function emptyByChannelMatrix(): Record<Channel, ChannelMatrixCell> {
  return {
    news: emptyMatrixCell(),
    blog: emptyMatrixCell(),
    youtube: emptyMatrixCell(),
    community: emptyMatrixCell(),
  };
}

/** sentiment 토글로 한 셀의 카운트를 슬라이스. 'all' 은 unknown(분석 미완) 도 포함. */
export function pickMatrixCount(cell: ChannelMatrixCell, sentiment: SentimentFilter): number {
  if (sentiment === 'all') return cell.positive + cell.neutral + cell.negative + cell.unknown;
  return cell[sentiment];
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

/** news_items + community_items + sns_items 의 raw row 를 일자×채널×sentiment 카운트로 집계.
 *  is_relevant=true 인 항목만 포함해 동명 노이즈를 제외한다. published_at 기준 KST 일자. */
export async function getMonitoringChannelMatrix(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringChannelMatrixPoint[]> {
  const startISO = `${startDate}T00:00:00+09:00`;
  const endNext = new Date(`${endDate}T00:00:00+09:00`);
  endNext.setDate(endNext.getDate() + 1);
  const endISO = endNext.toISOString();

  type Row = {
    published_at: string | null;
    platform_id: string;
    sentiment: string | null;
  };

  const buildItemQuery = (table: 'news_items' | 'community_items' | 'sns_items') => (
    from: number,
    to: number,
  ) =>
    supabase
      .from(table)
      .select('published_at, platform_id, sentiment')
      .eq('workspace_id', workspaceId)
      .eq('is_relevant', true)
      .gte('published_at', startISO)
      .lt('published_at', endISO)
      .range(from, to);

  const [news, community, sns] = await Promise.all([
    fetchAllPaged<Row>(buildItemQuery('news_items')),
    fetchAllPaged<Row>(buildItemQuery('community_items')),
    fetchAllPaged<Row>(buildItemQuery('sns_items')),
  ]);

  const byDate = new Map<string, Record<Channel, ChannelMatrixCell>>();

  for (const r of [...news, ...community, ...sns]) {
    if (!r.published_at) continue;
    const channel = PLATFORM_TO_CHANNEL[r.platform_id];
    if (!channel) continue;

    const kst = new Date(new Date(r.published_at).getTime() + 9 * 60 * 60 * 1000);
    const date = kst.toISOString().slice(0, 10);

    const dayMap = byDate.get(date) ?? emptyByChannelMatrix();
    const cell = dayMap[channel];

    const s = r.sentiment;
    if (s === 'positive') cell.positive += 1;
    else if (s === 'neutral') cell.neutral += 1;
    else if (s === 'negative') cell.negative += 1;
    else cell.unknown += 1;

    byDate.set(date, dayMap);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, byChannel]) => ({ date, byChannel }));
}

// ── 네이버 데이터랩 라이브 검색 트렌드 ─────────────────────────────
// 365일치 시계열을 한 번 가져와 클라이언트가 5 프리셋(7/30/90/180/365)으로 슬라이스 + 재정규화한다.
// 보고서별 정규화 baseline 차이로 인한 시각적 점프 문제를 해결.

export interface NaverSearchTrendLiveResponse {
  keyword: string;
  start: string;            // YYYY-MM-DD KST
  end: string;              // YYYY-MM-DD KST
  points: { date: string; ratio: number }[];
  cached?: boolean;         // 서버 캐시 hit 여부 (디버그용)
  stale?: boolean;          // 네이버 호출 실패 시 직전 캐시 fallback
}

export async function getNaverSearchTrendLive(
  workspaceId: string,
): Promise<NaverSearchTrendLiveResponse> {
  const res = await fetch('/api/monitoring/search-trend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspace_id: workspaceId }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`검색 트렌드 조회 실패 (${res.status}): ${detail.slice(0, 100)}`);
  }
  return res.json();
}

// ── AI 분석 ─────────────────────────────────────────────────────────

export interface MonitoringAiAnalysisResult {
  content: string;       // markdown
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
  };
  stop_reason: string;
  cached: boolean;          // 같은 KST 일자 캐시 hit 여부
  generated_at: string;     // 최초 생성 시각 (ISO timestamptz)
  period_start?: string;    // YYYY-MM-DD KST (캐시 SELECT 시 채움)
  period_end?: string;      // YYYY-MM-DD KST
}

export async function getMonitoringAiAnalysis(
  workspaceId: string,
  periodStart: string,
  periodEnd: string,
): Promise<MonitoringAiAnalysisResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다');

  // Next.js route handler 로 proxy (same-origin → CORS 회피, 백엔드 URL 클라이언트 미노출)
  const res = await fetch(`/api/monitoring/ai-analysis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`AI 분석 실패 (${res.status}): ${detail.slice(0, 100)}`);
  }
  return res.json();
}

/** 모니터링 AI 분석 — 오늘(KST) 캐시 row 만 SELECT. 없으면 null. 신규 분석 호출 X.
 *
 *  AiAnalysisCard 가 mount 시 자동 호출 → DB 에 이미 있는 분석을 페이지 진입 즉시 표시.
 *  스키마: monitoring_ai_analyses (마이그 056). RLS 로 멤버만 SELECT 가능.
 *  database.types.ts 미생성 → as any cast.
 */
export async function getMonitoringAiAnalysisCached(
  workspaceId: string,
): Promise<MonitoringAiAnalysisResult | null> {
  const todayKst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('monitoring_ai_analyses')
    .select('content, model, input_tokens, output_tokens, cache_read_tokens, created_at, period_start, period_end')
    .eq('workspace_id', workspaceId)
    .eq('generated_kst_date', todayKst)
    .maybeSingle();

  if (error || !data) return null;

  return {
    content: data.content,
    model: data.model,
    usage: {
      input_tokens: data.input_tokens,
      output_tokens: data.output_tokens,
      cache_read_input_tokens: data.cache_read_tokens ?? 0,
      cache_creation_input_tokens: 0,
    },
    stop_reason: 'end_turn',
    cached: true,
    generated_at: data.created_at,
    period_start: data.period_start,
    period_end: data.period_end,
  };
}
