import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PipelineResponse {
  status: string;
  workspace_id: string;
  type: 'initial_30d' | 'weekly';
}

export interface TriggerPipelineInput {
  workspaceId: string;
  reportId: string;
  triggeredBy: 'manual' | 'cron';
}

export async function triggerPipeline(input: TriggerPipelineInput): Promise<PipelineResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_URL}/api/pipeline/all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      workspace_id: input.workspaceId,
      report_id: input.reportId,
      triggered_by: input.triggeredBy,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail ?? '파이프라인 실행에 실패했습니다.');
  }

  return res.json();
}
