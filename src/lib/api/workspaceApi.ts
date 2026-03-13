import { createClient } from '@/lib/supabase/client';
import { createPlatforms } from '@/lib/api/platformApi';
import type { Workspace, CreateWorkspaceDto } from '@/types/workspace';

const supabase = createClient();

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { platform_ids, ...workspaceData } = dto;

  // 워크스페이스 생성
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ ...workspaceData, auth_id: user.id })
    .select()
    .single();

  if (wsError) throw wsError;

  if (platform_ids.length > 0) {
    await createPlatforms(workspace.id, platform_ids);
  }

  return workspace;
}
