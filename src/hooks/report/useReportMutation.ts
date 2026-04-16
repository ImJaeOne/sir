import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { upsertWeeklySummary, updateStrategies } from '@/lib/api/reportApi';
import { reportKeys } from '@/hooks/report/useReportQuery';
import type { SummarySection, StrategyGroup } from '@/lib/api/reportApi';

// ── 주간 총평 수정 ──

export function useUpdateSummary(workspaceId: string, reportId: string) {
  const queryClient = useQueryClient();
  const queryKey = [...reportKeys.summary(workspaceId), reportId];

  return useMutation({
    mutationFn: (sections: SummarySection[]) =>
      upsertWeeklySummary(workspaceId, reportId, sections),
    onMutate: async (sections) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SummarySection[]>(queryKey);
      queryClient.setQueryData(queryKey, sections);
      return { previous };
    },
    onError: (_err, _sections, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('총평 수정에 실패했습니다.');
    },
    onSuccess: () => {
      toast.success('총평 수정에 성공했습니다.');
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey });
    },
  });
}

// ── 대응 전략 수정 ──

export function useUpdateStrategies(workspaceId: string, reportId: string) {
  const queryClient = useQueryClient();
  const queryKey = [...reportKeys.strategies(workspaceId), reportId];

  return useMutation({
    mutationFn: (strategies: StrategyGroup[]) =>
      updateStrategies(workspaceId, reportId, strategies),
    onMutate: async (strategies) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StrategyGroup[]>(queryKey);
      queryClient.setQueryData(queryKey, strategies);
      return { previous };
    },
    onError: (_err, _strategies, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('전략 수정에 실패했습니다.');
    },
    onSuccess: () => {
      toast.success('전략 수정에 성공했습니다.');
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey });
    },
  });
}
