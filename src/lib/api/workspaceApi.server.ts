import { createClient } from '@/lib/supabase/server';
import { workspaceSchema } from '@/types/workspace';
import type { Workspace } from '@/types/workspace';

export async function getWorkspaceServer(id: string): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? workspaceSchema.parse(data) : null;
}
