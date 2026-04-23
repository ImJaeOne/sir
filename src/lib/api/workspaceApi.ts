import { createClient } from '@/lib/supabase/client';
import { workspaceSchema, workspaceProfileSchema, createWorkspaceSchema } from '@/types/workspace';
import type { Workspace, WorkspaceProfile, CreateWorkspaceDto } from '@/types/workspace';

const supabase = createClient();

export interface LatestReport {
  id: string;
  period_start: string;
  period_end: string;
  type: string;
  status: string;
  has_failed_session: boolean;
  has_running_session: boolean;
}

export async function getWorkspaces(): Promise<(Workspace & { latest_report?: LatestReport })[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const workspaces = workspaceSchema.array().parse(data);

  // 각 워크스페이스의 최신 report 조회
  const { data: reports } = await supabase
    .from('reports')
    .select('id, workspace_id, period_start, period_end, type, status')
    .order('created_at', { ascending: false });

  const latestByWs = new Map<string, Omit<LatestReport, 'has_failed_session' | 'has_running_session'>>();
  for (const r of reports ?? []) {
    if (!latestByWs.has(r.workspace_id)) {
      latestByWs.set(r.workspace_id, {
        id: r.id,
        period_start: r.period_start,
        period_end: r.period_end,
        type: r.type,
        status: r.status,
      });
    }
  }

  // 최신 report 들에 대한 세션 상태 일괄 조회 (실패/진행 중 플래그만 계산)
  const latestReportIds = Array.from(latestByWs.values()).map((r) => r.id);
  const failedSet = new Set<string>();
  const runningSet = new Set<string>();
  if (latestReportIds.length > 0) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('report_id, status')
      .in('report_id', latestReportIds);
    for (const s of sessions ?? []) {
      if (s.status === 'failed') failedSet.add(s.report_id);
      else if (['pending', 'crawling', 'analyzing', 'clustering'].includes(s.status)) runningSet.add(s.report_id);
    }
  }

  return workspaces.map((ws) => {
    const base = latestByWs.get(ws.id);
    const latest_report: LatestReport | undefined = base
      ? {
          ...base,
          has_failed_session: failedSet.has(base.id),
          has_running_session: runningSet.has(base.id),
        }
      : undefined;
    return { ...ws, latest_report };
  });
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return workspaceSchema.parse(data);
}

