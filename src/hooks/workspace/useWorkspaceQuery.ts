import { useEffect } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { getWorkspaces, getWorkspace, getWorkspaceProfile, getReports, getReportProgress } from '@/lib/api/workspaceApi';
import { getActiveSubscription, getSubscriptionStatus } from '@/lib/api/subscriptionApi';
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

/** 구독 상태 — active / grace / expired (#S4) */
export function useSubscriptionStatus(workspaceId: string) {
  return useQuery({
    queryKey: [...workspaceKeys.subscription(workspaceId), 'status'],
    queryFn: () => getSubscriptionStatus(workspaceId),
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

/**
 * sessions + session_strategies 변경 시 progress & reports 캐시 자동 갱신.
 * isActive=false 면 채널을 열지 않음 — 진행 중 세션/전략이 없을 땐 WAL 폴링 비용을 안 낸다.
 */
export function useReportRealtimeSync(workspaceId: string, isActive: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId || !isActive) return;

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
  }, [workspaceId, queryClient, isActive]);
}
