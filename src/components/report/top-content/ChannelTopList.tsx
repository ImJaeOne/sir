'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import type { ChannelItem } from '@/lib/api/reportApi';

interface ChannelTopListProps {
  items: ChannelItem[];
  sortBy: 'impact_score' | 'views';
}

export function ChannelTopList({ items, sortBy }: ChannelTopListProps) {
  if (items.length === 0) return <EmptyState message="수집된 데이터가 없습니다." />;

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <a
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 lg:gap-4 px-2 py-3 lg:py-4 border border-transparent hover:border-text-accent rounded-lg transition-colors"
        >
          {/* 데스크톱: 숫자 별도 */}
          <span className="hidden lg:flex shrink-0 w-7 h-7 rounded-lg items-center justify-center text-3xl font-bold text-text-muted group-hover:text-text-accent transition-colors">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            {/* 데스크톱 */}
            <p className="hidden lg:block text-sm text-text-dark font-semibold group-hover:text-blue-600 transition-colors">{item.title}</p>
            {/* 모바일: 숫자+제목 인라인 */}
            <p className="lg:hidden text-xs text-text-dark font-semibold leading-relaxed group-hover:text-blue-600 transition-colors">
              <span className="text-base font-bold mr-1 text-text-muted group-hover:text-text-accent">{i + 1}</span>
              {item.title}
            </p>
            {sortBy === 'views' && item.views != null ? (
              <p className="text-xs text-text-muted mt-0.5">조회수 {item.views.toLocaleString()}회</p>
            ) : (
              (item.summary || item.content) && (
                <p className="text-xs text-text-muted mt-0.5 lg:truncate">
                  {item.summary || item.content}
                </p>
              )
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
