import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/** GET — 모든 워크스페이스의 AI 토큰 정보. admin/super_admin 둘 다 접근. */
export async function GET() {
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
  if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    return NextResponse.json({ detail: '관리자 권한 필요' }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .select('id, company_name, token_balance, monthly_quota, last_charged_at')
    .order('company_name');

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
