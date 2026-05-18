import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** PATCH — 워크스페이스 토큰 수정. super_admin 만.
 *
 *  body: { monthly_quota?: number, add_tokens?: number }
 *  - monthly_quota: 절대값 set (월 자동 충전량 변경)
 *  - add_tokens: 잔여량에 delta 추가 (음수 = 차감). atomic decrement RPC 사용.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: '인증 필요' }, { status: 401 });
  }
  const { data: profile } = await supabaseUser
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ detail: '최고 관리자 권한 필요' }, { status: 403 });
  }

  const body = await request.json();
  const monthly_quota: number | undefined = body.monthly_quota;
  const add_tokens: number | undefined = body.add_tokens;

  if (monthly_quota === undefined && add_tokens === undefined) {
    return NextResponse.json(
      { detail: 'monthly_quota 또는 add_tokens 중 하나는 필요합니다' },
      { status: 400 },
    );
  }
  if (monthly_quota !== undefined && monthly_quota < 0) {
    return NextResponse.json(
      { detail: 'monthly_quota 는 0 이상이어야 합니다' },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // add_tokens 는 atomic RPC (race 안전). monthly_quota 는 단순 UPDATE.
  if (add_tokens !== undefined && add_tokens !== 0) {
    const { error: rpcErr } = await supabaseAdmin.rpc('decrement_workspace_tokens', {
      p_workspace_id: workspaceId,
      p_amount: -add_tokens,
    });
    if (rpcErr) {
      return NextResponse.json({ detail: rpcErr.message }, { status: 500 });
    }
  }

  if (monthly_quota !== undefined) {
    const { error: updErr } = await supabaseAdmin
      .from('workspaces')
      .update({ monthly_quota })
      .eq('id', workspaceId);
    if (updErr) {
      return NextResponse.json({ detail: updErr.message }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('id, company_name, token_balance, monthly_quota, last_charged_at')
    .eq('id', workspaceId)
    .single();
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
