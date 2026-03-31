'use client';

import type { Strategy } from '@/types/news';

interface ContentResultProps {
  strategy: Strategy | null;
}

export function ContentResult({ strategy }: ContentResultProps) {
  if (!strategy) {
    return <p className="text-sm text-slate-400">생성된 대응 전략이 없습니다</p>;
  }

  const hasPositive = !!strategy.strategy_positive;
  const hasNegative = !!strategy.strategy_negative;

  if (!hasPositive && !hasNegative) {
    return <p className="text-sm text-slate-400">생성된 대응 전략이 없습니다</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">종합 대응 전략</p>

      {hasPositive && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-500 shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-green-700">긍정 여론 활용 전략</span>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {strategy.strategy_positive}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasNegative && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-500 shrink-0 mt-0.5">
              <path d="M8 2L2 14h12L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="12" r="0.75" fill="currentColor" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-red-700">부정 여론 대응 전략</span>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {strategy.strategy_negative}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
