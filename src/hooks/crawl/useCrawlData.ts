import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { newsItemSchema, clusterSchema, strategySchema, communityItemSchema } from '@/types/news';
import type { NewsItem, Cluster, Strategy, CommunityItem } from '@/types/news';

const supabase = createClient();

export interface CrawlData {
  newsItems: NewsItem[];
  communityItems: CommunityItem[];
  clusters: Cluster[];
  strategies: Strategy[];
}

async function fetchCrawlDataMulti(sessionIds: string[]): Promise<CrawlData> {
  const [newsRes, communityRes, clustersRes, strategyRes] = await Promise.all([
    supabase
      .from('news_items')
      .select('*')
      .in('session_id', sessionIds)
      .order('published_at', { ascending: false }),
    supabase
      .from('community_items')
      .select('*')
      .in('session_id', sessionIds)
      .order('published_at', { ascending: false }),
    supabase
      .from('clusters')
      .select('*')
      .in('session_id', sessionIds)
      .eq('is_relevant', true)
      .order('article_count', { ascending: false }),
    supabase
      .from('strategies')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: false }),
  ]);

  return {
    newsItems: (newsRes.data ?? []).map((row) => newsItemSchema.parse(row)),
    communityItems: (communityRes.data ?? []).map((row) => communityItemSchema.parse(row)),
    clusters: (clustersRes.data ?? []).map((row) => clusterSchema.parse(row)),
    strategies: (strategyRes.data ?? []).map((row) => strategySchema.parse(row)),
  };
}

export function useCrawlData(sessionId: string) {
  return useQuery({
    queryKey: ['crawlData', sessionId],
    queryFn: () => fetchCrawlDataMulti([sessionId]),
    enabled: !!sessionId,
  });
}

export function useCrawlDataMulti(sessionIds: string[]) {
  const key = sessionIds.sort().join(',');
  return useQuery({
    queryKey: ['crawlData', key],
    queryFn: () => fetchCrawlDataMulti(sessionIds),
    enabled: sessionIds.length > 0,
  });
}
