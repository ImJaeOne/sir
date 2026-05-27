import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceListClient } from './WorkspaceListClient';

// RLS 개방(031) 이후 클라이언트 `workspaces` SELECT 가 전체를 반환하므로
// admin 역할은 workspace_members 에 등록된 워크스페이스만 보이도록 서버에서 스코프 계산.
export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  let assignedIds: string[] | null = null;
  if (user.role === 'admin') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('profile_id', user.id);
    assignedIds = (data ?? []).map((row) => row.workspace_id);
  }

  return <WorkspaceListClient assignedIds={assignedIds} />;
}
