import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { loadAdminHome, parseAdminHomeWindow } from '@/lib/adminHome/queries';
import {
  AutomationFailureCard,
  RiskDigestCard,
  WorkspaceAlertsCard,
} from '@/components/admin-home/AdminHomeSections';
import { AdminHomeWindowToggle } from '@/components/admin-home/AdminHomeWindowToggle';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const _t0 = Date.now();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  // user 역할 분기는 (app)/layout.tsx 에서 처리되므로 여기선 admin/super_admin 만 도달.

  const sp = await searchParams;
  const windowHours = parseAdminHomeWindow(sp.window);
  const _tHome0 = Date.now();
  const data = await loadAdminHome(user.role, user.id, windowHours);
  const _homeMs = Date.now() - _tHome0;
  console.log(`[NAV] page / : ${Date.now() - _t0}ms (loadAdminHome=${_homeMs}ms)`);
  const greetingName = user.companyName || user.email.split('@')[0];
  const roleLabel = user.role === 'super_admin' ? '최고 관리자' : '관리자';

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs sm:text-sm text-slate-500">{roleLabel} 홈</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            안녕하세요, {greetingName}님
          </h1>
        </div>
        <AdminHomeWindowToggle current={data.windowHours} generatedAt={data.generatedAt} />
      </header>

      <AutomationFailureCard data={data} />
      <RiskDigestCard data={data} />
      <WorkspaceAlertsCard data={data} />
    </main>
  );
}
