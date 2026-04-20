import type { ProfileRole } from '@/types/auth';

export const ROLE_LABEL: Record<ProfileRole, string> = {
  super_admin: '최고관리자',
  admin: '관리자',
  user: '사용자',
};

export const ROLE_VARIANT: Record<ProfileRole, 'blue' | 'violet' | 'slate'> = {
  super_admin: 'blue',
  admin: 'violet',
  user: 'slate',
};
