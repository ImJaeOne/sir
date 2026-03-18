import { createClient } from '@/lib/supabase/client';
import type { CrawlSession } from '@/types/news';

const supabase = createClient();

export async function getSessions(workspaceId: string): Promise<CrawlSession[]> {
  const { data, error } = await supabase
    .from('crawl_sessions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrawlSession[];
}
