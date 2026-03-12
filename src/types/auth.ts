export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  department: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** DB profiles 테이블 row 타입 */
export interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  department?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}
