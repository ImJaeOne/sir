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
  status: 'pending' | 'crawling' | 'analyzing';
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

export interface OpsQueue {
  lock_holder: OpsLockHolder | null;
  retry_batch: OpsRetryBatch | null;
  finalize: OpsFinalize | null;
  active_sessions: OpsActiveSession[];
  recent_completions: OpsCompletion[];
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
