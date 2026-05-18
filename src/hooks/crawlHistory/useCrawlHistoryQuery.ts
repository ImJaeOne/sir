import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  getCrawlHistory,
  getRetentionMode,
  getWorkspaceSessions,
  type CrawlHistoryChannel,
  type CrawlHistoryFilters,
} from '@/lib/api/crawlHistoryApi';
import { crawlHistoryKeys } from './crawlHistoryKeys';

export function useCrawlHistory(
  filters: CrawlHistoryFilters,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: crawlHistoryKeys.list(filters, page, pageSize),
    queryFn: () => getCrawlHistory(filters, page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useWorkspaceSessions(workspaceId: string, channel: CrawlHistoryChannel) {
  return useQuery({
    queryKey: crawlHistoryKeys.sessions(workspaceId, channel),
    queryFn: () => getWorkspaceSessions(workspaceId, channel),
    enabled: !!workspaceId,
  });
}

export function useRetentionMode() {
  return useQuery({
    queryKey: crawlHistoryKeys.retentionMode(),
    queryFn: getRetentionMode,
    staleTime: 60_000,
  });
}
