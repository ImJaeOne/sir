import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface BloggerHashPair {
  plaintext: string;
  hash: string;
}

/** 전역 네이버 블로거 블랙리스트 — DB 엔 hash 만 잔존하므로 카운트만 반환. */
export async function getNaverBloggerCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('content_blacklist')
    .select('id', { count: 'exact', head: true })
    .eq('platform_id', 'naver_blog')
    .eq('type', 'author')
    .is('workspace_id', null);
  if (error) throw error;
  return count ?? 0;
}

/** 워크스페이스 전용 유튜브 키워드 블랙리스트 — plaintext. */
export async function getYoutubeKeywords(workspaceId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_blacklist')
    .select('value')
    .eq('platform_id', 'youtube')
    .eq('type', 'keyword')
    .eq('workspace_id', workspaceId);
  if (error) throw error;
  return data?.map((d) => d.value) ?? [];
}

/** 네이버 블로거 1건 추가 — 백엔드 라우트 경유로 HMAC-SHA256 변환 후 INSERT. plaintext 는 응답에 echo. */
export async function addNaverBlogger(plaintext: string): Promise<BloggerHashPair> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_URL}/api/blacklist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      platform_id: 'naver_blog',
      type: 'author',
      value: plaintext,
      workspace_id: null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `블로거 추가 실패: ${plaintext}`);
  }
  const row = await res.json();
  return { plaintext, hash: row.value as string };
}

export async function addYoutubeKeywords(workspaceId: string, values: string[]): Promise<void> {
  if (values.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.from('content_blacklist').insert(
    values.map((value) => ({
      platform_id: 'youtube',
      type: 'keyword',
      value,
      workspace_id: workspaceId,
    })),
  );
  if (error) throw error;
}

export async function removeYoutubeKeywords(workspaceId: string, values: string[]): Promise<void> {
  if (values.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase
    .from('content_blacklist')
    .delete()
    .eq('platform_id', 'youtube')
    .eq('type', 'keyword')
    .eq('workspace_id', workspaceId)
    .in('value', values);
  if (error) throw error;
}
