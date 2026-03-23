import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { newsItemSchema, clusterSchema, strategySchema } from '@/types/news';
import type { NewsItem, Cluster, Strategy } from '@/types/news';

const supabase = createClient();

export interface CrawlData {
  newsItems: NewsItem[];
  clusters: Cluster[];
  strategy: Strategy | null;
}

async function fetchCrawlData(sessionId: string): Promise<CrawlData> {
  const [itemsRes, clustersRes, strategyRes] = await Promise.all([
    supabase
      .from('news_items')
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
    newsItems: (itemsRes.data ?? []).map((row) => newsItemSchema.parse(row)),
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
