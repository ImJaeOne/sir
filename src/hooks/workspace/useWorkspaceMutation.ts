import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace, deleteWorkspace, updateWorkspaceProfile } from '@/lib/api/workspaceApi';
import { retrySession } from '@/lib/api/sessionApi';
import { regenerateReport } from '@/lib/api/reportApi';
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

/** 실패 세션 재시도 — Realtime 구독이 progress 자동 갱신하지만 즉시 반영 위해 invalidate */
export function useRetrySession(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => retrySession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
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
