import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace, deleteWorkspace, updateWorkspaceProfile } from '@/lib/api/workspaceApi';
import { regenerateReport, retryFailedReport } from '@/lib/api/reportApi';
import { workspaceKeys } from '@/hooks/workspace/useWorkspaceQuery';
import type { CreateWorkspaceDto } from '@/types/workspace';

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWorkspaceDto) => createWorkspace(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
}

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

/** 리포트 finalize 재생성 — 플랫폼 전원 done 이어야 성공 */
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
