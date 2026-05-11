export const monitoringKeys = {
  all: ['monitoring'] as const,
  daily: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'daily', start, end] as const,
  stock: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'stock', start, end] as const,
  risks: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'risks', start, end] as const,
  searchLive365: (workspaceId: string) =>
    ['monitoring', workspaceId, 'searchLive365'] as const,
  channelMatrix: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'channelMatrix', start, end] as const,
  aiAnalysis: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'aiAnalysis', start, end] as const,
  aiAnalysisCached: (workspaceId: string) =>
    ['monitoring', workspaceId, 'aiAnalysisCached'] as const,
  lifetimeTotals: (workspaceId: string) =>
    ['monitoring', workspaceId, 'lifetimeTotals'] as const,
};
