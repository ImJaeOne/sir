import { useQuery } from '@tanstack/react-query';
import { getWorkspaces, getWorkspace, getWorkspaceProfile, getReports, getReportProgress } from '@/lib/api/workspaceApi';

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
