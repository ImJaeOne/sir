import { useQuery } from '@tanstack/react-query';
import { getSessions, getSession, getSessionsByDate } from '@/lib/api/sessionApi';

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (workspaceId: string) => ['sessions', workspaceId] as const,
  detail: (sessionId: string) => ['session', sessionId] as const,
  byDate: (workspaceId: string, dateKey: string) => ['sessions', workspaceId, dateKey] as const,
};

const ACTIVE_STATUSES = new Set(['crawling', 'analyzing', 'clustering']);

export function useSessions(workspaceId: string, forcePolling = false) {
  return useQuery({
    queryKey: sessionKeys.list(workspaceId),
    queryFn: () => getSessions(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      if (forcePolling) return 3_000;
      const sessions = query.state.data;
      if (!sessions?.length) return false;
      const hasActive = sessions.some((s) => ACTIVE_STATUSES.has(s.status));
      return hasActive ? 3_000 : false;
    },
  });
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useSessionsByDate(workspaceId: string, dateKey: string) {
  return useQuery({
    queryKey: sessionKeys.byDate(workspaceId, dateKey),
    queryFn: () => getSessionsByDate(workspaceId, dateKey),
    enabled: !!workspaceId && !!dateKey,
  });
}
