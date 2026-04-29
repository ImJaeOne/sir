// Inspect subscriptions table for migration planning (S1/S2)
// Usage: node --env-file=.env.local scripts/inspect-subscriptions.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: rows, error } = await supabase
  .from('subscriptions')
  .select('id, workspace_id, tier, started_at, ended_at, has_daily, has_armor, has_booster, created_at, created_by')
  .order('workspace_id', { ascending: true })
  .order('started_at', { ascending: true });

if (error) { console.error(error); process.exit(1); }

console.log(`\n[전체] 총 ${rows.length} rows\n`);

const nullEnded = rows.filter(r => r.ended_at === null);
console.log(`[ended_at NULL] ${nullEnded.length} rows`);
nullEnded.forEach(r => console.log(`  ws=${r.workspace_id} tier=${r.tier} started=${r.started_at}`));

const now = new Date();
const activeRows = rows.filter(r => r.ended_at === null || new Date(r.ended_at) > now);
console.log(`\n[현재 활성] ${activeRows.length} rows`);

const byWs = new Map();
for (const r of activeRows) {
  if (!byWs.has(r.workspace_id)) byWs.set(r.workspace_id, []);
  byWs.get(r.workspace_id).push(r);
}
const dupActive = [...byWs.entries()].filter(([, rs]) => rs.length > 1);
console.log(`\n[활성 다중 row 워크스페이스] ${dupActive.length}건`);
dupActive.forEach(([ws, rs]) => {
  console.log(`  ws=${ws}: ${rs.length}건`);
  rs.forEach(r => console.log(`    ${r.tier} | ${r.started_at} ~ ${r.ended_at ?? 'NULL'}`));
});

const wsAll = new Map();
for (const r of rows) {
  if (!wsAll.has(r.workspace_id)) wsAll.set(r.workspace_id, []);
  wsAll.get(r.workspace_id).push(r);
}
console.log(`\n[전체 row 의 시간 구간 겹침 검사 — 워크스페이스 단위]`);
let overlapCount = 0;
for (const [ws, rs] of wsAll) {
  const sorted = [...rs].sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j];
      const aEnd = a.ended_at ? new Date(a.ended_at) : new Date('9999-12-31');
      const bEnd = b.ended_at ? new Date(b.ended_at) : new Date('9999-12-31');
      const aStart = new Date(a.started_at);
      const bStart = new Date(b.started_at);
      // overlap if aStart < bEnd && bStart < aEnd
      if (aStart < bEnd && bStart < aEnd) {
        overlapCount++;
        console.log(`  OVERLAP ws=${ws}:`);
        console.log(`    A ${a.tier} ${a.started_at} ~ ${a.ended_at ?? 'NULL'}`);
        console.log(`    B ${b.tier} ${b.started_at} ~ ${b.ended_at ?? 'NULL'}`);
      }
    }
  }
}
if (overlapCount === 0) console.log(`  ✅ 겹침 없음`);

console.log(`\n[샘플 — 모든 row]`);
console.table(rows.map(r => ({
  ws: r.workspace_id.slice(0, 8),
  tier: r.tier,
  started: r.started_at,
  ended: r.ended_at,
  daily: r.has_daily,
  armor: r.has_armor,
})));
