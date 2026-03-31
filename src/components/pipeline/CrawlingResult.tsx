'use client';

import { useMemo } from 'react';
import { ChevronIcon } from '@/components/ui/ChevronIcon';
import { useToggleSet } from '@/hooks/useToggleSet';
import { getRelativeTime } from '@/utils/date';
import type { CrawlItem } from '@/types/news';

interface CrawlingResultProps {
  crawlItems: CrawlItem[];
}

export function CrawlingResult({ crawlItems }: CrawlingResultProps) {
  const categoryToggle = useToggleSet();
  const sourceToggle = useToggleSet();

  const grouped = useMemo(() => {
    const map = new Map<string, CrawlItem[]>();
    for (const item of crawlItems) {
      const key = item.source || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [crawlItems]);

  if (crawlItems.length === 0) {
    return <p className="text-sm text-slate-400">수집된 뉴스가 없습니다.</p>;
  }

  const isCategoryOpen = categoryToggle.has('news');

  return (
    <div className="flex flex-col gap-3">
      {/* 뉴스 카테고리 토글 */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <button
          onClick={() => categoryToggle.toggle('news')}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">뉴스</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {crawlItems.length}건
            </span>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {grouped.length}개 언론사
            </span>
          </div>
          <ChevronIcon open={isCategoryOpen} />
        </button>

        {isCategoryOpen && (
          <div className="border-t border-slate-100">
            {grouped.map(([source, items]) => {
              const isSourceOpen = sourceToggle.has(source);

              return (
                <div key={source} className="border-b border-slate-50 last:border-b-0">
                  <button
                    onClick={() => sourceToggle.toggle(source)}
                    className="w-full flex items-center justify-between px-4 py-2.5 pl-6 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{source}</span>
                      <span className="text-xs text-slate-400">{items.length}건</span>
                    </div>
                    <ChevronIcon open={isSourceOpen} />
                  </button>

                  {isSourceOpen && (
                    <ul className="border-t border-slate-50 divide-y divide-slate-50">
                      {items.map((item) => (
                        <li key={item.id} className="px-4 py-2 pl-8 flex items-center gap-2 min-w-0">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-700 hover:text-blue-600 hover:underline truncate flex-1 transition-colors"
                          >
                            {item.title}
                          </a>
                          {item.published_at && (
                            <span className="text-xs text-slate-300 shrink-0">
                              {getRelativeTime(item.published_at)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
