import { createClient } from '@/lib/supabase/client';
import { createPlatforms } from '@/lib/api/platformApi';
import { workspaceSchema, createWorkspaceSchema } from '@/types/workspace';
import type { Workspace, CreateWorkspaceDto } from '@/types/workspace';

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
  const { platform_ids, ...workspaceData } = validated;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ ...workspaceData, auth_id: user.id })
    .select()
    .single();

  if (wsError) throw wsError;

  const result = workspaceSchema.parse(workspace);

  if (platform_ids.length > 0) {
    await createPlatforms(result.id, platform_ids);
  }

  return result;
}
