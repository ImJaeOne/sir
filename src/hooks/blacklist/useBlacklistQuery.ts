import { useQuery } from '@tanstack/react-query';
import { getNaverBloggerCount, getYoutubeKeywords } from '@/lib/api/blacklistApi';
import { blacklistKeys } from './blacklistKeys';

export function useNaverBloggerCount() {
  return useQuery({
    queryKey: blacklistKeys.naverBloggerCount(),
    queryFn: getNaverBloggerCount,
  });
}

export function useYoutubeKeywords(workspaceId: string) {
  return useQuery({
    queryKey: blacklistKeys.youtubeKeywords(workspaceId),
    queryFn: () => getYoutubeKeywords(workspaceId),
    enabled: !!workspaceId,
  });
}
