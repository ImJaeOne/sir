import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
}

export function useKeywordParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keywords = parseKeywords(searchParams?.get('keywords') ?? null);

  const setKeywords = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (next.length > 0) {
        params.set('keywords', next.join(','));
      } else {
        params.delete('keywords');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const addKeyword = useCallback(
    (keyword?: string) => {
      if (!keyword) return;
      const trimmed = keyword.trim();
      const current = parseKeywords(searchParams?.get('keywords') ?? null);
      if (trimmed && !current.includes(trimmed)) {
        setKeywords([...current, trimmed]);
      }
    },
    [searchParams, setKeywords]
  );

  const removeKeyword = useCallback(
    (keyword: string) => {
      const current = parseKeywords(searchParams?.get('keywords') ?? null);
      setKeywords(current.filter((k) => k !== keyword));
    },
    [searchParams, setKeywords]
  );

  return { keywords, addKeyword, removeKeyword };
}
