'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { useRetryFailedReport } from '@/hooks/workspace/useWorkspaceMutation';
import type { Report, ReportProgress } from '@/lib/api/workspaceApi';
import { PLATFORM_LABELS, FAILED_REASON_LABELS, ALL_PLATFORMS } from '@/utils/workspace';
import { getErrorMessage } from '@/lib/utils';
import { STATUS_CONFIG, STATUS_FALLBACK } from './styles';

function SessionStatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;
  return <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />;
}

function FailedPlatformRow({
  platformId,
  session,
  cfg,
}: {
  platformId: string;
  session: ReportProgress['sessions'][number];
  cfg: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG];
}) {
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
      <SessionStatusDot status="failed" />
      <span className="text-xs text-slate-700 font-medium">{PLATFORM_LABELS[platformId] ?? platformId}</span>
      <span className={`text-xs font-semibold ml-auto ${cfg.color} flex items-center gap-1`}>
        {session.failed_reason ? (FAILED_REASON_LABELS[session.failed_reason] ?? cfg.label) : cfg.label}
        {session.error_message && (
          <Tooltip text={session.error_message} variant="danger" position="left" />
        )}
      </span>
    </div>
  );
}

function RetryFailedButton({
  workspaceId,
  reportId,
  failedLabels,
  reportType,
}: {
  workspaceId: string;
  reportId: string;
  failedLabels: string[];
  reportType: Report['type'];
}) {
  const retry = useRetryFailedReport(workspaceId);
  const [open, setOpen] = useState(false);
  const handleConfirm = async () => {
    setOpen(false);
    try {
      await retry.mutateAsync(reportId);
      toast.success('일괄 재시도를 시작했습니다. 수 분 후 새로고침하세요.');
    } catch (e) {
      toast.error(getErrorMessage(e, '재시도 실패'));
    }
  };

  const channelText = failedLabels.join(', ');
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={retry.isPending}
        title={`실패한 채널 재시도: ${channelText}`}
        className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white border border-red-200 rounded-md px-2 py-1 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={10} className={retry.isPending ? 'animate-spin' : ''} />
        {retry.isPending ? '재시도 중' : `실패 재시도 (${failedLabels.length})`}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="실패 재시도"
        confirmVariant="danger"
        confirmLabel="재시도"
        message={
          <>
            실패한 채널(<b>{channelText}</b>)에 대해 수집·분석을 재진행합니다.
            {reportType !== 'daily' && (
              <>
                <br />
                성공 시 전략·총평까지 자동으로 재생성됩니다.
              </>
            )}
          </>
        }
      />
    </>
  );
}

interface ReportProgressPanelProps {
  workspaceId: string;
  reportId: string;
  reportType: Report['type'];
  progress: ReportProgress;
}

export function ReportProgressPanel({
  workspaceId,
  reportId,
  reportType,
  progress,
}: ReportProgressPanelProps) {
  const sessionMap = new Map(progress.sessions.map((s) => [s.platform_id, s]));
  const failedPlatforms = ALL_PLATFORMS.filter((p) => sessionMap.get(p)?.status === 'failed');
  const failedLabels = failedPlatforms.map((p) => PLATFORM_LABELS[p] ?? p);
  const hasAnyFinalize = progress.hasSummary || progress.strategyCategories.length > 0;

  return (
    <div className="px-4 sm:px-5 py-4 flex flex-col gap-4">
      {/* 플랫폼별 세션 상태 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">채널별 수집·분석</span>
          {failedLabels.length > 0 && (
            <RetryFailedButton
              workspaceId={workspaceId}
              reportId={reportId}
              failedLabels={failedLabels}
              reportType={reportType}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_PLATFORMS.map((platformId) => {
            const s = sessionMap.get(platformId);
            const status = s?.status ?? 'pending';
            const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;

            if (status === 'failed' && s) {
              return (
                <FailedPlatformRow
                  key={platformId}
                  platformId={platformId}
                  session={s}
                  cfg={cfg}
                />
              );
            }

            return (
              <div key={platformId} className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
                <SessionStatusDot status={status} />
                <span className="text-xs text-slate-600 font-medium">{PLATFORM_LABELS[platformId] ?? platformId}</span>
                {status === 'done' && (
                  <span className="text-[10px] text-slate-400 ml-auto">{s?.total_items ?? 0}건</span>
                )}
                <span className={`text-xs font-semibold ${status !== 'done' ? 'ml-auto' : ''} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 총평 & 전략 — daily 는 finalize 없음, 노출 생략 */}
      {reportType !== 'daily' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">전략·총평 생성</span>
          </div>
          {failedLabels.length > 0 && hasAnyFinalize && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 leading-snug">
              <AlertCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
              <span>실패한 플랫폼 결과가 빠진 상태로 전략/총평이 생성되었습니다. 위 &quot;실패 재시도&quot; 버튼으로 일괄 복구하세요.</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {(() => {
              // session_strategies row 의 실제 status (pending → analyzing → done/failed) 를 그대로 반영
              const sumStrategy = progress.strategies.find((s) => s.category === 'summary');
              const status = sumStrategy?.status ?? 'pending';
              const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;
              return (
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
                  <SessionStatusDot status={status} />
                  <span className="text-xs text-slate-600 font-medium">총평</span>
                  <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })()}
            {(() => {
              // 대응 전략은 news/community/sns 3 채널의 종합 상태
              const channels = progress.strategies.filter((s) => s.category !== 'summary');
              const doneCount = channels.filter((s) => s.status === 'done').length;
              const total = channels.length;
              const hasFailed = channels.some((s) => s.status === 'failed');
              const hasActive = channels.some((s) =>
                ['analyzing', 'pending_analysis', 'crawling', 'clustering'].includes(s.status),
              );
              let status: string;
              if (total === 0) status = 'pending';
              else if (doneCount === total) status = 'done';
              else if (hasActive) status = 'analyzing';
              else if (hasFailed) status = 'failed';
              else status = 'pending';
              const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;
              const label =
                status === 'done'
                  ? `${doneCount}개 채널`
                  : status === 'analyzing'
                    ? `분석 중 (${doneCount}/${total})`
                    : cfg.label;
              return (
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${cfg.bg} ${cfg.border}`}>
                  <SessionStatusDot status={status} />
                  <span className="text-xs text-slate-600 font-medium">대응 전략</span>
                  <span className={`text-xs font-semibold ml-auto ${cfg.color}`}>
                    {label}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
