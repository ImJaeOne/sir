/** 관리자 홈 대시보드 전용 서버 쿼리 */
import { createClient } from '@/lib/supabase/server';
import type { AdminHomeWindowHours } from '@/lib/adminHome/window';

// 클라이언트 / 서버 양쪽에서 쓰는 토글 상수·파서는 ./window 로 분리됨 (server import 회피).
export type { AdminHomeWindowHours } from '@/lib/adminHome/window';
export { ADMIN_HOME_WINDOWS, parseAdminHomeWindow } from '@/lib/adminHome/window';

export interface FailedPipelineRun {
  id: string;
  workspace_id: string;
  workspace_name: string;
  report_type: string;
  started_at: string;
  error_stage: string | null;
  error_message: string | null;
}

export interface PendingRiskReport {
  id: string;
  workspace_id: string;
  workspace_name: string;
  title: string;
  critical_type: string;
  requested_at: string;
}

export interface WorkspaceAlert {
  workspace_id: string;
  workspace_name: string;
  latest_report_id: string | null;
  failed_session_count: number;
}

export interface AdminHomeData {
  failedPipelines: FailedPipelineRun[];
  pendingRiskReports: PendingRiskReport[];
  pendingRiskReportCount: number;
  newCriticalCount: number;
  workspaceAlerts: WorkspaceAlert[];
  scope: 'all' | 'assigned';
  windowHours: AdminHomeWindowHours;
  generatedAt: string;
}

/** 대상 workspace 집합. super_admin 은 null(= 필터 없음), admin 은 배정된 ws 배열. */
async function resolveScope(role: string, userId: string): Promise<string[] | null> {
  if (role === 'super_admin') return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('profile_id', userId);
  return (data ?? []).map((r) => r.workspace_id);
}

export async function loadAdminHome(
  role: string,
  userId: string,
  windowHours: AdminHomeWindowHours = 24,
): Promise<AdminHomeData> {
  const supabase = await createClient();
  const assignedIds = await resolveScope(role, userId);
  const scope: 'all' | 'assigned' = assignedIds === null ? 'all' : 'assigned';
  const generatedAt = new Date().toISOString();
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  // admin 인데 배정된 ws 가 없으면 빈 결과
  if (assignedIds !== null && assignedIds.length === 0) {
    return {
      failedPipelines: [],
      pendingRiskReports: [],
      pendingRiskReportCount: 0,
      newCriticalCount: 0,
      workspaceAlerts: [],
      scope,
      windowHours,
      generatedAt,
    };
  }

  // A. 최근 24h 실패 pipeline_runs
  const pipelineQuery = supabase
    .from('pipeline_runs')
    .select('id, workspace_id, report_type, started_at, error_stage, error_message, workspaces!inner(company_name)')
    .eq('status', 'failed')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(10);
  if (assignedIds) pipelineQuery.in('workspace_id', assignedIds);
  const { data: pipelineRows } = await pipelineQuery;
  const failedPipelines: FailedPipelineRun[] = (pipelineRows ?? []).map((r) => ({
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    workspace_name: (r.workspaces as { company_name?: string } | null)?.company_name ?? '',
    report_type: r.report_type as string,
    started_at: r.started_at as string,
    error_stage: (r.error_stage as string | null) ?? null,
    error_message: (r.error_message as string | null) ?? null,
  }));

  // B-1. 신고 대행 대기 (status NOT IN resolved/rejected)
  const riskQuery = supabase
    .from('risk_reports')
    .select('id, workspace_id, title, critical_type, requested_at, workspaces!inner(company_name)', {
      count: 'exact',
    })
    .not('status', 'in', '("resolved","rejected")')
    .order('requested_at', { ascending: false })
    .limit(5);
  if (assignedIds) riskQuery.in('workspace_id', assignedIds);
  const { data: riskRows, count: riskCount } = await riskQuery;
  const pendingRiskReports: PendingRiskReport[] = (riskRows ?? []).map((r) => ({
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    workspace_name: (r.workspaces as { company_name?: string } | null)?.company_name ?? '',
    title: r.title as string,
    critical_type: r.critical_type as string,
    requested_at: r.requested_at as string,
  }));

  // B-2. 최근 24h 내 등록된 critical 콘텐츠 총합 (news + community + sns)
  const [newsCrit, commCrit, snsCrit] = await Promise.all([
    (() => {
      const q = supabase
        .from('news_items')
        .select('id', { count: 'exact', head: true })
        .not('critical_type', 'is', null)
        .gte('created_at', since);
      if (assignedIds) q.in('workspace_id', assignedIds);
      return q;
    })(),
    (() => {
      const q = supabase
        .from('community_items')
        .select('id', { count: 'exact', head: true })
        .not('critical_type', 'is', null)
        .gte('created_at', since);
      if (assignedIds) q.in('workspace_id', assignedIds);
      return q;
    })(),
    (() => {
      const q = supabase
        .from('sns_items')
        .select('id', { count: 'exact', head: true })
        .not('critical_type', 'is', null)
        .gte('created_at', since);
      if (assignedIds) q.in('workspace_id', assignedIds);
      return q;
    })(),
  ]);
  const newCriticalCount = (newsCrit.count ?? 0) + (commCrit.count ?? 0) + (snsCrit.count ?? 0);

  // C. 이상 ws — 최근 24h 에 failed 세션이 있는 ws
  const sessionQuery = supabase
    .from('sessions')
    .select('workspace_id, report_id, workspaces!inner(company_name)')
    .eq('status', 'failed')
    .gte('updated_at', since);
  if (assignedIds) sessionQuery.in('workspace_id', assignedIds);
  const { data: failedSessions } = await sessionQuery;

  const alertMap = new Map<string, WorkspaceAlert>();
  for (const row of failedSessions ?? []) {
    const wsId = row.workspace_id as string;
    const wsName = (row.workspaces as { company_name?: string } | null)?.company_name ?? '';
    const existing = alertMap.get(wsId);
    if (existing) {
      existing.failed_session_count += 1;
      if (row.report_id && !existing.latest_report_id) existing.latest_report_id = row.report_id as string;
    } else {
      alertMap.set(wsId, {
        workspace_id: wsId,
        workspace_name: wsName,
        latest_report_id: (row.report_id as string | null) ?? null,
        failed_session_count: 1,
      });
    }
  }
  const workspaceAlerts = Array.from(alertMap.values()).sort(
    (a, b) => b.failed_session_count - a.failed_session_count,
  );

  return {
    failedPipelines,
    pendingRiskReports,
    pendingRiskReportCount: riskCount ?? 0,
    newCriticalCount,
    workspaceAlerts,
    scope,
    windowHours,
    generatedAt,
  };
}
