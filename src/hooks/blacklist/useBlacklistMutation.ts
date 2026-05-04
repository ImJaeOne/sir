import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addNaverBlogger,
  addYoutubeKeywords,
  removeYoutubeKeywords,
  type BloggerHashPair,
} from '@/lib/api/blacklistApi';
import { blacklistKeys } from './blacklistKeys';

/** 네이버 블로거 다건 추가 — 순차 실행으로 hash 매핑(plaintext↔hash) 보존. */
export function useAddNaverBloggers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plaintexts: string[]): Promise<BloggerHashPair[]> => {
      const pairs: BloggerHashPair[] = [];
      for (const v of plaintexts) {
        pairs.push(await addNaverBlogger(v));
      }
      return pairs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blacklistKeys.naverBloggerCount() });
    },
  });
}

/** 유튜브 키워드 변경(추가+삭제 일괄). */
export function useReplaceYoutubeKeywords(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ added, removed }: { added: string[]; removed: string[] }) => {
      await removeYoutubeKeywords(workspaceId, removed);
      await addYoutubeKeywords(workspaceId, added);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blacklistKeys.youtubeKeywords(workspaceId) });
    },
  });
}
