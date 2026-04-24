import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert } from 'lucide-react';
import type { AdminHomeData } from '@/lib/adminHome/queries';

const criticalLabel: Record<string, string> = {
  defamation: '명예훼손',
  insult: '욕설/비방',
  rumor: '루머',
  spam: '스팸',
};

function relativeKst(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

function Card({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col gap-3 sm:gap-4">
      <header className="flex items-start gap-2.5 sm:gap-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function AutomationFailureCard({ data }: { data: AdminHomeData }) {
  const { failedPipelines } = data;
  return (
    <Card
      icon={<AlertTriangle size={18} className="text-rose-500" />}
      title="지난 밤 자동화 실패"
      description="최근 24시간 동안 실패한 파이프라인 실행"
    >
      {failedPipelines.length === 0 ? (
        <EmptyRow message="이상 없음 — 모든 실행이 정상 완료됐습니다." />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100 -mx-1">
          {failedPipelines.map((run) => (
            <li key={run.id} className="px-1 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <div className="flex items-center gap-2 shrink-0 sm:w-32">
                <span className="text-xs font-medium text-slate-700 truncate">
                  {run.workspace_name}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">{run.report_type}</span>
              </div>
              <div className="flex-1 min-w-0 text-xs text-slate-600">
                <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded bg-rose-50 text-rose-600 text-[10px] font-medium">
                  {run.error_stage ?? 'unknown'}
                </span>
                <span className="break-all">{run.error_message ?? '—'}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                {relativeKst(run.started_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function RiskDigestCard({ data }: { data: AdminHomeData }) {
  const { pendingRiskReports, pendingRiskReportCount, newCriticalCount } = data;
  const hasAnything = pendingRiskReportCount > 0 || newCriticalCount > 0;
  return (
    <Card
      icon={<ShieldAlert size={18} className="text-amber-500" />}
      title="리스크 현황"
      description="최근 24시간 신규 리스크 콘텐츠 + 신고 대행 대기"
    >
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-slate-500">신규 리스크 콘텐츠</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
            {newCriticalCount.toLocaleString()}
            <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">건</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-slate-500">신고 대행 대기</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
            {pendingRiskReportCount.toLocaleString()}
            <span className="text-xs sm:text-sm font-medium text-slate-400 ml-1">건</span>
          </p>
        </div>
      </div>

      {pendingRiskReports.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 -mx-1">
          {pendingRiskReports.map((r) => (
            <li key={r.id} className="px-1 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <Flag size={12} className="text-amber-500 shrink-0 hidden sm:block" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {r.workspace_name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 shrink-0">
                    {criticalLabel[r.critical_type] ?? r.critical_type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{r.title}</p>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                {relativeKst(r.requested_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!hasAnything && (
        <EmptyRow message="대응 대기 중인 리스크가 없습니다." />
      )}
    </Card>
  );
}

export function WorkspaceAlertsCard({ data }: { data: AdminHomeData }) {
  const { workspaceAlerts, scope } = data;
  return (
    <Card
      icon={<AlertTriangle size={18} className="text-slate-500" />}
      title="이상 워크스페이스"
      description={
        scope === 'all'
          ? '최근 24시간 실패 세션이 발생한 워크스페이스'
          : '담당 워크스페이스 중 실패 세션이 발생한 곳'
      }
    >
      {workspaceAlerts.length === 0 ? (
        <EmptyRow message="이상 워크스페이스 없음." />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {workspaceAlerts.map((ws) => (
            <li key={ws.workspace_id}>
              <Link
                href={`/workspace/${ws.workspace_id}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-800 truncate">
                  {ws.workspace_name}
                </span>
                <span className="text-xs text-rose-500 font-semibold tabular-nums shrink-0">
                  실패 {ws.failed_session_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
