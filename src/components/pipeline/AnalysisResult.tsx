'use client';

import { useState } from 'react';
import { MOCK_ANALYSIS_RESULTS } from '@/constants/analysisResults';
import { PLATFORM_CATEGORIES } from '@/constants/platforms';
import type { PlatformAnalysis } from '@/types/pipeline';

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

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-green-50 text-green-700'
      : score >= 50
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-red-50 text-red-700';

  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>;
}

function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden flex">
        <div className="bg-green-400 h-full" style={{ width: `${positive}%` }} />
        <div className="bg-slate-300 h-full" style={{ width: `${neutral}%` }} />
        <div className="bg-red-400 h-full" style={{ width: `${negative}%` }} />
      </div>
      <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
        <span className="text-green-600">{positive}%</span>
        <span>{neutral}%</span>
        <span className="text-red-500">{negative}%</span>
      </div>
    </div>
  );
}

function calcCategoryScore(platforms: PlatformAnalysis[]): number {
  if (platforms.length === 0) return 0;
  return Math.round(platforms.reduce((sum, p) => sum + p.sirScore, 0) / platforms.length);
}

function calcCategorySentiment(platforms: PlatformAnalysis[]) {
  if (platforms.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  return {
    positive: Math.round(platforms.reduce((s, p) => s + p.positive, 0) / platforms.length),
    neutral: Math.round(platforms.reduce((s, p) => s + p.neutral, 0) / platforms.length),
    negative: Math.round(platforms.reduce((s, p) => s + p.negative, 0) / platforms.length),
  };
}

export function AnalysisResult() {
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

  const totalScore = Math.round(
    MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.sirScore, 0) / MOCK_ANALYSIS_RESULTS.length
  );
  const totalFlagged = MOCK_ANALYSIS_RESULTS.reduce((sum, p) => sum + p.flagged.length, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Total SIR */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">감성 분석 완료</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">종합 SIR 지수</span>
          <span
            className={`text-lg font-bold ${totalScore >= 70 ? 'text-green-600' : totalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
          >
            {totalScore}
          </span>
        </div>
      </div>

      {/* Flagged summary */}
      {totalFlagged > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-red-500 shrink-0"
          >
            <path
              d="M8 1.5L1 14h14L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
          <span className="text-sm text-red-700 font-medium">
            주의 필요 콘텐츠 {totalFlagged}건
          </span>
        </div>
      )}

      {/* Categories */}
      {PLATFORM_CATEGORIES.map((category) => {
        const platforms = MOCK_ANALYSIS_RESULTS.filter((p) => p.category === category);
        if (platforms.length === 0) return null;

        const categoryScore = calcCategoryScore(platforms);
        const categorySentiment = calcCategorySentiment(platforms);
        const categoryFlagged = platforms.reduce((sum, p) => sum + p.flagged.length, 0);
        const isCategoryOpen = openCategories.has(category);

        return (
          <div key={category} className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{category}</span>
                <ScoreBadge score={categoryScore} />
                {categoryFlagged > 0 && (
                  <span className="text-xs text-red-500 font-medium">주의 {categoryFlagged}건</span>
                )}
              </div>
              <ChevronIcon open={isCategoryOpen} />
            </button>

            {isCategoryOpen && (
              <div className="border-t border-slate-100">
                {/* Category sentiment bar */}
                <div className="px-4 py-3">
                  <SentimentBar {...categorySentiment} />
                </div>

                {/* Platforms */}
                {platforms.map((platform) => {
                  const isPlatformOpen = openPlatforms.has(platform.platformId);

                  return (
                    <div key={platform.platformId} className="border-t border-slate-50">
                      {/* Platform header */}
                      <button
                        onClick={() => togglePlatform(platform.platformId)}
                        className="w-full flex items-center justify-between px-4 py-2.5 pl-6 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{platform.platformLabel}</span>
                          <ScoreBadge score={platform.sirScore} />
                          {platform.flagged.length > 0 && (
                            <span className="text-xs text-red-500">
                              주의 {platform.flagged.length}건
                            </span>
                          )}
                        </div>
                        <ChevronIcon open={isPlatformOpen} />
                      </button>

                      {isPlatformOpen && (
                        <div className="px-4 pl-6 pb-3 flex flex-col gap-3">
                          {/* Platform sentiment */}
                          <SentimentBar
                            positive={platform.positive}
                            neutral={platform.neutral}
                            negative={platform.negative}
                          />

                          {/* Flagged content */}
                          {platform.flagged.length > 0 && (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                                주의 콘텐츠
                              </span>
                              <ul className="flex flex-col gap-2">
                                {platform.flagged.map((item, i) => (
                                  <li
                                    key={i}
                                    className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex flex-col gap-1"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span
                                        className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                          item.sentiment === 'negative'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {item.sentiment === 'negative' ? '부정' : '주의'}
                                      </span>
                                      <span className="text-sm text-slate-700 wrap-break-words">
                                        {item.title}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{item.reason}</span>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate transition-colors"
                                    >
                                      {item.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
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
