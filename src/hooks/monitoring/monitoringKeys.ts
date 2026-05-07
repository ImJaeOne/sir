export const monitoringKeys = {
  all: ['monitoring'] as const,
  daily: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'daily', start, end] as const,
  stock: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'stock', start, end] as const,
  risks: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'risks', start, end] as const,
  search: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'search', start, end] as const,
  channelMatrix: (workspaceId: string, start: string, end: string) =>
    ['monitoring', workspaceId, 'channelMatrix', start, end] as const,
};
