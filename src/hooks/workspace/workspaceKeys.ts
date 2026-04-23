export const workspaceKeys = {
  all: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
  profile: (id: string) => ['workspaces', id, 'profile'] as const,
  reports: (id: string) => ['workspaces', id, 'reports'] as const,
  progress: (id: string) => ['workspaces', id, 'progress'] as const,
  subscription: (id: string) => ['workspaces', id, 'subscription'] as const,
};
