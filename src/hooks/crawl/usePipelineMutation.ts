import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerPipeline, type TriggerPipelineInput } from '@/lib/api/pipelineApi';
import { workspaceKeys } from '@/hooks/workspace/workspaceKeys';

/** 분석 시작(파이프라인 실행) — 백엔드는 즉시 200, 이후 lock + 비동기 처리.
 *  성공 시 sessions/reports 가 갱신되므로 workspace 단위 reports/progress invalidate. */
export function useTriggerPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TriggerPipelineInput) => triggerPipeline(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(input.workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(input.workspaceId) });
    },
  });
}
