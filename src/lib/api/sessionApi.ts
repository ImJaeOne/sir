import { createClient } from '@/lib/supabase/client';
import { crawlSessionSchema } from '@/types/news';
import type { CrawlSession } from '@/types/news';

const supabase = createClient();

/** 실패(failed) 세션을 failed_reason 기반으로 collect/save/analyze/calculate 분기 재시도.
 *  session_id 는 in-place 유지. 백엔드: POST /api/sessions/{id}/retry */
export async function retrySession(sessionId: string): Promise<void> {
  const { data: { session: auth } } = await supabase.auth.getSession();
  if (!auth) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? '재시도 요청 실패');
  }
}

export async function getSessions(workspaceId: string): Promise<CrawlSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => crawlSessionSchema.parse(row));
}

export async function getSession(sessionId: string): Promise<CrawlSession> {
  const { data, error } = await supabase
    .from('sessions')
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
    .from('sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .gte('created_at', `${dateKey}T00:00:00+09:00`)
    .lt('created_at', `${nextDayStr}T00:00:00+09:00`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => crawlSessionSchema.parse(row));
}
