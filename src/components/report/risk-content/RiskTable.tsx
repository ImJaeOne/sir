'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
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

const PLATFORM_LABELS: Record<string, string> = {
  naver_news: '뉴스',
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '커뮤니티',
  dcinside: '커뮤니티',
};

const DEFAULT_SHOW = 5;

const columns: Column<RiskItem>[] = [
  {
    key: 'date',
    header: '탐지일',
    width: '10%',
    align: 'center',
    render: (item) => (
      <span className="text-xs text-text-muted">
        {item.published_at ? item.published_at.slice(0, 10).replace(/-/g, '.') : ''}
      </span>
    ),
  },
  {
    key: 'channel',
    header: '채널명',
    width: '8%',
    align: 'center',
    render: (item) => (
      <span className="text-xs text-text-muted">
        {PLATFORM_LABELS[item.platform_id] ?? item.platform_id}
      </span>
    ),
  },
  {
    key: 'type',
    header: '탐지 분류',
    width: '10%',
    align: 'center',
    render: (item) => {
      const config = criticalTypeConfig[item.critical_type] ?? {
        label: item.critical_type,
        variant: 'slate' as const,
      };
      return (
        <Badge variant={config.variant} bordered>
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'detail',
    header: '세부내용',
    render: (item) => (
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
            <p className="text-xs text-text-muted leading-relaxed">{item.critical_reason}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'action',
    header: '',
    width: '12%',
    align: 'right',
    render: () => (
      <Badge
        variant="blue"
        className="px-3 py-1.5 cursor-pointer hover:bg-bg-accent hover:text-white transition-colors"
      >
        신고 대행 요청
      </Badge>
    ),
  },
];

interface RiskTableProps {
  riskItems: RiskItem[];
}

export function RiskTable({ riskItems }: RiskTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? riskItems : riskItems.slice(0, DEFAULT_SHOW);
  const hasMore = riskItems.length > DEFAULT_SHOW;

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayed}
        rowKey={(item) => item.id}
        emptyMessage="탐지된 리스크 콘텐츠가 없습니다."
      />
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-xs font-light text-text-muted hover:text-text-accent transition-colors cursor-pointer"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAll ? '접기' : `더 보기 (${riskItems.length - DEFAULT_SHOW}건)`}
          </button>
        </div>
      )}
    </div>
  );
}
