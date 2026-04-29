// future-dated sub 시나리오: 옛 쿼리는 잡고, 새 쿼리는 무시하는지 검증
// 임시 INSERT → 옛/새 쿼리 비교 → DELETE
// Usage: node --env-file=.env.local scripts/test-future-sub.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const WS = '3ba537e6-2d0d-4eb7-96e2-2b26626d1291'; // 디케이앤디
const nowIso = new Date().toISOString();

console.log(`현재 시각: ${nowIso}\n`);

// 1) 미래 sub INSERT (DKND 활성 만료 후 시작 → EXCLUDE 통과)
console.log('[셋업] 미래 시작 sub 1건 INSERT (2027-05-01 ~ 2028-05-01)');
const futureStart = '2027-05-01T00:00:00+09:00';
const futureEnd = '2028-05-01T00:00:00+09:00';
const ins = await supabase
  .from('subscriptions')
  .insert({
    workspace_id: WS,
    tier: 'black_plus',
    started_at: futureStart,
    ended_at: futureEnd,
    reason: 'test-future',
  })
  .select()
  .single();
if (ins.error) { console.error('INSERT 실패:', ins.error.message); process.exit(1); }
const futureId = ins.data.id;
console.log(`  ✅ INSERT 성공: id=${futureId}\n`);

// 2) 옛 쿼리 (구버전): ended_at IS NULL OR ended_at > NOW
console.log('[옛 쿼리] WHERE ended_at IS NULL OR ended_at > NOW()');
const oldQ = await supabase
  .from('subscriptions')
  .select('id, tier, started_at, ended_at')
  .eq('workspace_id', WS)
  .or(`ended_at.is.null,ended_at.gt.${nowIso}`);
console.log(`  ${oldQ.data.length} rows 잡힘`);
oldQ.data.forEach((r) => {
  const isFuture = r.id === futureId;
  console.log(`    ${isFuture ? '⚠ FUTURE' : '✓ active'} | ${r.tier} | ${r.started_at} ~ ${r.ended_at}`);
});

// 3) 새 쿼리 (segment model 042): started_at <= NOW AND ended_at > NOW
console.log('\n[새 쿼리] WHERE started_at <= NOW AND ended_at > NOW (배포된 Edge Function 의 쿼리)');
const newQ = await supabase
  .from('subscriptions')
  .select('id, tier, started_at, ended_at')
  .eq('workspace_id', WS)
  .lte('started_at', nowIso)
  .gt('ended_at', nowIso);
console.log(`  ${newQ.data.length} rows 잡힘`);
newQ.data.forEach((r) => {
  const isFuture = r.id === futureId;
  console.log(`    ${isFuture ? '⚠ FUTURE (잡히면 안 됨)' : '✓ active'} | ${r.tier} | ${r.started_at} ~ ${r.ended_at}`);
});

// 4) 검증
console.log('\n[검증]');
const oldHasFuture = oldQ.data.some((r) => r.id === futureId);
const newHasFuture = newQ.data.some((r) => r.id === futureId);
console.log(`  옛 쿼리: 미래 sub 잡음 = ${oldHasFuture ? '✅ (예상대로)' : '❌'}`);
console.log(`  새 쿼리: 미래 sub 무시 = ${!newHasFuture ? '✅ (예상대로)' : '❌'}`);

// 5) Cleanup
console.log('\n[Cleanup]');
const del = await supabase.from('subscriptions').delete().eq('id', futureId);
console.log(del.error ? `  ❌ ${del.error.message}` : `  ✅ 미래 sub 삭제 완료`);

// 6) 최종 상태
const { data: final } = await supabase
  .from('subscriptions')
  .select('tier, started_at, ended_at, reason')
  .eq('workspace_id', WS)
  .order('started_at');
console.log('\n[DKND 최종 상태]');
console.table(final.map((r) => ({
  tier: r.tier,
  start: r.started_at.slice(0, 19),
  end: r.ended_at.slice(0, 19),
  reason: r.reason ?? '',
})));

const passed = oldHasFuture && !newHasFuture;
console.log(`\n결과: ${passed ? '✅ 새 쿼리가 future-dated 를 정확히 무시' : '❌ 검증 실패'}`);
process.exit(passed ? 0 : 1);
