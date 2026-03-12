import { getCurrentUser } from '@/lib/auth';
import { AppShell } from '@/components/ui/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return <AppShell user={user}>{children}</AppShell>;
}
