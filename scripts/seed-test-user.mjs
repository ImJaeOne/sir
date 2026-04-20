// 기존 워크스페이스에 user role 로 붙일 테스트 계정 생성.
// Usage:
//   node --env-file=.env.local scripts/seed-test-user.mjs \
//     --workspace <workspaceId> --email <email> --password <password>
//   node --env-file=.env.local scripts/seed-test-user.mjs --delete <userId>

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
}

if (args.delete) {
  const { error } = await supabase.auth.admin.deleteUser(args.delete);
  if (error) { console.error(error); process.exit(1); }
  console.log('deleted', args.delete);
  process.exit(0);
}

const { workspace, email, password } = args;
if (!workspace || !email || !password) {
  console.error('usage: --workspace <id> --email <email> --password <pwd>');
  process.exit(1);
}

const { data: ws, error: wsErr } = await supabase
  .from('workspaces')
  .select('company_name')
  .eq('id', workspace)
  .single();
if (wsErr || !ws) { console.error('workspace not found:', wsErr?.message); process.exit(1); }

const { data: userData, error: uErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { company_name: ws.company_name },
});
if (uErr) { console.error('createUser:', uErr.message); process.exit(1); }

const userId = userData.user.id;

// user_profiles 는 on_auth_user_created 트리거로 이미 role='user' 로 생성됨.
// company_name 만 워크스페이스 이름으로 보정
const { error: profErr } = await supabase
  .from('user_profiles')
  .update({ company_name: ws.company_name })
  .eq('id', userId);
if (profErr) {
  await supabase.auth.admin.deleteUser(userId);
  console.error('profile update:', profErr.message);
  process.exit(1);
}

// 기존 멤버 여부 확인 (auto_assign 트리거가 먼저 꽂았을 수 있음)
const { data: existing } = await supabase
  .from('workspace_members')
  .select('id')
  .eq('workspace_id', workspace)
  .eq('profile_id', userId)
  .maybeSingle();

if (!existing) {
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace, profile_id: userId, role: 'user' });
  if (memErr) {
    await supabase.auth.admin.deleteUser(userId);
    console.error('member insert:', memErr.message);
    process.exit(1);
  }
}

console.log(JSON.stringify({ userId, email, workspace: ws.company_name }));
