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
  aiAnalysisLatest: (workspaceId: string) =>
    ['monitoring', workspaceId, 'aiAnalysisLatest'] as const,
  aiAnalysisHistory: (workspaceId: string) =>
    ['monitoring', workspaceId, 'aiAnalysisHistory'] as const,
  aiAnalysisEstimate: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'aiAnalysisEstimate', start, end] as const,
  tokenStatus: (workspaceId: string) =>
    ['monitoring', workspaceId, 'tokenStatus'] as const,
  lifetimeTotals: (workspaceId: string) =>
    ['monitoring', workspaceId, 'lifetimeTotals'] as const,
  dayItems: (workspaceId: string, date: string) =>
    ['monitoring', workspaceId, 'dayItems', date] as const,
};
