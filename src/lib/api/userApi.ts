import { createClient } from '@/lib/supabase/client';
import type { ProfileRole } from '@/types/auth';

const supabase = createClient();

// ── 유저 목록 ──

export interface UserProfile {
  id: string;
  email: string;
  company_name: string;
  role: ProfileRole;
  created_at: string;
}

export async function getUsers(): Promise<UserProfile[]> {
  const { data } = await supabase
    .from('user_profiles')
    .select('id, email, company_name, role, created_at')
    .order('created_at', { ascending: false });
  return (data ?? []) as UserProfile[];
}

// ── 유저 생성 (Route Handler 경유) ──

export async function createUser(params: {
  email: string;
  password: string;
  company_name: string;
}): Promise<{ id: string; email: string }> {
  const res = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail ?? '계정 생성 실패');
  }
  return res.json();
}

// ── 현재 유저 역할 ──

export async function getCurrentRole(): Promise<ProfileRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'user';
  const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
  return (data?.role ?? 'user') as ProfileRole;
}

// ── 역할 변경 ──

export async function updateUserRole(userId: string, role: ProfileRole): Promise<void> {
  const { error } = await supabase.from('user_profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

// ── 워크스페이스 멤버 ──

export interface WorkspaceMember {
  workspace_id: string;
  profile_id: string;
  role: string;
}

export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const { data } = await supabase.from('workspace_members').select('workspace_id, profile_id, role');
  return (data ?? []) as WorkspaceMember[];
}

export async function assignWorkspace(workspaceId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from('workspace_members').insert({ workspace_id: workspaceId, profile_id: profileId, role: 'viewer' });
  if (error) throw error;
}

export async function removeWorkspace(workspaceId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('profile_id', profileId);
  if (error) throw error;
}
