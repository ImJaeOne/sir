import { createClient } from '@/lib/supabase/client';
import { workspaceSchema, workspaceProfileSchema, createWorkspaceSchema } from '@/types/workspace';
import type { Workspace, WorkspaceProfile, CreateWorkspaceDto } from '@/types/workspace';

const supabase = createClient();

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return workspaceSchema.array().parse(data);
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return workspaceSchema.parse(data);
}

export async function createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
  const validated = createWorkspaceSchema.parse(dto);
  const { profile, ...workspaceData } = validated;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. workspace 생성
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert(workspaceData)
    .select()
    .single();

  if (wsError) throw wsError;

  const result = workspaceSchema.parse(workspace);

  // 2. 멤버 등록 (생성자를 owner로)
  await supabase
    .from('workspace_members')
    .insert({ workspace_id: result.id, profile_id: user.id, role: 'owner' });

  // 3. workspace_profiles upsert (프로필 데이터가 있으면)
  if (profile && (profile.industry || profile.business_summary)) {
    const { error: profileError } = await supabase
      .from('workspace_profiles')
      .upsert({
        workspace_id: result.id,
        industry: profile.industry ?? null,
        business_summary: profile.business_summary ?? null,
      }, { onConflict: 'workspace_id' });

    if (profileError) {
      await supabase.from('workspaces').delete().eq('id', result.id);
      throw profileError;
    }
  }

  // 4. 주가 데이터 수집 (30일, 백그라운드)
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/collect/stock-prices?workspace_id=${result.id}`)
    .catch(() => {});

  return result;
}

export async function getWorkspaceProfile(workspaceId: string): Promise<WorkspaceProfile | null> {
  const { data, error } = await supabase
    .from('workspace_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data ? workspaceProfileSchema.parse(data) : null;
}

export async function updateWorkspaceProfile(
  workspaceId: string,
  profile: { industry?: string | null; business_summary?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('workspace_profiles')
    .upsert({
      workspace_id: workspaceId,
      industry: profile.industry ?? null,
      business_summary: profile.business_summary ?? null,
    }, { onConflict: 'workspace_id' });

  if (error) throw error;
}
