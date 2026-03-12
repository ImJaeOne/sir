'use client';

import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';
import { PLATFORM_CATEGORIES } from '@/constants/platforms';
import { ChevronIcon } from '@/components/ui/ChevronIcon';
import { useToggleSet } from '@/hooks/useToggleSet';

export function CrawlingResult() {
  const categories = useToggleSet();
  const platforms = useToggleSet();

  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">총 {totalArticles}개 콘텐츠 수집 완료</p>

      {PLATFORM_CATEGORIES.map((category) => {
        const items = MOCK_CRAWL_RESULTS.filter((p) => p.category === category);
        if (items.length === 0) return null;

        const categoryTotal = items.reduce((sum, p) => sum + p.articles.length, 0);
        const isCategoryOpen = categories.has(category);

        return (
          <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
            <button
              onClick={() => categories.toggle(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{category}</span>
                <span className="text-xs text-slate-400">{categoryTotal}건</span>
              </div>
              <ChevronIcon open={isCategoryOpen} />
            </button>

            {isCategoryOpen && (
              <div className="border-t border-slate-100">
                {items.map((platform) => {
                  const isPlatformOpen = platforms.has(platform.platformId);

                  return (
                    <div
                      key={platform.platformId}
                      className="border-b border-slate-50 last:border-b-0"
                    >
                      <button
                        onClick={() => platforms.toggle(platform.platformId)}
                        className="w-full flex items-center justify-between px-4 py-2.5 pl-6 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{platform.platformLabel}</span>
                          <span className="text-xs text-slate-400">
                            {platform.articles.length}건
                          </span>
                        </div>
                        <ChevronIcon open={isPlatformOpen} />
                      </button>

                      {isPlatformOpen && (
                        <ul className="border-t border-slate-50 divide-y divide-slate-50">
                          {platform.articles.map((article, i) => (
                            <li key={i} className="px-4 py-2.5 pl-8 flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5 shrink-0 text-xs">•</span>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-sm text-slate-700 wrap-break-words">
                                  {article.title}
                                </span>
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate transition-colors"
                                >
                                  {article.url}
                                </a>
                              </div>
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
        );
      })}
    </div>
  );
}
