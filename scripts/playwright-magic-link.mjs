// Generate a Supabase magic-link URL for Playwright MCP to auto-login.
// Usage:
//   node --env-file=.env.local scripts/playwright-magic-link.mjs           # PLAYWRIGHT_ADMIN_EMAIL 로 로그인
//   node --env-file=.env.local scripts/playwright-magic-link.mjs <email>   # 지정 이메일로 로그인
// Outputs a URL to stdout that, when opened, completes login without a password.

import { createClient } from '@supabase/supabase-js';

const email = process.argv[2] ?? process.env.PLAYWRIGHT_ADMIN_EMAIL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.PLAYWRIGHT_SITE_URL ?? 'http://localhost:3000';

if (!email || !supabaseUrl || !serviceRoleKey) {
  console.error('Missing email argument or env: PLAYWRIGHT_ADMIN_EMAIL / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email,
});

if (error || !data?.properties?.action_link) {
  console.error('generateLink failed:', error?.message ?? 'no action_link');
  process.exit(1);
}

// action_link 의 redirect_to 는 Supabase Auth 의 Site URL 설정을 따라 프로덕션을 가리킬 수 있으므로
// hashed_token 만 받아서 로컬 /auth/callback 경로로 재조립한다 (token_hash + type=magiclink).
const tokenHash = data.properties.hashed_token;
if (!tokenHash) {
  console.error('hashed_token missing in properties:', data.properties);
  process.exit(1);
}

// user role 은 /workspace 접근 권한이 없어 미들웨어가 / 로 리다이렉트하므로 next 생략
const callback = new URL('/auth/callback', siteUrl);
callback.searchParams.set('token_hash', tokenHash);
callback.searchParams.set('type', 'magiclink');

console.log(callback.toString());
