import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkspaceProfile } from '@/lib/api/workspaceApi';
import { retryFailedReport, regenerateReport } from '@/lib/api/reportApi';
import { workspaceKeys } from '@/hooks/workspace/workspaceKeys';

export function useUpdateWorkspaceProfile(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: { industry?: string | null; business_summary?: string | null }) =>
      updateWorkspaceProfile(workspaceId, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.profile(workspaceId) });
    },
  });
}

/** 보고서 내 실패 플랫폼 일괄 재시도 — 성공 시 자동 regenerate 까지 이어짐 */
export function useRetryFailedReport(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => retryFailedReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
    },
  });
}

/** 전략·총평만 재생성 — sessions 가 모두 done 인데 session_strategies 만 failed 인 경우용. */
export function useRegenerateReport(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => regenerateReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
    },
  });
}
