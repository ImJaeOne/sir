import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

export type CrawlHistoryChannel = 'news' | 'blog' | 'youtube' | 'community';
export type CrawlHistoryRelevance = 'all' | 'true' | 'false' | 'null';
export type CrawlHistoryCritical = 'all' | Database['public']['Enums']['critical_type'];
export type CrawlHistorySentiment = 'all' | 'positive' | 'negative' | 'neutral';

export interface CrawlHistoryFilters {
  workspaceId: string;
  channel: CrawlHistoryChannel;
  relevance: CrawlHistoryRelevance;
  critical: CrawlHistoryCritical;
  sentiment: CrawlHistorySentiment;
  sessionId: string | null;
  /** YYYY-MM-DD (KST) — published_at >= start 00:00:00 +09:00 */
  startDate: string | null;
  /** YYYY-MM-DD (KST) — published_at < end+1 00:00:00 +09:00 */
  endDate: string | null;
}

export interface CrawlHistoryItem {
  id: string;
  workspace_id: string;
  session_id: string | null;
  platform_id: string;
  channel: CrawlHistoryChannel;
  title: string;
  link: string;
  content: string | null;
  summary: string | null;
  is_relevant: boolean | null;
  critical_type: Database['public']['Enums']['critical_type'] | null;
  critical_reason: string | null;
  sentiment: string | null;
  published_at: string | null;
  created_at: string | null;
}

export interface CrawlHistoryPage {
  items: CrawlHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrawlHistorySession {
  id: string;
  platform_id: string | null;
  status: string;
  created_at: string;
}

// 채널 → (테이블, platform_id 필터) 매핑
function resolveSource(channel: CrawlHistoryChannel): {
  table: 'news_items' | 'sns_items' | 'community_items';
  platformIds: string[] | null;
} {
  if (channel === 'news') return { table: 'news_items', platformIds: null };
  if (channel === 'blog') return { table: 'sns_items', platformIds: ['naver_blog'] };
  if (channel === 'youtube') return { table: 'sns_items', platformIds: ['youtube'] };
  return { table: 'community_items', platformIds: null };
}

// 3 테이블(news_items/sns_items/community_items) 모두 동일 컬럼 보유.
// community_items.summary 는 마이그 065 에서 추가됨 (종토방 AI 요약).
const SELECT_COLS =
  'id,workspace_id,session_id,platform_id,title,link,content,summary,is_relevant,critical_type,critical_reason,sentiment,published_at,created_at';

export async function getCrawlHistory(
  filters: CrawlHistoryFilters,
  page: number,
  pageSize: number,
): Promise<CrawlHistoryPage> {
  const { table, platformIds } = resolveSource(filters.channel);

  let q = supabase
    .from(table)
    .select(SELECT_COLS, { count: 'exact' })
    .eq('workspace_id', filters.workspaceId);

  if (platformIds && platformIds.length === 1) q = q.eq('platform_id', platformIds[0]);

  if (filters.relevance === 'true') q = q.eq('is_relevant', true);
  else if (filters.relevance === 'false') q = q.eq('is_relevant', false);
  else if (filters.relevance === 'null') q = q.is('is_relevant', null);

  if (filters.critical !== 'all') q = q.eq('critical_type', filters.critical);
  if (filters.sentiment !== 'all') q = q.eq('sentiment', filters.sentiment);
  if (filters.sessionId) q = q.eq('session_id', filters.sessionId);

  if (filters.startDate) q = q.gte('published_at', `${filters.startDate}T00:00:00+09:00`);
  if (filters.endDate) {
    const end = new Date(`${filters.endDate}T00:00:00+09:00`);
    end.setDate(end.getDate() + 1);
    q = q.lt('published_at', end.toISOString());
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  q = q.order('published_at', { ascending: false, nullsFirst: false }).range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const items: CrawlHistoryItem[] = rows.map((r) => ({
    id: String(r.id),
    workspace_id: String(r.workspace_id),
    session_id: (r.session_id as string | null) ?? null,
    platform_id: String(r.platform_id),
    channel: filters.channel,
    title: String(r.title ?? ''),
    link: String(r.link ?? ''),
    content: (r.content as string | null) ?? null,
    summary: (r.summary as string | null) ?? null,
    is_relevant: (r.is_relevant as boolean | null) ?? null,
    critical_type: (r.critical_type as Database['public']['Enums']['critical_type'] | null) ?? null,
    critical_reason: (r.critical_reason as string | null) ?? null,
    sentiment: (r.sentiment as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    created_at: (r.created_at as string | null) ?? null,
  }));

  return { items, total: count ?? 0, page, pageSize };
}

export async function getWorkspaceSessions(
  workspaceId: string,
  channel: CrawlHistoryChannel,
): Promise<CrawlHistorySession[]> {
  const { platformIds } = resolveSource(channel);
  // platform_id 필터: channel 이 blog/youtube 면 단일 id, news/community 는 채널 라벨로 그룹화돼 있어 platform_id IN (...)
  const channelPlatformIds =
    channel === 'news'
      ? ['naver_news']
      : channel === 'community'
        ? ['naver_stock', 'dcinside']
        : platformIds!;

  const { data, error } = await supabase
    .from('sessions')
    .select('id,platform_id,status,created_at')
    .eq('workspace_id', workspaceId)
    .in('platform_id', channelPlatformIds)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as CrawlHistorySession[];
}

export async function getRetentionMode(): Promise<{ raw_retention_mode: boolean }> {
  const {
    data: { session: auth },
  } = await supabase.auth.getSession();
  if (!auth) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/config/retention`, {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('보존 모드 상태 조회 실패');
  return res.json();
}
