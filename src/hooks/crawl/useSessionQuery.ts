import { useQuery } from '@tanstack/react-query';
import { getSessions } from '@/lib/api/sessionApi';

export function useSessions(workspaceId: string) {
  return useQuery({
    queryKey: ['sessions', workspaceId],
    queryFn: () => getSessions(workspaceId),
    enabled: !!workspaceId,
  });
}
