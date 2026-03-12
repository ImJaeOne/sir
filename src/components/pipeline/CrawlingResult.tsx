'use client';

import { useState } from 'react';
import { MOCK_CRAWL_RESULTS } from '@/constants/crawlResults';
import { PLATFORM_CATEGORIES } from '@/constants/platforms';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function CrawlingResult() {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openPlatforms, setOpenPlatforms] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const togglePlatform = (platformId: string) => {
    setOpenPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  };

  const totalArticles = MOCK_CRAWL_RESULTS.reduce((sum, p) => sum + p.articles.length, 0);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">
        총 {totalArticles}개 콘텐츠 수집 완료
      </p>

      {PLATFORM_CATEGORIES.map((category) => {
        const platforms = MOCK_CRAWL_RESULTS.filter((p) => p.category === category);
        if (platforms.length === 0) return null;

        const categoryTotal = platforms.reduce((sum, p) => sum + p.articles.length, 0);
        const isCategoryOpen = openCategories.has(category);

        return (
          <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Category toggle */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{category}</span>
                <span className="text-xs text-slate-400">{categoryTotal}건</span>
              </div>
              <ChevronIcon open={isCategoryOpen} />
            </button>

            {/* Platforms inside category */}
            {isCategoryOpen && (
              <div className="border-t border-slate-100">
                {platforms.map((platform) => {
                  const isPlatformOpen = openPlatforms.has(platform.platformId);

                  return (
                    <div key={platform.platformId} className="border-b border-slate-50 last:border-b-0">
                      {/* Platform toggle */}
                      <button
                        onClick={() => togglePlatform(platform.platformId)}
                        className="w-full flex items-center justify-between px-4 py-2.5 pl-6 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">
                            {platform.platformLabel}
                          </span>
                          <span className="text-xs text-slate-400">
                            {platform.articles.length}건
                          </span>
                        </div>
                        <ChevronIcon open={isPlatformOpen} />
                      </button>

                      {/* Articles */}
                      {isPlatformOpen && (
                        <ul className="border-t border-slate-50 divide-y divide-slate-50">
                          {platform.articles.map((article, i) => (
                            <li key={i} className="px-4 py-2.5 pl-8 flex items-start gap-2">
                              <span className="text-blue-400 mt-0.5 shrink-0 text-xs">•</span>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-sm text-slate-700 break-words">
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
