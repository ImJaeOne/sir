import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  // super_admin은 middleware에서 /workspace로 리다이렉���됨
  // user → 자기 워크스페이스의 최신 published report로 이동
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', user.id)
    .limit(1);

  if (!membership || membership.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center flex flex-col gap-2">
          <p className="text-lg font-semibold text-slate-700">배정된 워크스페이스가 없습니���</p>
          <p className="text-sm text-slate-400">관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  const workspaceId = membership[0].workspace_id;

  // 최신 published report → client 보고서로 이동
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center flex flex-col gap-2">
        <p className="text-lg font-semibold text-slate-700">아직 발행된 보고서가 없습니다</p>
        <p className="text-sm text-slate-400">관리자에게 문의해주세요.</p>
      </div>
    </div>
  );
}
