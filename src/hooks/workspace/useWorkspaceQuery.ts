import { useEffect } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { getWorkspaces, getWorkspace, getWorkspaceProfile, getReports, getReportProgress } from '@/lib/api/workspaceApi';
import { getActiveSubscription } from '@/lib/api/subscriptionApi';
import { createClient } from '@/lib/supabase/client';
import { workspaceKeys } from './workspaceKeys';

/** 워크스페이스의 현재 활성 구독 조회 — has_daily 등 분기용 */
export function useWorkspaceSubscription(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.subscription(workspaceId),
    queryFn: () => getActiveSubscription(workspaceId),
    enabled: !!workspaceId,
  });
}

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

// ── Suspense 변형 ──
// 보고서 상세 페이지처럼 '모든 데이터 준비 후 한 번에 렌더' 플로우 전용.
// 호출 측은 <Suspense fallback={...}> 경계 안에 있어야 한다.

export function useWorkspaceSuspense(id: string) {
  return useSuspenseQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => getWorkspace(id),
  });
}

export function useReportProgressSuspense(workspaceId: string) {
  return useSuspenseQuery({
    queryKey: workspaceKeys.progress(workspaceId),
    queryFn: () => getReportProgress(workspaceId),
  });
}

/** 어느 워크스페이스든 sessions/reports 가 바뀌면 목록 카드의 상태 칩·stripe 를 갱신 */
export function useWorkspacesRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('workspaces-list-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
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
