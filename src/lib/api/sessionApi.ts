import { createClient } from '@/lib/supabase/client';
import { crawlSessionSchema } from '@/types/news';
import type { CrawlSession } from '@/types/news';

const supabase = createClient();

export async function getSessions(workspaceId: string): Promise<CrawlSession[]> {
  const { data, error } = await supabase
    .from('crawl_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => crawlSessionSchema.parse(row));
}

export async function getSession(sessionId: string): Promise<CrawlSession> {
  const { data, error } = await supabase
    .from('crawl_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return crawlSessionSchema.parse(data);
}

export async function getSessionsByDate(workspaceId: string, dateKey: string): Promise<CrawlSession[]> {
  const nextDay = new Date(dateKey);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().split('T')[0];

  // KST(UTC+9) 기준으로 쿼리
  const { data, error } = await supabase
    .from('crawl_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', `${dateKey}T00:00:00+09:00`)
    .lt('created_at', `${nextDayStr}T00:00:00+09:00`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => crawlSessionSchema.parse(row));
}
