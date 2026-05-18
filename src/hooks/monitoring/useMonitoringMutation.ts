import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getMonitoringAiAnalysis, type MonitoringAiAnalysisResult } from '@/lib/api/monitoringApi';
import { monitoringKeys } from './monitoringKeys';

/** AI 분석 — 모달에서 사용자가 기간 확정 후 호출. 매 호출 신규 분석 + 토큰 차감.
 *  결과를 latest cache 에 즉시 반영 → 카드의 default 표시가 새 결과로 갱신.
 *  잔여량이 바뀌므로 estimate 캐시는 모두 invalidate (다음 모달 오픈 시 신선한 잔여량).
 */
export function useMonitoringAiAnalysis(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { start: string; end: string }) =>
      getMonitoringAiAnalysis(workspaceId, vars.start, vars.end),
    onSuccess: (data) => {
      qc.setQueryData<MonitoringAiAnalysisResult>(
        monitoringKeys.aiAnalysisLatest(workspaceId),
        data,
      );
      qc.invalidateQueries({ queryKey: ['monitoring', workspaceId, 'aiAnalysisEstimate'] });
      qc.invalidateQueries({ queryKey: monitoringKeys.tokenStatus(workspaceId) });
      qc.invalidateQueries({ queryKey: monitoringKeys.aiAnalysisHistory(workspaceId) });
    },
  });
}
