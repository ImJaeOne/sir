import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { crawlItemSchema, clusterSchema, strategySchema } from '@/types/news';
import type { CrawlItem, Cluster, Strategy } from '@/types/news';

const supabase = createClient();

export interface CrawlData {
  crawlItems: CrawlItem[];
  clusters: Cluster[];
  strategy: Strategy | null;
}

async function fetchCrawlData(sessionId: string): Promise<CrawlData> {
  const [itemsRes, clustersRes, strategyRes] = await Promise.all([
    supabase
      .from('crawl_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('published_at', { ascending: false }),
    supabase
      .from('clusters')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_relevant', true)
      .order('article_count', { ascending: false }),
    supabase
      .from('strategies')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  return {
    crawlItems: (itemsRes.data ?? []).map((row) => crawlItemSchema.parse(row)),
    clusters: (clustersRes.data ?? []).map((row) => clusterSchema.parse(row)),
    strategy: strategyRes.data && strategyRes.data.length > 0
      ? strategySchema.parse(strategyRes.data[0])
      : null,
  };
}

export function useCrawlData(sessionId: string) {
  return useQuery({
    queryKey: ['crawlData', sessionId],
    queryFn: () => fetchCrawlData(sessionId),
    enabled: !!sessionId,
  });
}
