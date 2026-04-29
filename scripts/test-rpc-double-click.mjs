// EXCLUDE constraint + RPC atomicity 검증
// 시나리오: 같은 워크스페이스에 change_tier 를 동시에 2번 호출
//   → 1개 성공, 1개 실패해야 정상
// Usage: node --env-file=.env.local scripts/test-rpc-double-click.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// 활성 sub 1개 가져옴
const { data: sub } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('tier', 'black_plus')
  .gt('ended_at', new Date().toISOString())
  .lte('started_at', new Date().toISOString())
  .limit(1)
  .maybeSingle();

if (!sub) {
  console.error('No active black_plus sub for test');
  process.exit(1);
}

console.log(`테스트 대상: ws=${sub.workspace_id.slice(0, 8)} tier=${sub.tier} ${sub.started_at} ~ ${sub.ended_at}\n`);

// 1️⃣ EXCLUDE constraint 직접 검증 — 겹치는 INSERT 시도
console.log('[Test 1] 겹치는 INSERT — EXCLUDE constraint 가 거부?');
const overlap = await supabase
  .from('subscriptions')
  .insert({
    workspace_id: sub.workspace_id,
    tier: 'black_plus',
    started_at: new Date(Date.now() + 1000).toISOString(),
    ended_at: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
  });
if (overlap.error) {
  console.log(`  ✅ 거부됨: ${overlap.error.message}`);
} else {
  console.error('  ❌ INSERT 가 통과해버림 — EXCLUDE 작동 안 함');
}

// 2️⃣ period_valid CHECK 검증 — started > ended
console.log('\n[Test 2] started > ended INSERT — CHECK constraint 가 거부?');
const reversed = await supabase
  .from('subscriptions')
  .insert({
    workspace_id: sub.workspace_id,
    tier: 'black_plus',
    started_at: new Date(Date.now() + 10000).toISOString(),
    ended_at: new Date(Date.now() - 10000).toISOString(),
  });
if (reversed.error) {
  console.log(`  ✅ 거부됨: ${reversed.error.message}`);
} else {
  console.error('  ❌ 시간 역전이 들어가버림');
}

// 3️⃣ ended_at NULL 시도
console.log('\n[Test 3] ended_at NULL INSERT — NOT NULL 이 거부?');
const nullEnded = await supabase
  .from('subscriptions')
  .insert({
    workspace_id: sub.workspace_id,
    tier: 'black_plus',
    started_at: new Date().toISOString(),
    ended_at: null,
  });
if (nullEnded.error) {
  console.log(`  ✅ 거부됨: ${nullEnded.error.message}`);
} else {
  console.error('  ❌ NULL 이 들어가버림');
}

// 4️⃣ change_subscription_tier RPC 동시 호출 (service-role 로 간접 테스트)
// service-role 은 _assert_admin 우회. 실제 더블클릭은 admin 토큰이지만 EXCLUDE 만 보고 싶어서 service-role 사용
console.log('\n[Test 4] change_subscription_tier 동시 호출 2개 — 1개 성공, 1개 실패?');
const [r1, r2] = await Promise.all([
  supabase.rpc('change_subscription_tier', {
    p_workspace_id: sub.workspace_id,
    p_new_tier: 'black',
  }),
  supabase.rpc('change_subscription_tier', {
    p_workspace_id: sub.workspace_id,
    p_new_tier: 'black',
  }),
]);
const successes = [r1, r2].filter((r) => !r.error).length;
const failures = [r1, r2].filter((r) => r.error).length;
console.log(`  성공: ${successes}, 실패: ${failures}`);
[r1, r2].forEach((r, i) => {
  if (r.error) console.log(`  call ${i + 1} 실패: ${r.error.message}`);
  else console.log(`  call ${i + 1} 성공: 새 sub id=${r.data}`);
});
if (successes === 1 && failures === 1) {
  console.log('  ✅ 정상 — 1개만 성공');
} else if (successes === 0) {
  console.log('  ⚠ 둘 다 실패 — atomicity 검증 불가');
} else {
  console.error('  ❌ 둘 다 성공 — atomicity 깨짐');
}

// 5️⃣ 테스트로 인해 만들어진 black row 를 다시 black_plus 로 되돌림 (테스트 격리)
console.log('\n[Cleanup] tier 를 black_plus 로 복구');
const restore = await supabase.rpc('change_subscription_tier', {
  p_workspace_id: sub.workspace_id,
  p_new_tier: 'black_plus',
});
if (restore.error) console.log(`  복구 실패: ${restore.error.message}`);
else console.log(`  ✅ 복구 완료: ${restore.data}`);

// 최종 상태 확인
console.log('\n[최종 상태]');
const { data: finalRows } = await supabase
  .from('subscriptions')
  .select('tier, started_at, ended_at, reason')
  .eq('workspace_id', sub.workspace_id)
  .order('started_at', { ascending: true });
console.table(finalRows);
