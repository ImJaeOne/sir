import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/types/subscription';

const supabase = createClient();

export interface Subscription {
  id: string;
  workspace_id: string;
  tier: Tier;
  started_at: string;
  ended_at: string | null;
  has_daily: boolean;
  has_armor: boolean;
  has_booster: boolean;
  created_at: string;
}

/** 워크스페이스의 현재 활성 구독 조회 (ended_at이 NULL이거나 아직 만료되지 않은 것) */
export async function getActiveSubscription(
  workspaceId: string,
): Promise<Subscription | null> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(`ended_at.is.null,ended_at.gt.${nowIso}`)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as Subscription | null) ?? null;
}

export interface UpdateSubscriptionPeriodInput {
  workspaceId: string;
  tier: Tier;
  startedAt: string; // ISO
  endedAt: string; // ISO
}

/** 계약 기간 변경: 기존 활성 구독을 종료(ended_at=now)시키고 새 구독 행을 추가 */
export async function updateSubscriptionPeriod(
  input: UpdateSubscriptionPeriodInput,
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error: closeErr } = await supabase
    .from('subscriptions')
    .update({ ended_at: nowIso })
    .eq('workspace_id', input.workspaceId)
    .or(`ended_at.is.null,ended_at.gt.${nowIso}`);
  if (closeErr) throw closeErr;

  const { error: insertErr } = await supabase.from('subscriptions').insert({
    workspace_id: input.workspaceId,
    tier: input.tier,
    started_at: input.startedAt,
    ended_at: input.endedAt,
  });
  if (insertErr) throw insertErr;
}
