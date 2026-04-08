'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NewsCluster } from '@/lib/api/reportApi';

interface NewsTopListProps {
  clusters: NewsCluster[];
}

export function NewsTopList({ clusters }: NewsTopListProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const top3 = [...clusters].sort((a, b) => b.items.length - a.items.length).slice(0, 3);

  // 외부 클릭 시 아코디언 닫기
  useEffect(() => {
    if (expandedIdx === null) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expandedIdx]);

  if (top3.length === 0) return <EmptyState message="수집된 데이터가 없습니다." />;

  return (
    <div ref={containerRef} className="flex flex-col">
      {top3.map((cluster, i) => {
        const isActive = expandedIdx === i;
        return (
          <div
            key={cluster.id}
            className={`relative border rounded-lg transition-colors ${
              isActive ? 'border-text-accent' : 'border-transparent hover:border-text-accent'
            }`}
          >
            <button
              onClick={() => setExpandedIdx(isActive ? null : i)}
              className="group w-full flex items-center gap-4 px-2 py-4 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-3xl font-bold transition-colors ${
                  isActive ? 'text-text-accent' : 'text-text-muted group-hover:text-text-accent'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex">
                  <p className="text-sm text-text-dark font-semibold">
                    {cluster.representative_title}
                  </p>
                  <span className="text-[10px] text-text-muted bg-bg-light px-2 py-0.5 rounded-full">
                    {cluster.items.length}건
                  </span>
                </div>
                {cluster.summary && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">{cluster.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <ChevronUp size={14} className="text-text-muted" />
                ) : (
                  <ChevronDown size={14} className="text-text-muted" />
                )}
              </div>
            </button>
            {isActive && (
              <div className="absolute left-0 right-0 mt-[0.5px] mr-2 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                {cluster.items.map((article, j) => (
                  <a
                    key={j}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-2 hover:bg-slate-50 rounded px-2 py-1.5 transition-colors"
                  >
                    <p className="text-sm text-text-dark group-hover:text-blue-600 transition-colors flex-1 min-w-0">
                      {article.title}
                    </p>
                    {article.source && (
                      <span className="text-[10px] text-text-muted shrink-0">{article.source}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
