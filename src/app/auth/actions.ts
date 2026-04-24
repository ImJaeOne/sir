'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveLandingPath } from '@/lib/auth/resolveLandingPath';
import type { AuthResult } from '@/types/auth';

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  const target = data.user ? await resolveLandingPath(supabase, data.user.id) : '/';
  redirect(target);
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;

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
