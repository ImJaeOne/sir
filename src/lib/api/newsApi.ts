import { createClient } from '@/lib/supabase/client';
import { crawlItemSchema, clusterSchema, strategySchema } from '@/types/news';
import type { CrawlItem, Cluster, Strategy } from '@/types/news';

const supabase = createClient();

export async function getClusters(workspaceId: string): Promise<Cluster[]> {
  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_relevant', true)
    .order('article_count', { ascending: false });

  if (error) throw error;
  return clusterSchema.array().parse(data);
}

export async function getClusterItems(clusterId: string): Promise<CrawlItem[]> {
  const { data, error } = await supabase
    .from('crawl_items')
    .select('*')
    .eq('cluster_id', clusterId)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return crawlItemSchema.array().parse(data);
}

export async function getStandaloneItems(workspaceId: string): Promise<CrawlItem[]> {
  const { data, error } = await supabase
    .from('crawl_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform_id', 'news')
    .is('cluster_id', null)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return crawlItemSchema.array().parse(data);
}

export async function getLatestStrategy(workspaceId: string): Promise<Strategy | null> {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform_id', 'news')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return strategySchema.parse(data[0]);
}
