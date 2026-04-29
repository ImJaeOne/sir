// Admin 매직링크 생성 (Playwright 테스트용)
// Usage: node --env-file=.env.local scripts/gen-magiclink.mjs <email>

import { createClient } from '@supabase/supabase-js';

const email = process.argv[2] ?? 'innoplanweb@gmail.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: 'http://localhost:3000/auth/callback' },
});

if (error) { console.error('Error:', error.message); process.exit(1); }

console.log(JSON.stringify({
  email,
  action_link: data.properties.action_link,
}, null, 2));
