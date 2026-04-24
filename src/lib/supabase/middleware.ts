import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');
  const isCallback = pathname.startsWith('/auth/callback');

  // 미인증 사용자 → 로그인 페이지로 리다이렉트
  if (!user && !isAuthPage && !isCallback) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // 인증된 사용자 → 역할 기반 라우팅
  if (user) {
    // auth 페이지 접근 → 역할에 따라 리다이렉트
    if (isAuthPage) {
      const role = await getUserRole(supabase, user.id);
      const url = request.nextUrl.clone();
      url.pathname = role === 'user' ? '/' : '/workspace';
      return NextResponse.redirect(url);
    }

    // user 역할은 관리자 페이지 접근 차단 (/workspace, /risk-reports, /users)
    const isAdminRoute = pathname.startsWith('/workspace') || pathname.startsWith('/risk-reports') || pathname.startsWith('/users');
    if (isAdminRoute) {
      const role = await getUserRole(supabase, user.id);
      if (role === 'user') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // / (홈) — user 역할은 (app) 레이아웃(관리자 사이드바) 진입 자체를 막고
    // 본인 최신 published report 로 직접 이동. admin/super_admin 은 (app)/page.tsx 가 홈 대시보드 렌더.
    if (pathname === '/') {
      const role = await getUserRole(supabase, user.id);
      if (role === 'user') {
        const target = await resolveUserReportPath(supabase, user.id);
        if (target) {
          const url = request.nextUrl.clone();
          url.pathname = target;
          return NextResponse.redirect(url);
        }
        // 배정/발행 없는 경우는 (app)/page.tsx 의 안내 메시지가 그대로 렌더되게 통과
      }
    }
  }

  return supabaseResponse;
}

// 역할 조회 (캐시 없이 매번 조회 — middleware는 서버에서 실행)
async function getUserRole(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? 'user';
}

// user 역할의 기본 진입 경로 = 본인 첫 워크스페이스의 최신 published report
async function resolveUserReportPath(supabase: any, userId: string): Promise<string | null> {
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
