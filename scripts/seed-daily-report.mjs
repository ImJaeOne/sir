// Insert a stub daily report for UI validation, print its id.
// Usage:
//   node --env-file=.env.local scripts/seed-daily-report.mjs <workspaceId> <yyyy-mm-dd>
//   node --env-file=.env.local scripts/seed-daily-report.mjs --delete <reportId>

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const [arg1, arg2] = process.argv.slice(2);

if (arg1 === '--delete') {
  const { error } = await supabase.from('reports').delete().eq('id', arg2);
  if (error) { console.error(error); process.exit(1); }
  console.log('deleted', arg2);
  process.exit(0);
}

const workspaceId = arg1;
const day = arg2;
if (!workspaceId || !day) {
  console.error('usage: node scripts/seed-daily-report.mjs <workspaceId> <yyyy-mm-dd>');
  process.exit(1);
}

const { data, error } = await supabase
  .from('reports')
  .insert({
    workspace_id: workspaceId,
    type: 'daily',
    status: 'published',
    period_start: day,
    period_end: day,
    sir_score: 500,
  })
  .select('id')
  .single();

if (error) { console.error(error); process.exit(1); }
console.log(data.id);
