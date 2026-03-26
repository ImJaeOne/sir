import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace, updateWorkspaceProfile } from '@/lib/api/workspaceApi';
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
