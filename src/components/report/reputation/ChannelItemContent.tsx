'use client';

import { useState } from 'react';
import { SentimentIcon } from '@/components/report/reputation/SentimentIcon';
import { SentimentFilter } from '@/components/report/reputation/SentimentFilter';
import type { ChannelItem } from '@/lib/api/reportApi';

const CHANNEL_SORT: Record<string, (a: ChannelItem, b: ChannelItem) => number> = {
  블로그: (a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0),
  유튜브: (a, b) => (b.views ?? 0) - (a.views ?? 0),
  커뮤니티: (a, b) => (b.views ?? 0) - (a.views ?? 0),
};

const CHANNEL_MAX = 100;

interface ChannelItemContentProps {
  name: string;
  items: ChannelItem[];
}

export function ChannelItemContent({ name, items }: ChannelItemContentProps) {
  const [filter, setFilter] = useState<string>('all');

  const sortFn = CHANNEL_SORT[name];
  const sorted = sortFn ? [...items].sort(sortFn) : items;
  const filtered = filter === 'all' ? sorted : sorted.filter((i) => i.sentiment === filter);
  const limited = filtered.slice(0, CHANNEL_MAX);

  return (
    <>
      <SentimentFilter value={filter} onChange={setFilter} />
      {limited.map((item, i) => (
        <div key={i} className="border-b border-border-light last:border-0">
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
                {item.source && (
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
      ))}
      {filtered.length > CHANNEL_MAX && (
        <p className="text-xs text-text-muted text-center py-2">최대 {CHANNEL_MAX}건까지 표시됩니다</p>
      )}
    </>
  );
}
