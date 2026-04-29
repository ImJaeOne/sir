import { createClient } from '@/lib/supabase/client';
import type { Tier } from '@/types/subscription';

const supabase = createClient();

export interface Subscription {
  id: string;
  workspace_id: string;
  tier: Tier;
  started_at: string;
  ended_at: string;
  has_daily: boolean;
  has_armor: boolean;
  has_booster: boolean;
  reason: string | null;
  created_at: string;
}

/** 워크스페이스의 구독 상태 — 'active' | 'grace' | 'expired' (#S4)
 * - active: 활성 segment 1건 이상 (started_at <= NOW < ended_at)
 * - grace : 가장 최근 만료 ended_at + 3 months 안쪽 (보고서 read 만 가능)
 * - expired: grace 도 만료 (보고서 read 차단)
 * DB 의 subscription_status() 함수와 동일 source of truth. */
export type SubscriptionStatus = 'active' | 'grace' | 'expired';

export async function getSubscriptionStatus(workspaceId: string): Promise<SubscriptionStatus> {
  // 마이그 044 의 RPC. database.types.ts 는 적용 후 supabase gen types 로 재생성 예정 — 그 전까진 캐스팅.
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: unknown }>)('subscription_status', { ws_id: workspaceId });
  if (error) throw error;
  return (data as SubscriptionStatus) ?? 'expired';
}

/** 워크스페이스의 현재 활성 구독 조회 — started_at <= NOW < ended_at 인 단일 row */
export async function getActiveSubscription(
  workspaceId: string,
): Promise<Subscription | null> {
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .lte('started_at', nowIso)
    .gt('ended_at', nowIso)
    .maybeSingle();

  return (data as Subscription | null) ?? null;
}

/** 중간 구독제 변경: 활성 row 자르고 새 tier 로 새 row INSERT (DB transaction). */
export async function changeSubscriptionTier(input: {
  workspaceId: string;
  newTier: Tier;
  effectiveAt?: string; // ISO, default NOW
}): Promise<string> {
  const { data, error } = await supabase.rpc('change_subscription_tier', {
    p_workspace_id: input.workspaceId,
    p_new_tier: input.newTier,
    p_effective_at: input.effectiveAt ?? new Date().toISOString(),
  });
  if (error) throw error;
  return data as string;
}

/** 같은 tier 로 기간 연장 — 활성 row.ended_at UPDATE. */
export async function extendSubscription(input: {
  workspaceId: string;
  newEndedAt: string; // ISO
}): Promise<string> {
  const { data, error } = await supabase.rpc('extend_subscription', {
    p_workspace_id: input.workspaceId,
    p_new_ended_at: input.newEndedAt,
  });
  if (error) throw error;
  return data as string;
}

/** 갱신 — 새 계약 row INSERT. 옛 row 와 시간 겹치면 EXCLUDE 가 거부. */
export async function renewSubscription(input: {
  workspaceId: string;
  newTier: Tier;
  newStartedAt: string;
  newEndedAt: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('renew_subscription', {
    p_workspace_id: input.workspaceId,
    p_new_tier: input.newTier,
    p_new_started_at: input.newStartedAt,
    p_new_ended_at: input.newEndedAt,
  });
  if (error) throw error;
  return data as string;
}

/** 일시 정지 — 활성 row.ended_at = pause_at. */
export async function pauseSubscription(input: {
  workspaceId: string;
  pauseAt?: string; // ISO, default NOW
}): Promise<string> {
  const { data, error } = await supabase.rpc('pause_subscription', {
    p_workspace_id: input.workspaceId,
    p_pause_at: input.pauseAt ?? new Date().toISOString(),
  });
  if (error) throw error;
  return data as string;
}

/** 재개 — 새 row INSERT (tier 자유롭게 변경 가능). */
export async function resumeSubscription(input: {
  workspaceId: string;
  newTier: Tier;
  newStartedAt: string;
  newEndedAt: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('resume_subscription', {
    p_workspace_id: input.workspaceId,
    p_new_tier: input.newTier,
    p_new_started_at: input.newStartedAt,
    p_new_ended_at: input.newEndedAt,
  });
  if (error) throw error;
  return data as string;
}

/** 중간 해지 — 활성 row.ended_at = cancel_at. */
export async function cancelSubscription(input: {
  workspaceId: string;
  cancelAt?: string; // ISO, default NOW
}): Promise<string> {
  const { data, error } = await supabase.rpc('cancel_subscription', {
    p_workspace_id: input.workspaceId,
    p_cancel_at: input.cancelAt ?? new Date().toISOString(),
  });
  if (error) throw error;
  return data as string;
}

/** 어드민 정정 — 의미상 변경 아닌 오타/날짜 정정. UPDATE in place. */
export async function correctSubscription(input: {
  subscriptionId: string;
  tier?: Tier;
  startedAt?: string;
  endedAt?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('correct_subscription', {
    p_subscription_id: input.subscriptionId,
    ...(input.tier !== undefined && { p_tier: input.tier }),
    ...(input.startedAt !== undefined && { p_started_at: input.startedAt }),
    ...(input.endedAt !== undefined && { p_ended_at: input.endedAt }),
  });
  if (error) throw error;
  return data as string;
}
