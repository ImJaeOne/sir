import { useQuery } from '@tanstack/react-query';
import {
  getWeeklySummary,
  getSirStockData,
  getSirRanking,
  getChannelStats,
  getChannelItems,
  getNewsClusters,
  getRiskItems,
  getStrategies,
  getSearchTrend,
} from '@/lib/api/reportApi';
import type { ChannelStat, ChannelItem, RiskItem } from '@/lib/api/reportApi';
import { workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import { getWorkspace } from '@/lib/api/workspaceApi';

export const reportKeys = {
  summary: (id: string) => ['report', id, 'summary'] as const,
  sirStock: (id: string) => ['report', id, 'sirStock'] as const,
  sirRanking: (id: string) => ['report', id, 'sirRanking'] as const,
  channelItems: (id: string) => ['report', id, 'channelItems'] as const,
  newsClusters: (id: string) => ['report', id, 'newsClusters'] as const,
  channelStats: (id: string) => ['report', id, 'channelStats'] as const,
  riskItems: (id: string) => ['report', id, 'riskItems'] as const,
  strategies: (id: string) => ['report', id, 'strategies'] as const,
  searchTrend: (id: string, days: number, endDate?: string) => ['report', id, 'searchTrend', days, endDate] as const,
};

// 리포트 데이터는 주간 보고서 — 페이지 내 refetch 불필요, 캐시 공유 극대화
const REPORT_OPTS = {
  staleTime: Infinity,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// ── 기초 쿼리 (네트워크 요청) ──

/** workspace sir_score — workspaceKeys 캐시 재사용 */
export function useWorkspaceSir(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => getWorkspace(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

/** 총평 — session_strategies(platform_id=null) */
export function useWeeklySummary(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.summary(workspaceId),
    queryFn: () => getWeeklySummary(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useSirStockData(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.sirStock(workspaceId),
    queryFn: () => getSirStockData(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useSirRanking(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.sirRanking(workspaceId),
    queryFn: () => getSirRanking(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

/** 모든 관련 아이템 — channelStats, sentimentDetail, topContent에서 공유 */
export function useChannelItems(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.channelItems(workspaceId),
    queryFn: () => getChannelItems(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useNewsClusters(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.newsClusters(workspaceId),
    queryFn: () => getNewsClusters(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

/** channelItems에서 파생 — channelItems 캐시 필요 */
export function useChannelStats(workspaceId: string, channelItems?: ChannelItem[]) {
  return useQuery({
    queryKey: reportKeys.channelStats(workspaceId),
    queryFn: () => getChannelStats(workspaceId, channelItems!),
    enabled: !!workspaceId && !!channelItems,
    ...REPORT_OPTS,
  });
}

export function useRiskItems(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.riskItems(workspaceId),
    queryFn: () => getRiskItems(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useStrategies(workspaceId: string) {
  return useQuery({
    queryKey: reportKeys.strategies(workspaceId),
    queryFn: () => getStrategies(workspaceId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useSearchTrend(workspaceId: string, days: number = 30, endDate?: string) {
  return useQuery({
    queryKey: reportKeys.searchTrend(workspaceId, days, endDate),
    queryFn: () => getSearchTrend(workspaceId, days, endDate),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}
