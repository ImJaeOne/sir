import { useQuery } from '@tanstack/react-query';
import { getClusterItems } from '@/lib/api/newsApi';

const crawlKeys = {
  clusterItems: (clusterId: string) => ['crawl', 'clusterItems', clusterId] as const,
};

export function useClusterItems(clusterId: string) {
  return useQuery({
    queryKey: crawlKeys.clusterItems(clusterId),
    queryFn: () => getClusterItems(clusterId),
    enabled: !!clusterId,
  });
}
