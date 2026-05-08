/**
 * 비밀번호 정책 — 단일 진실 원천.
 *
 * 적용처:
 *  - /auth/signup (클라이언트 검증 + 강도 표시)
 *  - /auth/actions.ts signup() (서버 검증 — 클라 우회 차단)
 *  - components/user/CreateUserModal (관리자 계정 생성, 클라 검증)
 *  - /api/admin/create-user (서버 검증)
 *
 *  React 의존성 없음 → 서버/클라이언트 양쪽에서 import 가능.
 */

export interface PasswordRule {
  key: 'length' | 'letter' | 'number' | 'special';
  label: string;
  required: boolean;
  test: (v: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { key: 'length', label: '8자 이상', required: true, test: (v) => v.length >= 8 },
  { key: 'letter', label: '영문 포함', required: true, test: (v) => /[A-Za-z]/.test(v) },
  { key: 'number', label: '숫자 포함', required: true, test: (v) => /[0-9]/.test(v) },
  {
    key: 'special',
    label: '특수문자 포함 (권장)',
    required: false,
    test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v),
  },
] as const;

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordCheckResult {
  rules: {
    key: PasswordRule['key'];
    label: string;
    required: boolean;
    passed: boolean;
  }[];
  ok: boolean;
  strength: PasswordStrength;
}

export function checkPassword(pw: string): PasswordCheckResult {
  const rules = PASSWORD_RULES.map((r) => ({
    key: r.key,
    label: r.label,
    required: r.required,
    passed: r.test(pw),
  }));
  const requiredPassed = rules.filter((r) => r.required).every((r) => r.passed);

  // weak — 필수 미통과
  // medium — 필수만 통과 (8~11자 + 영문 + 숫자)
  // strong — 필수 + (특수문자 또는 12자+)
  let strength: PasswordStrength = 'weak';
  if (requiredPassed) {
    const hasSpecial = rules.find((r) => r.key === 'special')?.passed ?? false;
    strength = hasSpecial || pw.length >= 12 ? 'strong' : 'medium';
  }

  return { rules, ok: requiredPassed, strength };
}

export const PASSWORD_PLACEHOLDER = '8자 이상, 영문·숫자·특수문자 포함';
export const PASSWORD_POLICY_MESSAGE =
  '비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.';

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: '약함',
  medium: '보통',
  strong: '강함',
};
