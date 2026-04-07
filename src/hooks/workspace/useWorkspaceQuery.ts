import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkspaces, getWorkspace, getWorkspaceProfile, getReports, getReportProgress } from '@/lib/api/workspaceApi';
import { createClient } from '@/lib/supabase/client';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
  profile: (id: string) => ['workspaces', id, 'profile'] as const,
  reports: (id: string) => ['workspaces', id, 'reports'] as const,
  progress: (id: string) => ['workspaces', id, 'progress'] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: getWorkspaces,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => getWorkspace(id),
    enabled: !!id,
  });
}

export function useWorkspaceProfile(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.profile(workspaceId),
    queryFn: () => getWorkspaceProfile(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useReports(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.reports(workspaceId),
    queryFn: () => getReports(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useReportProgress(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.progress(workspaceId),
    queryFn: () => getReportProgress(workspaceId),
    enabled: !!workspaceId,
  });
}

/** sessions + session_strategies 변경 시 progress & reports 캐시 자동 갱신 */
export function useReportRealtimeSync(workspaceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`workspace-progress-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_strategies',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: workspaceKeys.reports(workspaceId) });
          queryClient.invalidateQueries({ queryKey: workspaceKeys.progress(workspaceId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);
}
