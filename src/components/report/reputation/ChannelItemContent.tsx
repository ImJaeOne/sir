'use client';

import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SentimentIcon } from '@/components/report/reputation/SentimentIcon';
import { SentimentFilter } from '@/components/report/reputation/SentimentFilter';
import type { ChannelItem } from '@/lib/api/reportApi';

const CHANNEL_SORT: Record<string, (a: ChannelItem, b: ChannelItem) => number> = {
  블로그: (a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0),
  유튜브: (a, b) => (b.views ?? 0) - (a.views ?? 0),
  커뮤니티: (a, b) => (b.views ?? 0) - (a.views ?? 0),
};

interface ChannelItemContentProps {
  name: string;
  items: ChannelItem[];
}

export function ChannelItemContent({ name, items }: ChannelItemContentProps) {
  const [filter, setFilter] = useState<string>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const showSource = name !== '블로그' && name !== '유튜브';
  const sortFn = CHANNEL_SORT[name];
  const sorted = sortFn ? [...items].sort(sortFn) : items;
  const filtered = filter === 'all' ? sorted : sorted.filter((i) => i.sentiment === filter);

  const counts = {
    all: sorted.length,
    positive: sorted.filter((i) => i.sentiment === 'positive').length,
    neutral: sorted.filter((i) => i.sentiment === 'neutral').length,
    negative: sorted.filter((i) => i.sentiment === 'negative').length,
  };

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // 필터 변경 시 스크롤 상단으로
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0, { behavior: 'smooth' });
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SentimentFilter value={filter} onChange={setFilter} counts={counts} />
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-y-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = filtered[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="border-b border-border-light pr-4"
              >
                <div className="flex gap-2 py-4">
                  <SentimentIcon sentiment={item.sentiment} />
                  <div className="flex-1 min-w-0 pl-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-dark font-semibold hover:text-blue-600 hover:underline transition-colors"
                      >
                        {item.title}
                      </a>
                      {showSource && item.source && (
                        <span className="text-[10px] text-text-muted shrink-0">{item.source}</span>
                      )}
                    </div>
                    {(item.summary || item.content) && (
                      <p className="text-sm text-text-muted mt-0.5">
                        {(item.summary || item.content || '').length > 200
                          ? (item.summary || item.content || '').slice(0, 200) + '…'
                          : item.summary || item.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-text-muted text-center py-2">총 {filtered.length}건</p>
    </>
  );
}
