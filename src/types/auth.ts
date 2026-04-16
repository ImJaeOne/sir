export type ProfileRole = 'super_admin' | 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  companyName: string;
  avatarUrl: string | null;
  role: ProfileRole;
  createdAt: string;
  updatedAt: string;
}

/** DB user_profiles 테이블 row 타입 */
export interface ProfileRow {
  id: string;
  email: string;
  company_name: string;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}
