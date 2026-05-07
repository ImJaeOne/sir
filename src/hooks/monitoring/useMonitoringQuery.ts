import { useQuery } from '@tanstack/react-query';
import {
  getMonitoringDaily,
  getMonitoringStock,
  getMonitoringRisks,
  getMonitoringChannelMatrix,
  getMonitoringAiAnalysisCached,
} from '@/lib/api/monitoringApi';
import { monitoringKeys } from './monitoringKeys';

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

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

/** workspace 의 [start, end] 범위 일자×채널×is_relevant×sentiment 매트릭스. E 탭 토글용. */
export function useMonitoringChannelMatrix(workspaceId: string, start: string, end: string) {
  return useQuery({
    queryKey: monitoringKeys.channelMatrix(workspaceId, start, end),
    queryFn: () => getMonitoringChannelMatrix(workspaceId, start, end),
    enabled: !!workspaceId && !!start && !!end,
    staleTime: FIVE_MIN,
  });
}

/** 오늘(KST) 기준으로 DB 에 저장된 AI 분석 캐시 row. 없으면 null.
 *  AiAnalysisCard 가 mount 시 자동 호출 → 이미 분석된 결과를 페이지 진입 즉시 노출. */
export function useMonitoringAiAnalysisCached(workspaceId: string) {
  return useQuery({
    queryKey: monitoringKeys.aiAnalysisCached(workspaceId),
    queryFn: () => getMonitoringAiAnalysisCached(workspaceId),
    enabled: !!workspaceId,
    staleTime: ONE_HOUR,
  });
}