export async function createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
  const validated = createWorkspaceSchema.parse(dto);
  const { profile, ...workspaceData } = validated;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 1. workspace 생성
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert(workspaceData)
    .select()
    .single();

  if (wsError) throw wsError;

  const result = workspaceSchema.parse(workspace);

  // 2. 멤버 등록 (생성자를 owner로)
  await supabase
    .from('workspace_members')
    .insert({ workspace_id: result.id, profile_id: user.id, role: 'owner' });

  // 3. workspace_profiles upsert (프로필 데이터가 있으면)
  if (profile && (profile.industry || profile.business_summary)) {
    const { error: profileError } = await supabase
      .from('workspace_profiles')
      .upsert({
        workspace_id: result.id,
        industry: profile.industry ?? null,
        business_summary: profile.business_summary ?? null,
      }, { onConflict: 'workspace_id' });

    if (profileError) {
      await supabase.from('workspaces').delete().eq('id', result.id);
      throw profileError;
    }
  }

  // 4. 주가 데이터 수집 (30일, 백그라운드)
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/collect/stock-prices?workspace_id=${result.id}`)
    .catch(() => {});

  return result;
}

export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getWorkspaceProfile(workspaceId: string): Promise<WorkspaceProfile | null> {
  const { data, error } = await supabase
    .from('workspace_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data ? workspaceProfileSchema.parse(data) : null;
}

export interface Report {
  id: string;
  workspace_id: string;
  type: string;
  period_start: string;
  period_end: string;
  sir_score: number | null;
  status: string;
  generated_at: string | null;
  created_at: string;
}

export async function getReports(workspaceId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export interface ReportProgress {
  reportId: string;
  sessions: {
    id: string;
    platform_id: string;
    status: string;
    failed_reason: string | null;
    error_message: string | null;
    total_items: number;
  }[];
  // 주간 전용 다회 크롤 분석용 — 플랫폼당 여러 세션(1차/2차) 모두 포함, 최신순
  allSessions: {
    id: string;
    platform_id: string;
    status: string;
    failed_reason: string | null;
    error_message: string | null;
    total_items: number;
    created_at: string;
  }[];
  hasSummary: boolean;
  strategyCategories: string[];
  // 주간 카드용 — 카테고리별 세부 상태. status 가 'done' 이어야 실제 완료.
  strategies: {
    category: string;
    status: string;
    error_message: string | null;
  }[];
}

export async function getReportProgress(workspaceId: string): Promise<ReportProgress[]> {
  const [reportsRes, sessionsRes, strategiesRes] = await Promise.all([
    supabase
      .from('reports')
      .select('id, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase
      .from('sessions')
      .select('id, report_id, platform_id, status, failed_reason, error_message, total_items, created_at')
      .eq('workspace_id', workspaceId)
      .not('platform_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('session_strategies')
      .select('report_id, category, status, error_message, created_at')
      .eq('workspace_id', workspaceId),
  ]);

  const reports = reportsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const strategies = strategiesRes.data ?? [];

  return reports.map(report => {
    // 해당 리포트에 속하는 세션만 필터 + 플랫폼별 최신 1개
    const reportSessions = sessions.filter(s => s.report_id === report.id);
    const byPlatform = new Map<string, typeof sessions[number]>();
    for (const s of reportSessions) {
      if (!byPlatform.has(s.platform_id!)) {
        byPlatform.set(s.platform_id!, s);
      }
    }

    // 해당 리포트의 전략/총평만 필터 — status='done' 인 것만 집계에 반영
    const reportStrategies = strategies.filter(s => s.report_id === report.id);
    const doneStrategies = reportStrategies.filter(s => s.status === 'done');
    const hasSummary = doneStrategies.some(s => s.category === 'summary');
    const strategyCategories = [...new Set(doneStrategies.filter(s => s.category !== 'summary').map(s => s.category as string))];

    return {
      reportId: report.id,
      sessions: Array.from(byPlatform.values()).map(s => ({
        id: s.id,
        platform_id: s.platform_id!,
        status: s.status,
        failed_reason: s.failed_reason,
        error_message: s.error_message,
        total_items: s.total_items,
      })),
      allSessions: reportSessions.map(s => ({
        id: s.id,
        platform_id: s.platform_id!,
        status: s.status,
        failed_reason: s.failed_reason,
        error_message: s.error_message,
        total_items: s.total_items,
        created_at: s.created_at as string,
      })),
      hasSummary,
      strategyCategories,
      strategies: reportStrategies.map(s => ({
        category: s.category as string,
        status: s.status as string,
        error_message: (s as { error_message?: string | null }).error_message ?? null,
      })),
    };
  });
}

// 활성 플랫폼 목록 — 백엔드 config.ACTIVE_PLATFORMS 와 동기화 유지
export const ACTIVE_PLATFORMS = ['naver_news', 'naver_blog', 'youtube', 'naver_stock'] as const;

/** 활성 플랫폼 중 done 이 아닌 세션이 하나라도 있으면 false */
export function isAllPlatformsDone(progress: ReportProgress | undefined): boolean {
  if (!progress) return false;
  const map = new Map(progress.sessions.map(s => [s.platform_id, s]));
  return ACTIVE_PLATFORMS.every(p => map.get(p)?.status === 'done');
}

export async function updateWorkspaceProfile(
  workspaceId: string,
  profile: { industry?: string | null; business_summary?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('workspace_profiles')
    .upsert({
      workspace_id: workspaceId,
      industry: profile.industry ?? null,
      business_summary: profile.business_summary ?? null,
    }, { onConflict: 'workspace_id' });

  if (error) throw error;
}
