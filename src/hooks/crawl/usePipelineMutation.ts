import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerPipeline } from '@/lib/api/pipelineApi';
import { sessionKeys } from '@/hooks/crawl/useSessionQuery';

export function useTriggerPipeline(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerPipeline(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list(workspaceId) });
    },
  });
}
