import { createClient } from '@/lib/supabase/client';
import type { Platform, WorkspacePlatform } from '@/types/platform';

const supabase = createClient();

export async function getPlatforms(): Promise<Platform[]> {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('is_active', true)
    .order('category');

  if (error) throw error;
  return data;
}

export async function getPlatformsByWorkspace(workspaceId: string): Promise<WorkspacePlatform[]> {
  const { data, error } = await supabase
    .from('workspace_platforms')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) throw error;
  return data;
}

export async function createPlatforms(workspaceId: string, platformIds: string[]) {
  const { error } = await supabase
    .from('workspace_platforms')
    .insert(platformIds.map((platform_id) => ({
      workspace_id: workspaceId,
      platform_id,
    })));

  if (error) throw error;
}

export async function deletePlatform(workspaceId: string, platformId: string) {
  const { error } = await supabase
    .from('workspace_platforms')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('platform_id', platformId);

  if (error) throw error;
}
