import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeSubscriptionTier,
  extendSubscription,
  renewSubscription,
  pauseSubscription,
  cancelSubscription,
  correctSubscription,
} from '@/lib/api/subscriptionApi';
import { subscriptionKeys } from '@/hooks/subscription/useSubscriptionQuery';
import { userKeys } from '@/hooks/user/useUserQuery';

function useInvalidateOnSuccess() {
  const queryClient = useQueryClient();
  return (workspaceId: string) => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.active(workspaceId) });
    queryClient.invalidateQueries({ queryKey: userKeys.usersDetailed() });
  };
}

export function useChangeSubscriptionTier() {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: changeSubscriptionTier,
    onSuccess: (_, vars) => invalidate(vars.workspaceId),
  });
}

export function useExtendSubscription() {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: extendSubscription,
    onSuccess: (_, vars) => invalidate(vars.workspaceId),
  });
}

export function useRenewSubscription() {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: renewSubscription,
    onSuccess: (_, vars) => invalidate(vars.workspaceId),
  });
}

export function usePauseSubscription() {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: pauseSubscription,
    onSuccess: (_, vars) => invalidate(vars.workspaceId),
  });
}

export function useCancelSubscription() {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (_, vars) => invalidate(vars.workspaceId),
  });
}

export function useCorrectSubscription(workspaceId: string | undefined) {
  const invalidate = useInvalidateOnSuccess();
  return useMutation({
    mutationFn: correctSubscription,
    onSuccess: () => {
      if (workspaceId) invalidate(workspaceId);
    },
  });
}
