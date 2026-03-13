import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkspace } from '@/lib/api/workspaceApi';
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
