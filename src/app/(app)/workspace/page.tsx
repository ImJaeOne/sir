import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceListClient } from './WorkspaceListClient';

// RLS 개방(031) 이후 클라이언트 `workspaces` SELECT 가 전체를 반환하므로
// admin 역할은 workspace_members 에 등록된 워크스페이스만 보이도록 서버에서 스코프 계산.
export default async function WorkspacePage() {
  const _t0 = Date.now();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  let assignedIds: string[] | null = null;
  let _membersMs = 0;
  if (user.role === 'admin') {
    const supabase = await createClient();
    const _tM = Date.now();
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('profile_id', user.id);
    _membersMs = Date.now() - _tM;
    assignedIds = (data ?? []).map((row) => row.workspace_id);
  }
  console.log(`[NAV] page /workspace: ${Date.now() - _t0}ms (members=${_membersMs}ms)`);

  return <WorkspaceListClient assignedIds={assignedIds} />;
}
