// DKND E2E 테스트 — 시나리오별 RPC 호출 + cron 쿼리 검증
// 마지막에 black_plus 로 자동 복구
// Usage: node --env-file=.env.local scripts/test-dknd-e2e.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const WS = '3ba537e6-2d0d-4eb7-96e2-2b26626d1291';
const log = (m) => console.log(`\n${'─'.repeat(60)}\n${m}\n${'─'.repeat(60)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// cron 쿼리 모방: 'segment model' 활성 sub
async function cronView() {
  const nowIso = new Date().toISOString();
  // daily-pipeline-trigger 의 쿼리
  const all = await supabase
    .from('subscriptions')
    .select('workspace_id, tier, has_daily, has_armor, started_at, ended_at')
    .eq('workspace_id', WS)
    .lte('started_at', nowIso)
    .gt('ended_at', nowIso);
  // weekly-compile-trigger 의 쿼리 (has_daily=true 만)
  const weekly = await supabase
    .from('subscriptions')
    .select('workspace_id, tier')
    .eq('workspace_id', WS)
    .eq('has_daily', true)
    .lte('started_at', nowIso)
    .gt('ended_at', nowIso);
  return {
    daily_cron_visible: (all.data ?? []).length > 0,
    weekly_cron_visible: (weekly.data ?? []).length > 0,
    rows: all.data ?? [],
  };
}

async function showState(label) {
  console.log(`\n[${label}]`);
  const { data } = await supabase
    .from('subscriptions')
    .select('tier, started_at, ended_at, reason')
    .eq('workspace_id', WS)
    .order('started_at');
  console.table(data.map((r) => ({
    tier: r.tier,
    start: r.started_at.slice(0, 19),
    end: r.ended_at.slice(0, 19),
    reason: r.reason ?? '',
  })));
  const cron = await cronView();
  console.log(`cron daily 활성: ${cron.daily_cron_visible ? '✅' : '❌'}, weekly(has_daily): ${cron.weekly_cron_visible ? '✅' : '❌'}`);
  if (cron.rows.length > 0) {
    const r = cron.rows[0];
    console.log(`  → tier=${r.tier} has_daily=${r.has_daily} has_armor=${r.has_armor}`);
  }
  return cron;
}

// ─────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────

let passCount = 0, failCount = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); passCount++; }
  else { console.log(`  ❌ ${msg}`); failCount++; }
}

const initialState = await showState('초기 상태');
assert(initialState.daily_cron_visible, '초기: daily cron 활성');
assert(initialState.weekly_cron_visible, '초기: weekly cron 활성 (has_daily=true)');

// ─────────────────────────────────────────────
// 시나리오 1: 플랜 변경 (black_plus → black)
// ─────────────────────────────────────────────
log('시나리오 1: change_subscription_tier (black_plus → black)');
const r1 = await supabase.rpc('change_subscription_tier', {
  p_workspace_id: WS,
  p_new_tier: 'black',
});
console.log('RPC 결과:', r1.error ? `❌ ${r1.error.message}` : `✅ 새 sub id=${r1.data}`);
const s1 = await showState('change_tier 후');
assert(!r1.error, 'change_tier RPC 성공');
assert(s1.rows[0]?.tier === 'black', '활성 tier 가 black 으로');
assert(s1.daily_cron_visible, 'cron 이 새 활성을 즉시 인식');

// ─────────────────────────────────────────────
// 시나리오 2: 같은 tier 로 한 번 더 변경 시도 (실패 기대)
// ─────────────────────────────────────────────
log('시나리오 2: 같은 tier (black) 로 변경 시도 — 실패 기대');
const r2 = await supabase.rpc('change_subscription_tier', {
  p_workspace_id: WS,
  p_new_tier: 'black',
});
console.log('RPC 결과:', r2.error ? `✅ 거부됨: ${r2.error.message}` : '❌ 통과되어버림');
assert(!!r2.error, '같은 tier 변경 거부');

// ─────────────────────────────────────────────
// 시나리오 3: 기간 연장
// ─────────────────────────────────────────────
log('시나리오 3: extend_subscription (+30일)');
const before = await supabase.from('subscriptions').select('ended_at').eq('workspace_id', WS).gt('ended_at', new Date().toISOString()).maybeSingle();
const oldEnd = new Date(before.data.ended_at);
const newEnd = new Date(oldEnd.getTime() + 30 * 24 * 3600 * 1000);
const r3 = await supabase.rpc('extend_subscription', {
  p_workspace_id: WS,
  p_new_ended_at: newEnd.toISOString(),
});
console.log('RPC 결과:', r3.error ? `❌ ${r3.error.message}` : `✅ id=${r3.data}`);
const s3 = await showState('extend 후');
assert(!r3.error, 'extend RPC 성공');
assert(new Date(s3.rows[0].ended_at).getTime() === newEnd.getTime(), 'ended_at 정확히 +30일 반영');

// ─────────────────────────────────────────────
// 시나리오 4: 정정 (correct) — tier 만 black_plus 로 in-place
// ─────────────────────────────────────────────
log('시나리오 4: correct_subscription (tier 만 in-place 수정 black → black_plus)');
const activeRow = await supabase.from('subscriptions').select('id').eq('workspace_id', WS).gt('ended_at', new Date().toISOString()).maybeSingle();
const r4 = await supabase.rpc('correct_subscription', {
  p_subscription_id: activeRow.data.id,
  p_tier: 'black_plus',
});
console.log('RPC 결과:', r4.error ? `❌ ${r4.error.message}` : `✅ id=${r4.data}`);
const s4 = await showState('correct 후');
assert(!r4.error, 'correct RPC 성공');
assert(s4.rows[0]?.tier === 'black_plus', '활성 tier 가 black_plus 로');
assert(s4.rows[0]?.has_daily === true, 'has_daily 자동 재계산 (generated)');
assert(s4.rows[0]?.has_armor === true, 'has_armor 자동 재계산');

// ─────────────────────────────────────────────
// 시나리오 5: 일시 정지 → cron 빠짐 → 새 구독으로 재개 → cron 다시 보임
// ─────────────────────────────────────────────
log('시나리오 5: pause → resume (새 구독으로 재시작)');
const r5a = await supabase.rpc('pause_subscription', {
  p_workspace_id: WS,
});
console.log('pause 결과:', r5a.error ? `❌ ${r5a.error.message}` : `✅ id=${r5a.data}`);
const s5a = await showState('pause 후');
assert(!r5a.error, 'pause 성공');
assert(!s5a.daily_cron_visible, 'pause 후 cron 에서 빠짐');

await sleep(1100); // 새 sub start_at 이 paused row 의 ended_at 보다 미래여야 EXCLUDE 통과

const futureEnd = new Date(Date.now() + 365 * 24 * 3600 * 1000);
const r5b = await supabase.rpc('resume_subscription', {
  p_workspace_id: WS,
  p_new_tier: 'black_plus',
  p_new_started_at: new Date().toISOString(),
  p_new_ended_at: futureEnd.toISOString(),
});
console.log('resume 결과:', r5b.error ? `❌ ${r5b.error.message}` : `✅ id=${r5b.data}`);
const s5b = await showState('resume 후');
assert(!r5b.error, 'resume 성공');
assert(s5b.daily_cron_visible, 'resume 후 cron 활성 복귀');

// ─────────────────────────────────────────────
// 시나리오 6: 해지 → 새 구독 등록 (renew) — cron 차단 → 부활 검증
// ─────────────────────────────────────────────
log('시나리오 6: cancel → renew');
const r6a = await supabase.rpc('cancel_subscription', { p_workspace_id: WS });
console.log('cancel 결과:', r6a.error ? `❌ ${r6a.error.message}` : `✅ id=${r6a.data}`);
const s6a = await showState('cancel 후');
assert(!r6a.error, 'cancel 성공');
assert(!s6a.daily_cron_visible, 'cancel 후 cron 빠짐');

await sleep(1100);

const renewEnd = new Date(Date.now() + 365 * 24 * 3600 * 1000);
const r6b = await supabase.rpc('renew_subscription', {
  p_workspace_id: WS,
  p_new_tier: 'black_plus',
  p_new_started_at: new Date().toISOString(),
  p_new_ended_at: renewEnd.toISOString(),
});
console.log('renew 결과:', r6b.error ? `❌ ${r6b.error.message}` : `✅ id=${r6b.data}`);
const s6b = await showState('renew 후');
assert(!r6b.error, 'renew 성공');
assert(s6b.daily_cron_visible, 'renew 후 cron 부활');

// ─────────────────────────────────────────────
// 시나리오 7: 더블 클릭 시뮬레이션 (renew 동시 호출 — EXCLUDE 작동)
// ─────────────────────────────────────────────
log('시나리오 7: renew 동시 호출 — EXCLUDE 가 1개 거부');
const dupStart = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000); // 10년 후
const dupEnd = new Date(Date.now() + 11 * 365 * 24 * 3600 * 1000);
const [d1, d2] = await Promise.all([
  supabase.rpc('renew_subscription', {
    p_workspace_id: WS,
    p_new_tier: 'black',
    p_new_started_at: dupStart.toISOString(),
    p_new_ended_at: dupEnd.toISOString(),
  }),
  supabase.rpc('renew_subscription', {
    p_workspace_id: WS,
    p_new_tier: 'black',
    p_new_started_at: dupStart.toISOString(),
    p_new_ended_at: dupEnd.toISOString(),
  }),
]);
const dupSucc = [d1, d2].filter((r) => !r.error).length;
const dupFail = [d1, d2].filter((r) => r.error).length;
console.log(`성공: ${dupSucc}, 실패: ${dupFail}`);
[d1, d2].forEach((r, i) => {
  console.log(`  call ${i + 1}: ${r.error ? `❌ ${r.error.message}` : `✅ id=${r.data}`}`);
});
assert(dupSucc === 1 && dupFail === 1, '동시 renew 1개만 성공');

// 미래 row 정리 (테스트 후 깨끗하게)
log('테스트 후 정리: 미래 row 삭제');
const cleanup = await supabase
  .from('subscriptions')
  .delete()
  .eq('workspace_id', WS)
  .gte('started_at', dupStart.toISOString());
console.log(cleanup.error ? `❌ cleanup: ${cleanup.error.message}` : `✅ 미래 row 정리 완료`);

// 최종 상태
log('최종 상태');
const final = await showState('최종');
assert(final.daily_cron_visible, '최종: cron 활성 sub 1건');
assert(final.rows[0]?.tier === 'black_plus', '최종: tier=black_plus');
assert(final.rows[0]?.has_daily === true, '최종: has_daily=true');

// ─────────────────────────────────────────────
console.log(`\n\n${'═'.repeat(60)}`);
console.log(`테스트 결과: ✅ ${passCount}건 / ❌ ${failCount}건`);
console.log('═'.repeat(60));
process.exit(failCount > 0 ? 1 : 0);
