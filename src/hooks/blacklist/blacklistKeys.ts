export const blacklistKeys = {
  all: ['blacklist'] as const,
  naverBloggerCount: () => ['blacklist', 'naver_blog', 'count'] as const,
  youtubeKeywords: (workspaceId: string) =>
    ['blacklist', 'youtube', workspaceId] as const,
};
