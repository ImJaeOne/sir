import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface OpsLockHolder {
  type: 'pipeline' | 'retry' | 'regenerate';
  started_at: string;
  workspace_id?: string;
  report_id?: string;
  session_id?: string;
  platform_id?: string;
  failed_reason?: string;
  report_type?: string;
  triggered_by?: string;
}

export interface OpsRetryBatch {
  workspace_id: string | null;
  report_id: string | null;
  total: number;
  remaining: number;
  started_at: string;
}

export interface OpsFinalize {
  workspace_id: string;
  report_id: string;
  trigger: 'auto' | 'manual';
  started_at: string;
}

export interface OpsActiveSession {
  session_id: string;
  workspace_id: string;
  workspace_name: string | null;
  report_id: string | null;
  platform_id: string;
  status: 'pending' | 'crawling' | 'pending_analysis' | 'analyzing';
  updated_at: string;
}

export interface OpsWaitingSession {
  session_id: string;
  workspace_id: string;
  workspace_name: string | null;
  report_id: string | null;
  platform_id: string;
  failed_reason: string | null;
  error_message: string | null;
  updated_at: string;
}

export interface OpsCompletion {
  session_id: string;
  workspace_id: string;
  workspace_name: string | null;
  report_id: string | null;
  platform_id: string;
  status: 'done' | 'failed';
  failed_reason: string | null;
  error_message: string | null;
  updated_at: string;
}

export interface OpsUpcomingWorkspace {
  workspace_id: string;
  company_name: string | null;
  ticker: string | null;
}

export interface OpsUpcomingCron {
  scheduled_at: string;
  report_types: ('daily' | 'weekly')[];
  workspaces: OpsUpcomingWorkspace[];
}

export interface OpsQueue {
  lock_holder: OpsLockHolder | null;
  retry_batch: OpsRetryBatch | null;
  finalize: OpsFinalize | null;
  active_sessions: OpsActiveSession[];
  waiting_sessions: OpsWaitingSession[];
  recent_completions: OpsCompletion[];
  upcoming_cron: OpsUpcomingCron | null;
  server_time: string;
}

/** 서버 인-프로세스 상태 스냅샷. 백엔드: GET /api/ops/queue (super_admin). */
export async function getOpsQueue(): Promise<OpsQueue> {
  const { data: { session: auth } } = await supabase.auth.getSession();
  if (!auth) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ops/queue`, {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? '오퍼레이션 상태 조회 실패');
  }
  return res.json();
}

/** 단일 실패 세션 재시도. 백엔드: POST /api/sessions/{id}/retry (super_admin).
 *  retry-failed 와 달리 finalize 까지 이어지지 않으므로 보고서 마감은 별도. */
export async function retrySession(sessionId: string): Promise<void> {
  const { data: { session: auth } } = await supabase.auth.getSession();
  if (!auth) throw new Error('로그인이 필요합니다.');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/retry`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.access_token}` },
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? '재시도 요청 실패');
  }
}
