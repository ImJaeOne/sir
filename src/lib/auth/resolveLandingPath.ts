import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 로그인 직후/루트 진입 시 역할별 랜딩 경로를 결정한다.
 * - super_admin / admin → `/` (관리자 홈 대시보드)
 * - user → 본인 첫 워크스페이스의 최신 published report URL
 * - user 인데 배정/발행이 없으면 `/no-report`
 *
 * 마이그 058 의 `get_user_landing` RPC 한 번 호출로 role + workspace_id + report_id
 * 를 동시에 받음 (이전 3 직렬 호출 → 1 round trip).
 */
export async function resolveLandingPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .rpc('get_user_landing', { p_user_id: userId })
    .single();

  if (error || !data) {
    // RPC 실패 → user 로 가정하고 /no-report 로 안전 폴백
    return '/no-report';
  }

  const row = data as { role: string | null; workspace_id: string | null; report_id: string | null };
  if (row.role && row.role !== 'user') return '/';
  if (row.workspace_id && row.report_id) return `/report/${row.workspace_id}/${row.report_id}`;
  return '/no-report';
}

/**
 * middleware 가 `/` 진입 시 user 역할인 경우 보고서 경로 해석에 사용.
 * (resolveLandingPath 와 동일 로직이지만 admin 분기는 호출자가 이미 처리한 상태)
 */
export async function resolveUserReportPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('get_user_landing', { p_user_id: userId })
    .single();

  if (error || !data) return null;

  const row = data as { workspace_id: string | null; report_id: string | null };
  if (row.workspace_id && row.report_id) return `/report/${row.workspace_id}/${row.report_id}`;
  return null;
}
