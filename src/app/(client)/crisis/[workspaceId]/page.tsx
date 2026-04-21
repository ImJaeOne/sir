'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Paperclip } from 'lucide-react';
import { useDeleteRiskReport } from '@/hooks/report/useReportMutation';
import { useRiskItems, useRiskReports } from '@/hooks/report/useReportQuery';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { createClient } from '@/lib/supabase/client';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { RiskDetectionTable } from '@/components/report/risk-content/RiskDetectionTable';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  requested: { label: '요청 완료', className: 'bg-slate-100 text-slate-600' },
  pending: { label: '결과 대기', className: 'bg-amber-50 text-amber-600' },
  resolved: { label: '삭제 완료', className: 'bg-blue-50 text-blue-600' },
  rejected: { label: '삭제 반려', className: 'bg-red-50 text-red-600' },
};

const PLATFORM_LABELS: Record<string, string> = {
  naver_blog: '블로그',
  youtube: '유튜브',
  naver_stock: '종토방',
  dcinside: '디시인사이드',
};

const COL_TEMPLATE = '12% 10% 10% 1fr 12%';

/** sessions 테이블에서 workspace 의 session→report_id 매핑 조회 */
function useSessionToReportMap(workspaceId: string) {
  return useQuery({
    queryKey: ['sessions', 'workspace-report-map', workspaceId],
    queryFn: async () => {
      const { data } = await createClient()
        .from('sessions')
        .select('id, report_id')
        .eq('workspace_id', workspaceId);
      const map = new Map<string, string>();
      for (const s of data ?? []) {
        if (s.report_id) map.set(s.id, s.report_id);
      }
      return map;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export default function CrisisCenterPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: riskItems, isLoading: itemsLoading } = useRiskItems(workspaceId);
  const { data: riskReports, isLoading: reportsLoading } = useRiskReports(workspaceId);
  const { data: sessionToReportMap } = useSessionToReportMap(workspaceId);
  const deleteMutation = useDeleteRiskReport(workspaceId, '');

  const { reportedSourceIds, riskReportBySourceId } = useMemo(() => {
    const ids = new Set<string>();
    const map = new Map<string, string>();
    for (const rr of riskReports ?? []) {
      ids.add(rr.source_id);
      map.set(rr.source_id, rr.id);
    }
    return { reportedSourceIds: ids, riskReportBySourceId: map };
  }, [riskReports]);

  // 리스크 콘텐츠 처리 결과: 처리 확정(resolved / rejected) 건만
  const processedReports = useMemo(() => {
    return (riskReports ?? [])
      .filter((r) => r.status === 'resolved' || r.status === 'rejected')
      .sort((a, b) => (b.resolved_at ?? b.requested_at ?? '').localeCompare(a.resolved_at ?? a.requested_at ?? ''));
  }, [riskReports]);

  const loading = itemsLoading || reportsLoading;

  return (
    <div className="min-h-full bg-bg-light">
      <div className="mx-auto w-full lg:w-[1200px] px-4 lg:px-10 py-6 lg:py-10 flex flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <ShieldAlert size={28} className="text-bg-accent" />
          <div className="flex flex-col">
            <h1 className="text-xl lg:text-2xl font-bold text-text-dark">위기 대응 센터</h1>
            <p className="text-xs text-text-muted">
              {workspace?.company_name ? `${workspace.company_name} · ` : ''}
              워크스페이스 전체 리스크 콘텐츠를 확인하고 신고 대행을 요청할 수 있습니다.
            </p>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 리스크 탐지 내역 — 전체 리포트 통합, 신고 대행 요청 버튼 노출 */}
            <RiskDetectionTable
              riskItems={riskItems ?? []}
              workspaceId={workspaceId}
              reportId=""
              reportedSourceIds={reportedSourceIds}
              riskReportBySourceId={riskReportBySourceId}
              onCancelReport={deleteMutation.mutate}
              allowReport
              sessionToReportMap={sessionToReportMap ?? undefined}
            />

            {/* 리스크 처리 결과 — 전체 기간 (workspace 기준) */}
            <ReportSubSection
              title="리스크 콘텐츠 처리 결과"
              description="처리 완료되거나 반려된 모든 신고 대행 건을 확인할 수 있습니다."
              tooltip="신고된 게시물은 해당 채널 운영자의 판단에 의해 삭제되지 않을 수 있으며, 신고 후 2주가 지나도 삭제되지 않을 경우 자동으로 반려된 것으로 간주합니다."
            >
              <ReportCard px={20} py={10}>
                {processedReports.length === 0 ? (
                  <>
                    <EmptyState message="처리 완료된 신고 대행 내역이 없습니다." />
                    <p className="text-xs text-text-muted text-center py-2">총 0건</p>
                  </>
                ) : (
                  <>
                    {/* 데스크톱: grid 테이블 */}
                    <div className="hidden lg:block">
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
                        {processedReports.map((rr) => {
                          const statusCfg = STATUS_STYLES[rr.status] ?? { label: rr.status, className: 'bg-slate-100 text-slate-600' };
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
                              <div className="text-center text-xs text-text-muted">{rr.reason}</div>
                              <div className="px-3 flex items-center gap-2 min-w-0">
                                <a
                                  href={rr.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-text-dark hover:text-blue-600 hover:underline transition-colors truncate"
                                >
                                  {rr.title}
                                </a>
                                {rr.file_urls?.length > 0 && (
                                  <span className="flex items-center gap-0.5 text-slate-400 shrink-0">
                                    <Paperclip size={12} />
                                    <span className="text-[10px]">{rr.file_urls.length}</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-center">
                                <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-lg ${statusCfg.className}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 모바일: 카드 리스트 */}
                    <div className="lg:hidden flex flex-col gap-3 py-3 max-h-[400px] overflow-y-auto">
                      {processedReports.map((rr) => {
                        const statusCfg = STATUS_STYLES[rr.status] ?? { label: rr.status, className: 'bg-slate-100 text-slate-600' };
                        return (
                          <div key={rr.id} className="border border-border-light rounded-xl p-4 flex flex-col gap-2.5">
                            <div className="flex gap-2">
                              <span className="w-14 shrink-0 text-sm text-text-mobile-muted pt-0.5">신고일</span>
                              <span className="text-sm text-text-dark">
                                {rr.requested_at?.slice(0, 10).replace(/-/g, '.') ?? '-'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-14 shrink-0 text-sm text-text-mobile-muted pt-0.5">채널명</span>
                              <span className="text-sm text-text-dark">
                                {PLATFORM_LABELS[rr.platform_id] ?? rr.platform_id}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-14 shrink-0 text-sm text-text-mobile-muted pt-0.5">유형</span>
                              <span className="text-sm text-text-dark">{rr.reason}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-14 shrink-0 text-sm text-text-mobile-muted pt-0.5">게시물</span>
                              <a
                                href={rr.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-text-dark hover:text-blue-600 hover:underline transition-colors flex-1 min-w-0"
                              >
                                {rr.title}
                              </a>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-14 shrink-0 text-sm text-text-mobile-muted pt-0.5">처리 결과</span>
                              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-text-muted text-center py-2">총 {processedReports.length}건</p>
                  </>
                )}
              </ReportCard>
              <p className="text-xs text-text-muted mt-3 leading-relaxed">
                공휴일에는 신고 처리가 불가합니다. 공휴일에 신고를 요청하시는 경우, 공휴일 다음 영업일부터 순차적으로 신고 처리를 진행합니다.
              </p>
            </ReportSubSection>
          </>
        )}
      </div>
    </div>
  );
}
