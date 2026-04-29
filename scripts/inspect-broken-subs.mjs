// Inspect broken subscriptions: identify workspaces and cron impact.
// Usage: node --env-file=.env.local scripts/inspect-broken-subs.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const brokenWsIds = [
  '10f4271e-6092-4f0f-81cb-40b02d810cdc',
  '11b38336-85aa-4db8-8712-e412407f37f2',
  '3da73f85-efef-411c-8b12-06483ffced09',
  '4ee92a67-4d9b-4d87-bf1c-03b815308f5f',
  'e96e58cd-5e3d-4e61-b896-47e894db21cb',
];

const now = new Date();

console.log('==== 깨진 워크스페이스별 상세 ====\n');

for (const wsId of brokenWsIds) {
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, slug, company_name, created_at')
    .eq('id', wsId)
    .maybeSingle();

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, started_at, ended_at, created_at, created_by')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: true });

  const { data: members } = await supabase
    .from('workspace_members')
    .select('profile_id, role, user_profiles(email, company_name)')
    .eq('workspace_id', wsId);

  console.log(`\n─── ${wsId.slice(0, 8)} ───`);
  console.log(`Workspace: ${JSON.stringify(ws, null, 2)}`);
  console.log(`Members:`);
  members?.forEach(m => {
    console.log(`  ${m.role} | ${m.user_profiles?.email} | ${m.user_profiles?.company_name}`);
  });
  console.log(`Subscription rows (${subs?.length}):`);
  subs?.forEach(s => {
    const started = new Date(s.started_at);
    const ended = new Date(s.ended_at);
    const broken = started > ended;
    const active = !broken && started <= now && ended > now;
    const status = broken ? '❌ BROKEN' : active ? '✅ ACTIVE' : '⏸  past/future';
    console.log(`  ${status} | tier=${s.tier} | ${s.started_at} ~ ${s.ended_at} | created=${s.created_at}`);
  });
}

console.log('\n\n==== Cron 영향 분석 ====\n');
console.log('Cron 활성 sub 쿼리: WHERE ended_at IS NULL OR ended_at > NOW()');
console.log(`현재 시각 (NOW): ${now.toISOString()}\n`);

for (const wsId of brokenWsIds) {
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, started_at, ended_at')
    .eq('workspace_id', wsId);

  const cronVisible = subs.filter(s => s.ended_at === null || new Date(s.ended_at) > now);
  const broken = subs.filter(s => new Date(s.started_at) > new Date(s.ended_at));

  console.log(`ws=${wsId.slice(0, 8)}`);
  console.log(`  cron 이 보는 row: ${cronVisible.length}건`);
  cronVisible.forEach(s => console.log(`    ${s.tier} | ${s.started_at} ~ ${s.ended_at}`));
  console.log(`  지울 깨진 row: ${broken.length}건`);
  broken.forEach(s => {
    const inCronView = cronVisible.some(c => c.id === s.id);
    console.log(`    ${s.tier} | ${s.started_at} ~ ${s.ended_at} | cron 에서 보임? ${inCronView ? '⚠ YES' : '✅ NO'}`);
  });
}
