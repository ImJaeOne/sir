import { createClient } from '@/lib/supabase/client';
import { newsItemSchema } from '@/types/news';
import type { NewsItem } from '@/types/news';

const supabase = createClient();

export async function getClusterItems(clusterId: string): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('cluster_id', clusterId)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return newsItemSchema.array().parse(data);
}
