import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TABLE_BY_PLATFORM: Record<string, string> = {
  naver_news: 'news_items',
  naver_blog: 'sns_items',
  youtube: 'sns_items',
  naver_stock: 'community_items',
  dcinside: 'community_items',
};

export async function POST(request: NextRequest) {
  // 호출자 권한 검증 — super_admin/admin 만 허용
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: '인증 필요' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    return NextResponse.json({ detail: '관리자 권한 필요' }, { status: 403 });
  }

  const body = await request.json();
  const { platform_id, id } = body;
  if (!platform_id || !id) {
    return NextResponse.json({ detail: 'platform_id, id 필수' }, { status: 400 });
  }

  const table = TABLE_BY_PLATFORM[platform_id];
  if (!table) {
    return NextResponse.json({ detail: `알 수 없는 platform: ${platform_id}` }, { status: 400 });
  }

  // service_role 로 업데이트 (RLS 우회 안정성)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await admin
    .from(table)
    .update({ critical_type: null, critical_reason: null })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ id, platform_id, cleared: true });
}
