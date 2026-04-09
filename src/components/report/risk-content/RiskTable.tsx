'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { RiskItem } from '@/lib/api/reportApi';

const criticalTypeConfig: Record<
  string,
  { label: string; variant: 'red' | 'amber' | 'blue' | 'slate' }
> = {
  stock_manipulation: { label: '시세조종', variant: 'red' },
  false_info: { label: '허위정보', variant: 'amber' },
  defamation: { label: '명예훼손', variant: 'red' },
  threat: { label: '위협', variant: 'red' },
  ad: { label: '광고', variant: 'blue' },
  spam: { label: '스팸', variant: 'slate' },
};

const criticalTypeDescriptions: Record<string, string> = {
  stock_manipulation: '시세 조종이 의심되는 게시물',
  false_info: '허위 정보가 사실처럼 확산되는 게시물',
  defamation: '기업/인물에 대한 명예훼손성 게시물',
  threat: '특정인을 대상으로 한 위협/협박 게시물',
  ad: '기업 관련 광고/홍보성 게시물',
  spam: '스팸/도배/무관 광고 게시물',
};

const PLATFORM_TO_CHANNEL: Record<string, string> = {
  naver_news: 'news',
  naver_blog: 'blog',
  youtube: 'youtube',
  naver_stock: 'community',
  dcinside: 'community',
};

const CHANNEL_TABS = [
  { key: 'all', label: '전체' },
  { key: 'news', label: '뉴스' },
  { key: 'blog', label: '블로그' },
  { key: 'youtube', label: '유튜브' },
  { key: 'community', label: '커뮤니티' },
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '커뮤니티',
  dcinside: '커뮤니티',
};

// 컬럼 너비 (grid-template-columns)
const COL_TEMPLATE = '10% 8% 10% 1fr 12%';

interface RiskTableProps {
  riskItems: RiskItem[];
}

export function RiskTable({ riskItems }: RiskTableProps) {
  const [tab, setTab] = useState<string>('all');
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (tab === 'all') return riskItems;
    return riskItems.filter((i) => PLATFORM_TO_CHANNEL[i.platform_id] === tab);
  }, [riskItems, tab]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // 탭 변경 시 스크롤 상단으로
  useEffect(() => {
    rowVirtualizer.scrollToOffset(0, { behavior: 'smooth' });
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // 채널별 카운트
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: riskItems.length };
    for (const tabItem of CHANNEL_TABS) {
      if (tabItem.key === 'all') continue;
      counts[tabItem.key] = riskItems.filter(
        (i) => PLATFORM_TO_CHANNEL[i.platform_id] === tabItem.key,
      ).length;
    }
    return counts;
  }, [riskItems]);

  return (
    <div>
      {/* 채널 탭 */}
      <div className="flex gap-4 mt-1 mb-2 border-b border-border-light">
        {CHANNEL_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div
                className={`text-xs transition-colors px-2 ${
                  active ? 'text-text-dark font-semibold' : 'text-text-muted font-normal'
                }`}
              >
                {t.label} ({channelCounts[t.key] ?? 0})
              </div>
              <div
                className={`h-0.5 w-full rounded-full transition-colors ${
                  active ? 'bg-text-accent' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="탐지된 리스크 콘텐츠가 없습니다." />
      ) : (
        <>
          {/* 헤더 */}
          <div
            className="grid border-y border-border-light py-3 px-3 text-xs font-semibold text-text-muted text-center"
            style={{ gridTemplateColumns: COL_TEMPLATE }}
          >
            <div>탐지일</div>
            <div>채널명</div>
            <div>탐지 분류</div>
            <div>세부내용</div>
            <div></div>
          </div>

          {/* 가상 스크롤 바디 */}
          <div ref={parentRef} className="max-h-[600px] overflow-y-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = filtered[virtualRow.index];
                const config = criticalTypeConfig[item.critical_type] ?? {
                  label: item.critical_type,
                  variant: 'slate' as const,
                };
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
                    <div
                      className="grid items-start py-4 px-3 border-b border-border-light hover:bg-slate-50/50 transition-colors"
                      style={{ gridTemplateColumns: COL_TEMPLATE }}
                    >
                      {/* 탐지일 */}
                      <div className="text-center text-xs text-text-muted">
                        {item.published_at
                          ? item.published_at.slice(0, 10).replace(/-/g, '.')
                          : ''}
                      </div>
                      {/* 채널명 */}
                      <div className="text-center text-xs text-text-muted">
                        {PLATFORM_LABELS[item.platform_id] ?? item.platform_id}
                      </div>
                      {/* 탐지 분류 */}
                      <div className="text-center">
                        <Badge variant={config.variant} bordered>
                          {config.label}
                        </Badge>
                      </div>
                      {/* 세부내용 */}
                      <div className="px-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs bg-bg-light text-text-muted w-fit px-2 py-0.5 rounded-[10px]">
                            {criticalTypeDescriptions[item.critical_type] ?? item.critical_type}
                          </span>
                          <div className="flex flex-col gap-1">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-text-dark hover:text-blue-600 hover:underline transition-colors"
                            >
                              {item.title}
                            </a>
                            {item.critical_reason && (
                              <p className="text-xs text-text-muted leading-relaxed">
                                {item.critical_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* 액션 */}
                      <div className="text-right pr-2">
                        <Badge
                          variant="blue"
                          className="px-3 py-1.5 cursor-pointer hover:bg-bg-accent hover:text-white transition-colors"
                        >
                          신고 대행 요청
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-text-muted text-center py-2">총 {filtered.length}건</p>
        </>
      )}
    </div>
  );
}
