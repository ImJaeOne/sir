import { useQuery } from '@tanstack/react-query';
import { getSessions, getSession } from '@/lib/api/sessionApi';

export function useSessions(workspaceId: string) {
  return useQuery({
    queryKey: ['sessions', workspaceId],
    queryFn: () => getSessions(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
  });
}
