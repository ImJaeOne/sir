import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { loadAdminHome } from '@/lib/adminHome/queries';
import {
  AutomationFailureCard,
  RiskDigestCard,
  WorkspaceAlertsCard,
} from '@/components/admin-home/AdminHomeSections';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  console.info('[HomePage] user.role=', user.role, 'id=', user.id, 'email=', user.email);

  // user 역할 — 본인 워크스페이스의 최신 published report 로 이동
  if (user.role === 'user') {
    const supabase = await createClient();
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('profile_id', user.id)
      .limit(1);

    if (!membership || membership.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center flex flex-col gap-2">
            <p className="text-lg font-semibold text-slate-700">배정된 워크스페이스가 없습니다</p>
            <p className="text-sm text-slate-400">관리자에게 문의해주세요.</p>
          </div>
        </div>
      );
    }

    const workspaceId = membership[0].workspace_id;
    const { data: reports } = await supabase
      .from('reports')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'published')
      .order('period_end', { ascending: false })
      .limit(1);

    if (reports && reports.length > 0) {
      redirect(`/report/${workspaceId}/${reports[0].id}`);
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center flex flex-col gap-2">
          <p className="text-lg font-semibold text-slate-700">아직 발행된 보고서가 없습니다</p>
          <p className="text-sm text-slate-400">관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  // admin / super_admin — 관리자 홈 대시보드
  const data = await loadAdminHome(user.role, user.id);
  const greetingName = user.companyName || user.email.split('@')[0];
  const roleLabel = user.role === 'super_admin' ? '최고 관리자' : '관리자';

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-0.5">
        <p className="text-xs sm:text-sm text-slate-500">{roleLabel} 홈</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          안녕하세요, {greetingName}님
        </h1>
      </header>

      <AutomationFailureCard data={data} />
      <RiskDigestCard data={data} />
      <WorkspaceAlertsCard data={data} />
    </main>
  );
}
