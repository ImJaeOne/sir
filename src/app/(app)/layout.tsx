import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { resolveUserReportPath } from '@/lib/auth/resolveLandingPath';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/ui/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const _t0 = Date.now();
  const user = await getCurrentUser();

  // user 역할은 관리자 AppShell 에 절대 진입 불가. middleware/로그인 액션이 먼저 잡지만,
  // 레이아웃에서 한 번 더 가드해 관리자 사이드바가 잠깐이라도 렌더되는 걸 차단.
  if (user?.role === 'user') {
    const supabase = await createClient();
    const target = (await resolveUserReportPath(supabase, user.id)) ?? '/no-report';
    console.log(`[NAV] (app)/layout: ${Date.now() - _t0}ms (redirect=user-report)`);
    redirect(target);
  }

  console.log(`[NAV] (app)/layout: ${Date.now() - _t0}ms`);
  return <AppShell user={user}>{children}</AppShell>;
}
