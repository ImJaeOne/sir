import { createClient } from '@/lib/supabase/server';
import type { AuthUser, ProfileRow } from '@/types/auth';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

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
}
