'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveLandingPath } from '@/lib/auth/resolveLandingPath';
import { checkPassword, PASSWORD_POLICY_MESSAGE } from '@/lib/auth/passwordPolicy';
import type { AuthResult } from '@/types/auth';

/**
 * Supabase Auth 의 영문 에러를 한국어로 변환.
 *
 * 보안: invalid credentials / user not found / wrong password 등은 모두
 * 같은 통일 메시지로 매핑 — 계정 존재 여부 노출 방지.
 */
function localizeLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return '시도 횟수가 많습니다. 잠시 후 다시 시도해주세요.';
  }
  // invalid credentials / user not found / wrong password / 그 외 인증 실패
  return '이메일 또는 비밀번호를 다시 확인해주세요.';
}

export async function login(formData: FormData): Promise<AuthResult> {
  // === [TEMP] login latency probe — 진단 끝나면 제거 ===
  const tStart = Date.now();
  console.log(`[login-probe][server] === login() 진입 ===`);
  // ====================================================

  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const tSignIn = Date.now();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log(`[login-probe][server] signInWithPassword: ${Date.now() - tSignIn}ms`);

  if (error) {
    return { success: false, error: localizeLoginError(error.message) };
  }

  const tResolve = Date.now();
  const target = data.user ? await resolveLandingPath(supabase, data.user.id) : '/';
  console.log(`[login-probe][server] resolveLandingPath: ${Date.now() - tResolve}ms  → ${target}`);
  console.log(`[login-probe][server] login() 총: ${Date.now() - tStart}ms (redirect 직전)`);
  redirect(target);
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;

  // 클라 우회 차단 — 같은 정책으로 서버에서 한 번 더 검증.
  if (!checkPassword(password).ok) {
    return { success: false, error: PASSWORD_POLICY_MESSAGE };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: companyName,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const target = data.user ? await resolveLandingPath(supabase, data.user.id) : '/';
  redirect(target);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
