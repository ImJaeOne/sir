import { useQuery } from '@tanstack/react-query';
import {
  getMonitoringDaily,
  getMonitoringStock,
  getMonitoringRisks,
  getMonitoringSearchTrend,
} from '@/lib/api/monitoringApi';
import { monitoringKeys } from './monitoringKeys';

const FIVE_MIN = 5 * 60 * 1000;

/** workspace 의 [start, end] 범위 일별 수집량/감정 시계열. */
export function useMonitoringDaily(workspaceId: string, start: string, end: string) {
  return useQuery({
    queryKey: monitoringKeys.daily(workspaceId, start, end),
    queryFn: () => getMonitoringDaily(workspaceId, start, end),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: FIVE_MIN,
  });
}

/** workspace 의 [start, end] 범위 주가 OHLC 시계열. */
export function useMonitoringStock(workspaceId: string, start: string, end: string) {
  return useQuery({
    queryKey: monitoringKeys.stock(workspaceId, start, end),
    queryFn: () => getMonitoringStock(workspaceId, start, end),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: FIVE_MIN,
  });
}

/** workspace 의 [start, end] 범위 critical_type 별 일자 발생량. */
export function useMonitoringRisks(workspaceId: string, start: string, end: string) {
  return useQuery({
    queryKey: monitoringKeys.risks(workspaceId, start, end),
    queryFn: () => getMonitoringRisks(workspaceId, start, end),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: FIVE_MIN,
  });
}

/** workspace 의 [start, end] 범위 검색 관심도(naver/google) 일자 시계열. */
export function useMonitoringSearch(workspaceId: string, start: string, end: string) {
  return useQuery({
    queryKey: monitoringKeys.search(workspaceId, start, end),
    queryFn: () => getMonitoringSearchTrend(workspaceId, start, end),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: FIVE_MIN,
  });
}
