import { useQuery } from '@tanstack/react-query';
import { getActiveSubscription } from '@/lib/api/subscriptionApi';

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  active: (workspaceId: string) =>
    ['subscriptions', workspaceId, 'active'] as const,
};

export function useActiveSubscription(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? subscriptionKeys.active(workspaceId)
      : ['subscriptions', 'none'],
    queryFn: () => (workspaceId ? getActiveSubscription(workspaceId) : null),
    enabled: !!workspaceId,
  });
}
