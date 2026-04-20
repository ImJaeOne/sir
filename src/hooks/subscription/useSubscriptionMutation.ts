import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateSubscriptionPeriod,
  type UpdateSubscriptionPeriodInput,
} from '@/lib/api/subscriptionApi';
import { subscriptionKeys } from '@/hooks/subscription/useSubscriptionQuery';

export function useUpdateSubscriptionPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSubscriptionPeriodInput) =>
      updateSubscriptionPeriod(input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.active(vars.workspaceId),
      });
      // 유저 상세 목록에도 구독 정보가 포함되므로 무효화
      queryClient.invalidateQueries({
        queryKey: ['admin', 'users', 'detailed'],
      });
    },
  });
}
