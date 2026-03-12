import { createClient } from '@/lib/supabase/server';
import type { AuthUser, ProfileRow } from '@/types/auth';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<ProfileRow>();

  if (profile) {
    return {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      department: profile.department,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  // profiles 테이블에 없는 경우 (마이그레이션 이전 가입자) fallback
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
    department: user.user_metadata?.department ?? null,
    avatarUrl: null,
    createdAt: user.created_at,
    updatedAt: user.created_at,
  };
}
