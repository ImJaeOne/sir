'use client';

import { useRiskReports } from '@/hooks/report/useReportQuery';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ReportCard } from '@/components/report/ReportCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_CONFIG: Record<string, { label: string; variant: 'blue' | 'amber' | 'red' | 'slate' }> = {
  requested: { label: '요청', variant: 'blue' },
  pending: { label: '처리 대기', variant: 'amber' },
  resolved: { label: '삭제 완료', variant: 'slate' },
  rejected: { label: '신고 반려', variant: 'red' },
};

const PLATFORM_LABELS: Record<string, string> = {
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

const COL_TEMPLATE = '12% 10% 10% 1fr 12%';

interface RiskResultTableProps {
  workspaceId: string;
  prevReportId?: string;
}

export function RiskResultTable({ workspaceId, prevReportId }: RiskResultTableProps) {
  const { data: riskReports } = useRiskReports(workspaceId, prevReportId);
  const reports = riskReports ?? [];

  return (
    <ReportSubSection
      title="리스크 콘텐츠 처리 결과"
      description="이전 보고서에서 요청한 신고 대행의 처리 경과입니다."
    >
      <ReportCard px={20} py={10}>
        {reports.length === 0 ? (
          <>
            <EmptyState message="이전 보고서의 신고 대행 요청 내역이 없습니다." />
            <p className="text-xs text-text-muted text-center py-2">총 0건</p>
          </>
        ) : (
          <>
            <div
              className="grid border-b border-border-light py-3 px-3 text-xs font-semibold text-text-muted text-center"
              style={{ gridTemplateColumns: COL_TEMPLATE }}
            >
              <div>신고일</div>
              <div>채널명</div>
              <div>유형</div>
              <div>신고 게시물</div>
              <div>처리 결과</div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {reports.map((rr) => {
                const statusCfg = STATUS_CONFIG[rr.status] ?? { label: rr.status, variant: 'slate' as const };
                return (
                  <div
                    key={rr.id}
                    className="grid items-center py-4 px-3 border-b border-border-light"
                    style={{ gridTemplateColumns: COL_TEMPLATE }}
                  >
                    <div className="text-center text-xs text-text-muted">
                      {rr.requested_at?.slice(0, 10).replace(/-/g, '.') ?? ''}
                    </div>
                    <div className="text-center text-xs text-text-muted">
                      {PLATFORM_LABELS[rr.platform_id] ?? rr.platform_id}
                    </div>
                    <div className="text-center text-xs text-text-muted">
                      {rr.reason}
                    </div>
                    <div className="px-3">
                      <a
                        href={rr.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-text-dark hover:text-blue-600 hover:underline transition-colors"
                      >
                        {rr.title}
                      </a>
                    </div>
                    <div className="text-center">
                      <Badge variant={statusCfg.variant} bordered>
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-text-muted text-center py-2">총 {reports.length}건</p>
          </>
        )}
      </ReportCard>
    </ReportSubSection>
  );
}
