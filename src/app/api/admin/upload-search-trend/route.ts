import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface TrendPoint {
  date: string;
  ratio: number;
}

interface Body {
  report_id: string;
  workspace_id: string;
  provider: 'google' | 'naver';
  trend_data: TrendPoint[];
}

export async function POST(request: NextRequest) {
  // 호출자 권한 검증 — super_admin / admin 만 허용
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const body = (await request.json()) as Body;
  const { report_id, workspace_id, provider, trend_data } = body;

  if (!report_id || !workspace_id || !provider || !Array.isArray(trend_data)) {
    return NextResponse.json({ detail: '필수 필드 누락' }, { status: 400 });
  }
  if (provider !== 'google' && provider !== 'naver') {
    return NextResponse.json({ detail: 'provider 는 google 또는 naver' }, { status: 400 });
  }
  if (trend_data.length === 0) {
    return NextResponse.json({ detail: '빈 데이터' }, { status: 400 });
  }
  // 스키마 검증 — 각 row 는 { date: 'YYYY-MM-DD', ratio: number }
  for (const p of trend_data) {
    if (
      typeof p?.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
      typeof p?.ratio !== 'number' ||
      !Number.isFinite(p.ratio)
    ) {
      return NextResponse.json({ detail: 'trend_data 형식 오류' }, { status: 400 });
    }
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await admin.from('search_trends').upsert(
    {
      report_id,
      workspace_id,
      provider,
      trend_data,
    },
    { onConflict: 'report_id,provider' },
  );

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: trend_data.length });
}
