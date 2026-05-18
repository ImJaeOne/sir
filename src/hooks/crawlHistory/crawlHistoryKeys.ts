import type { CrawlHistoryFilters } from '@/lib/api/crawlHistoryApi';

export const crawlHistoryKeys = {
  all: ['crawlHistory'] as const,
  list: (filters: CrawlHistoryFilters, page: number, pageSize: number) =>
    ['crawlHistory', 'list', filters, page, pageSize] as const,
  sessions: (workspaceId: string, channel: string) =>
    ['crawlHistory', 'sessions', workspaceId, channel] as const,
  retentionMode: () => ['crawlHistory', 'retentionMode'] as const,
};
