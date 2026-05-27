import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { AuthUser, ProfileRow } from '@/types/auth';

// React.cache 로 같은 request 내 중복 호출 방지 (layout + page + 등에서 매번 호출돼도 1회만 실행).
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const _t0 = Date.now();
  const supabase = await createClient();
  const _tAuth0 = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  const _authMs = Date.now() - _tAuth0;

  if (!user) {
    console.log(`[NAV] getCurrentUser: ${Date.now() - _t0}ms (auth=${_authMs}ms, no-user)`);
    return null;
  }

  const _tProfile0 = Date.now();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();
  const _profileMs = Date.now() - _tProfile0;
  console.log(`[NAV] getCurrentUser: ${Date.now() - _t0}ms (auth=${_authMs}ms, profile=${_profileMs}ms)`);

  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      companyName: profile.company_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  // profiles 테이블에 없는 경우 fallback
  return {
    id: user.id,
    email: user.email ?? '',
    companyName: user.user_metadata?.company_name ?? '',
    avatarUrl: null,
    role: 'user',
    createdAt: user.created_at,
    updatedAt: user.created_at,
  };
});
