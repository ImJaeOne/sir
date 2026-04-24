import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 로그인 직후/루트 진입 시 역할별 랜딩 경로를 결정한다.
 * - super_admin / admin → `/` (관리자 홈 대시보드)
 * - user → 본인 첫 워크스페이스의 최신 published report URL
 * - user 인데 배정/발행이 없으면 `/no-report`
 */
export async function resolveLandingPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  const role = profile?.role ?? 'user';
  if (role !== 'user') return '/';

  const reportPath = await resolveUserReportPath(supabase, userId);
  return reportPath ?? '/no-report';
}

export async function resolveUserReportPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', userId)
    .limit(1);
  const wsId = membership?.[0]?.workspace_id;
  if (!wsId) return null;

  const { data: reports } = await supabase
    .from('reports')
    .select('id')
    .eq('workspace_id', wsId)
    .eq('status', 'published')
    .order('period_end', { ascending: false })
    .limit(1);
  const reportId = reports?.[0]?.id;
  if (!reportId) return null;
  return `/report/${wsId}/${reportId}`;
}
