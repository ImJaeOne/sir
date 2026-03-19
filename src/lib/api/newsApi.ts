import { createClient } from '@/lib/supabase/client';
import { crawlItemSchema } from '@/types/news';
import type { CrawlItem } from '@/types/news';

const supabase = createClient();

export async function getClusterItems(clusterId: string): Promise<CrawlItem[]> {
  const { data, error } = await supabase
    .from('crawl_items')
    .select('*')
    .eq('cluster_id', clusterId)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return crawlItemSchema.array().parse(data);
}
