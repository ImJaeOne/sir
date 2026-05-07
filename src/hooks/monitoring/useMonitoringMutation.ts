import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getMonitoringAiAnalysis, type MonitoringAiAnalysisResult } from '@/lib/api/monitoringApi';
import { monitoringKeys } from './monitoringKeys';

/** AI 분석 — 사용자 클릭 트리거. 결과를 두 query cache 에 저장:
 *   - aiAnalysis(ws, start, end): 같은 (ws, period) 재호출 회피
 *   - aiAnalysisCached(ws): 페이지 새로고침 시 자동 표시되는 query 도 즉시 갱신
 */
export function useMonitoringAiAnalysis(workspaceId: string, start: string, end: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getMonitoringAiAnalysis(workspaceId, start, end),
    onSuccess: (data) => {
      qc.setQueryData<MonitoringAiAnalysisResult>(
        monitoringKeys.aiAnalysis(workspaceId, start, end),
        data,
      );
      qc.setQueryData<MonitoringAiAnalysisResult>(
        monitoringKeys.aiAnalysisCached(workspaceId),
        data,
      );
    },
  });
}
