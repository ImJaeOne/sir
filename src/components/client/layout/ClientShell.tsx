'use client';

import { ClientSidebar } from '@/components/client/sidebar/ClientSidebar';
import type { AuthUser } from '@/types/auth';

interface ClientShellProps {
  children: React.ReactNode;
  user?: AuthUser | null;
}

export function ClientShell({ children, user = null }: ClientShellProps) {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <ClientSidebar user={user} />
      <main id="client-main" className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
