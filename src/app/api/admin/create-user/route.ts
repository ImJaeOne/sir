import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, company_name } = body;

  if (!email || !password || !company_name) {
    return NextResponse.json({ detail: '이메일, 비밀번호, 회사명은 필수입니다' }, { status: 400 });
  }

  // 1. Auth 유저 생성
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { company_name },
  });

  if (error) {
    return NextResponse.json({ detail: error.message }, { status: 400 });
  }

  const userId = data.user.id;

  // 2. user_profiles에 company_name 업데이트
  await supabaseAdmin
    .from('user_profiles')
    .update({ company_name })
    .eq('id', userId);

  return NextResponse.json({ id: userId, email });
}
