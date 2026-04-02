import { createClient } from '@/lib/supabase/client';
import { workspaceSchema, workspaceProfileSchema, createWorkspaceSchema } from '@/types/workspace';
import type { Workspace, WorkspaceProfile, CreateWorkspaceDto } from '@/types/workspace';

const supabase = createClient();

export interface LatestReport {
  period_start: string;
  period_end: string;
  type: string;
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
    .select('workspace_id, period_start, period_end, type')
    .order('created_at', { ascending: false });

  const latestByWs = new Map<string, LatestReport>();
  for (const r of reports ?? []) {
    if (!latestByWs.has(r.workspace_id)) {
      latestByWs.set(r.workspace_id, {
        period_start: r.period_start,
        period_end: r.period_end,
        type: r.type,
      });
    }
  }

  return workspaces.map(ws => ({
    ...ws,
    latest_report: latestByWs.get(ws.id),
  }));
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
