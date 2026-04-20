import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  upsertWeeklySummary,
  updateStrategies,
  clearCriticalType,
  deleteRiskReport,
  submitRiskReport,
} from '@/lib/api/reportApi';
import { reportKeys } from '@/hooks/report/useReportQuery';
import type {
  SummarySection,
  StrategyGroup,
  RiskItem,
  SubmitRiskReportInput,
} from '@/lib/api/reportApi';

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

// ── 리스크 해제 (관리자) ──

export function useClearCriticalType(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: RiskItem) => clearCriticalType(item.platform_id, item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.riskItems(workspaceId) });
      toast.success('리스크 분류를 해제했습니다.');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '리스크 해제에 실패했습니다.');
    },
  });
}

// ── 신고 대행 취소 ──

export function useDeleteRiskReport(workspaceId: string, reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (riskReportId: string) => deleteRiskReport(riskReportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(workspaceId, reportId) });
      toast.success('신고가 취소되었습니다.');
    },
    onError: () => {
      toast.error('신고 대행 취소에 실패했습니다.');
    },
  });
}

// ── 신고 대행 요청 ──

export function useSubmitRiskReport(workspaceId: string, reportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SubmitRiskReportInput, 'workspaceId' | 'reportId'>) =>
      submitRiskReport({ ...input, workspaceId, reportId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.riskReports(workspaceId, reportId) });
      toast.success('신고 대행 요청이 접수되었습니다.');
    },
    onError: () => {
      toast.error('신고 요청에 실패했습니다.');
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
