// DKND 워크스페이스 찾기
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: ws } = await supabase
  .from('workspaces')
  .select('*')
  .or('company_name.ilike.%dkn%,company_name.ilike.%디케이%,ticker.ilike.%dknd%,ticker.eq.066900');

console.log('Workspace 후보:');
console.table(ws);

if (ws?.[0]) {
  const id = ws[0].id;
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, started_at, ended_at, reason, created_at')
    .eq('workspace_id', id)
    .order('started_at');
  console.log(`\n${ws[0].company_name} 의 subscriptions:`);
  console.table(subs);

  const { data: members } = await supabase
    .from('workspace_members')
    .select('profile_id, role, user_profiles(email)')
    .eq('workspace_id', id);
  console.log('\nMembers:');
  members.forEach(m => console.log(`  ${m.role} | ${m.user_profiles?.email}`));
}
