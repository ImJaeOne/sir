'use client';
'use no memo';

import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SentimentIcon, SentimentBadge } from '@/components/report/reputation/SentimentIcon';
import { SentimentFilter } from '@/components/report/reputation/SentimentFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ChannelItem, NewsCluster } from '@/lib/api/reportApi';

type Row =
  | { type: 'header'; text: string }
  | { type: 'cluster'; cluster: NewsCluster }
  | { type: 'item'; item: ChannelItem };

interface NewsClusterContentProps {
  clusters: NewsCluster[];
  unclustered: ChannelItem[];
}

function ClusterRow({
  cluster,
  isOpen,
  onToggle,
}: {
  cluster: NewsCluster;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative border-b border-border-light pr-1 lg:pr-4">
      <button
        onClick={onToggle}
        className="w-full flex gap-2 py-4 text-left cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="hidden lg:block">
          <SentimentIcon sentiment={cluster.sentiment ?? 'neutral'} />
        </div>
        <div className="flex-1 min-w-0 lg:px-4">
          {/* 데스크톱: flex 배치 */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-text-dark font-semibold">
              {cluster.representative_title}
            </span>
            <span className="text-[10px] text-text-muted bg-bg-light px-2 rounded-[10px] shrink-0">
              {cluster.items.length}건
            </span>
          </div>
          <span className="inline-flex items-center gap-2 mr-1 align-middle">
            <SentimentBadge sentiment={cluster.sentiment ?? 'neutral'} />
            <span className="text-xs text-text-muted bg-bg-light px-2 py-0.5 rounded-sm font-normal">
              {cluster.items.length}건
            </span>
          </span>
          <p className="lg:hidden text-sm text-text-dark font-semibold leading-relaxed">
            {cluster.representative_title}
          </p>
          {cluster.summary && (
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[14px] lg:text-sm text-text-mobile-muted lg:text-text-muted">
                {cluster.summary}
              </p>
              <span className="lg:hidden shrink-0">
                {isOpen ? (
                  <ChevronUp size={12} className="text-text-muted" />
                ) : (
                  <ChevronDown size={12} className="text-text-muted" />
                )}
              </span>
            </div>
          )}
        </div>
        <div className="hidden lg:flex items-center">
          {isOpen ? (
            <ChevronUp size={14} className="text-text-muted shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-text-muted shrink-0" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="ml-0 mr-0 lg:ml-[38px] lg:mr-5 mb-3 bg-white border border-slate-200 rounded-lg shadow-sm p-1.5 lg:p-2 flex flex-col gap-0.5 lg:gap-1">
          {cluster.items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2 hover:bg-slate-50 rounded px-1.5 py-1 lg:px-2 lg:py-1.5 transition-colors"
            >
              <p className="text-xs lg:text-sm text-text-dark group-hover:text-blue-600 transition-colors flex-1 min-w-0">
                {item.title}
              </p>
              {item.source && (
                <span className="text-[10px] text-slate-400 shrink-0 hidden lg:block">
                  {item.source}
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: ChannelItem }) {
  return (
    <div className="border-b border-slate-50 pr-1 lg:pr-4">
      <div className="flex gap-2 py-4">
        <div className="hidden lg:block">
          <SentimentIcon sentiment={item.sentiment} />
        </div>
        <div className="flex-1 min-w-0 lg:pl-4">
          {/* 데스크톱 */}
          <div className="hidden lg:flex items-center gap-2">
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
          {/* 모바일 */}
          <span className="lg:hidden inline-flex items-center gap-2 mr-1 align-middle">
            <SentimentBadge sentiment={item.sentiment} />
          </span>
          <p className="lg:hidden text-sm text-text-dark font-semibold leading-relaxed">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 hover:underline transition-colors"
            >
              {item.title}
            </a>
          </p>
          {item.summary && (
            <p className="text-[14px] lg:text-sm text-text-mobile-muted lg:text-text-muted mt-0.5">{item.summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewsClusterContent({ clusters, unclustered }: NewsClusterContentProps) {
  const [filter, setFilter] = useState<string>('all');
  const [openClusterIds, setOpenClusterIds] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const sortedClusters = [...clusters].sort((a, b) => b.items.length - a.items.length);
  const filteredClusters =
    filter === 'all' ? sortedClusters : sortedClusters.filter((c) => c.sentiment === filter);
  const sortedUnclustered = [...unclustered].sort((a, b) =>
    (b.published_at ?? '').localeCompare(a.published_at ?? '')
  );
  const filteredUnclustered =
    filter === 'all' ? sortedUnclustered : sortedUnclustered.filter((i) => i.sentiment === filter);

  const countBySentiment = (s: string) =>
    sortedClusters.filter((c) => c.sentiment === s).reduce((sum, c) => sum + c.items.length, 0) +
    unclustered.filter((i) => i.sentiment === s).length;
  const totalClusterItems = sortedClusters.reduce((sum, c) => sum + c.items.length, 0);
  const counts = {
    all: totalClusterItems + unclustered.length,
    positive: countBySentiment('positive'),
    neutral: countBySentiment('neutral'),
    negative: countBySentiment('negative'),
  };

  // 가상 스크롤용 row 배열 구성 (cluster section + unclustered section)
  const rows: Row[] = [];
  if (filteredClusters.length > 0) {
    rows.push({ type: 'header', text: '동일한 내용이 여러 언론사를 통해 보도된 기사입니다.' });
    filteredClusters.forEach((c) => rows.push({ type: 'cluster', cluster: c }));
  }
  if (filteredUnclustered.length > 0) {
    rows.push({ type: 'header', text: '개별 보도된 기사입니다.' });
    filteredUnclustered.forEach((item) => rows.push({ type: 'item', item }));
  }

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // 필터 변경 시 스크롤 상단으로
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0, { behavior: 'smooth' });
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCluster = (id: string) => {
    setOpenClusterIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <SentimentFilter value={filter} onChange={setFilter} counts={counts} />
      {rows.length === 0 ? (
        <EmptyState
          message={`${{ all: '수집된', positive: '긍정', neutral: '중립', negative: '부정' }[filter] ?? '수집된'} 데이터가 없습니다.`}
        />
      ) : (
        <div ref={parentRef} className="max-h-[600px] overflow-y-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
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
                >
                  {row.type === 'header' && (
                    <p className="text-xs text-text-muted pt-3 pb-1">{row.text}</p>
                  )}
                  {row.type === 'cluster' && (
                    <ClusterRow
                      cluster={row.cluster}
                      isOpen={openClusterIds.has(row.cluster.id)}
                      onToggle={() => toggleCluster(row.cluster.id)}
                    />
                  )}
                  {row.type === 'item' && <ItemRow item={row.item} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-text-muted text-center py-2">
        클러스터 {filteredClusters.length}건 · 개별 기사 {filteredUnclustered.length}건
      </p>
    </>
  );
}
