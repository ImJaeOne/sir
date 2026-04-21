import { useQuery } from '@tanstack/react-query';
import {
  getReportInfo,
  getWeeklySummary,
  getSirStockData,
  getSirRanking,
  getChannelStats,
  getChannelItems,
  getNewsClusters,
  getRiskItems,
  getStrategies,
  getSearchTrend,
  getPrevReport,
  getPrevDailySnapshot,
  getRiskReports,
  getResolvedRiskReports,
} from '@/lib/api/reportApi';
import type { ChannelItem } from '@/lib/api/reportApi';
import { workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import { getWorkspace } from '@/lib/api/workspaceApi';

export const reportKeys = {
  info: (reportId: string) => ['report', reportId, 'info'] as const,
  summary: (id: string) => ['report', id, 'summary'] as const,
  sirStock: (id: string) => ['report', id, 'sirStock'] as const,
  sirRanking: (id: string) => ['report', id, 'sirRanking'] as const,
  channelItems: (id: string) => ['report', id, 'channelItems'] as const,
  newsClusters: (id: string) => ['report', id, 'newsClusters'] as const,
  channelStats: (id: string) => ['report', id, 'channelStats'] as const,
  riskItems: (id: string) => ['report', id, 'riskItems'] as const,
  strategies: (id: string) => ['report', id, 'strategies'] as const,
  searchTrend: (id: string, reportId?: string) => ['report', id, 'searchTrend', reportId] as const,
  prevReport: (id: string, reportId: string) => ['report', id, 'prevReport', reportId] as const,
  prevDailySnapshot: (id: string, periodEnd?: string) => ['report', id, 'prevDailySnapshot', periodEnd ?? ''] as const,
  riskReports: (id: string, reportId?: string) => ['report', id, 'riskReports', reportId] as const,
  resolvedRiskReports: (id: string, from: string, to: string) => ['report', id, 'resolvedRiskReports', from, to] as const,
};

// 리포트 데이터는 주간 보고서 — 페이지 내 refetch 불필요, 캐시 공유 극대화
const REPORT_OPTS = {
  staleTime: Infinity,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

/** 리포트 기본 정보 (type, period, status, sir_score) */
export function useReportInfo(reportId: string) {
  return useQuery({
    queryKey: reportKeys.info(reportId),
    queryFn: () => getReportInfo(reportId),
    enabled: !!reportId,
    ...REPORT_OPTS,
  });
}

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
export function useWeeklySummary(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.summary(workspaceId), reportId],
    queryFn: () => getWeeklySummary(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useSirStockData(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.sirStock(workspaceId), reportId],
    queryFn: () => getSirStockData(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useSirRanking(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.sirRanking(workspaceId), reportId],
    queryFn: () => getSirRanking(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

/** 모든 관련 아이템 — channelStats, sentimentDetail, topContent에서 공유 */
export function useChannelItems(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.channelItems(workspaceId), reportId],
    queryFn: () => getChannelItems(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useNewsClusters(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.newsClusters(workspaceId), reportId],
    queryFn: () => getNewsClusters(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

/** channelItems에서 파생 — channelItems 캐시 필요 */
export function useChannelStats(workspaceId: string, channelItems?: ChannelItem[], reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.channelStats(workspaceId), reportId],
    queryFn: () => getChannelStats(workspaceId, channelItems!, reportId),
    enabled: !!workspaceId && !!channelItems,
    ...REPORT_OPTS,
  });
}

export function useRiskItems(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.riskItems(workspaceId), reportId],
    queryFn: () => getRiskItems(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function useStrategies(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: [...reportKeys.strategies(workspaceId), reportId],
    queryFn: () => getStrategies(workspaceId, reportId),
    enabled: !!workspaceId,
    ...REPORT_OPTS,
  });
}

export function usePrevReport(workspaceId: string, reportId: string) {
  return useQuery({
    queryKey: reportKeys.prevReport(workspaceId, reportId),
    queryFn: () => getPrevReport(workspaceId, reportId),
    enabled: !!workspaceId && !!reportId,
    ...REPORT_OPTS,
  });
}

/** daily 보고서 전일 비교용 snapshot (daily_snapshots + items 기반) */
export function usePrevDailySnapshot(workspaceId: string, periodEnd: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.prevDailySnapshot(workspaceId, periodEnd),
    queryFn: () => getPrevDailySnapshot(workspaceId, periodEnd!),
    enabled: enabled && !!workspaceId && !!periodEnd,
    ...REPORT_OPTS,
  });
}

export function useSearchTrend(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: reportKeys.searchTrend(workspaceId, reportId),
    queryFn: () => getSearchTrend(workspaceId, reportId),
    enabled: !!workspaceId && !!reportId,
    ...REPORT_OPTS,
  });
}

export function useRiskReports(workspaceId: string, reportId?: string) {
  return useQuery({
    queryKey: reportKeys.riskReports(workspaceId, reportId),
    queryFn: () => getRiskReports(workspaceId, reportId),
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/** 보고서 기간 내 결과 확정(resolved/rejected)된 신고 — 처리 결과 섹션용 */
export function useResolvedRiskReports(workspaceId: string, periodStart?: string, periodEnd?: string) {
  return useQuery({
    queryKey: reportKeys.resolvedRiskReports(workspaceId, periodStart ?? '', periodEnd ?? ''),
    queryFn: () => getResolvedRiskReports(workspaceId, periodStart!, periodEnd!),
    enabled: !!workspaceId && !!periodStart && !!periodEnd,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
