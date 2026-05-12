import { useQuery } from '@tanstack/react-query';
import {
  getMonitoringDaily,
  getMonitoringStock,
  getMonitoringRisks,
  getMonitoringChannelMatrix,
  getMonitoringAiAnalysisCached,
  getMonitoringLifetimeTotals,
  getMonitoringDayItems,
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

/** 라이프타임 KPI — 기간 탭과 무관한 누적/최신 수치. 상단 카드 3장 전용. */
export function useMonitoringLifetimeTotals(workspaceId: string) {
  return useQuery({
    queryKey: monitoringKeys.lifetimeTotals(workspaceId),
    queryFn: () => getMonitoringLifetimeTotals(workspaceId),
    enabled: !!workspaceId,
    staleTime: FIVE_MIN,
  });
}

/** 차트 데이터 포인트 클릭 → 우측 drawer 에 노출할 그 날(KST) 의 채널별 수집 데이터.
 *  date 가 비어있으면 비활성 (drawer 닫혀있을 때 무용 호출 방지). */
export function useMonitoringDayItems(workspaceId: string, date: string | null) {
  return useQuery({
    queryKey: monitoringKeys.dayItems(workspaceId, date ?? ''),
    queryFn: () => getMonitoringDayItems(workspaceId, date!),
    enabled: !!workspaceId && !!date,
    staleTime: FIVE_MIN,
  });
}
