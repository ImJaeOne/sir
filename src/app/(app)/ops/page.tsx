import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { OpsClient } from './OpsClient';

// 모니터링은 super_admin / admin 전용. 나머지 역할은 /workspace 로 리다이렉트.
export default async function OpsPage() {
  const _t0 = Date.now();
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    redirect('/workspace');
  }
  console.log(`[NAV] page /ops: ${Date.now() - _t0}ms`);
  return <OpsClient />;
}
