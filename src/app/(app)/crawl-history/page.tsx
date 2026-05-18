import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { CrawlHistoryClient } from './CrawlHistoryClient';

// 크롤 히스토리 — 보존 모드 데이터 디버깅용. super_admin 전용.
export default async function CrawlHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'super_admin') {
    redirect('/workspace');
  }
  return <CrawlHistoryClient />;
}
