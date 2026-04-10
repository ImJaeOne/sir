import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface UpgradeInquiryDto {
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
}

export async function submitUpgradeInquiry(dto: UpgradeInquiryDto): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_URL}/api/inquiry/upgrade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail ?? '문의 전송에 실패했습니다.');
  }
}
