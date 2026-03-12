import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/ui/AppShell';

export const metadata: Metadata = {
  title: 'InnoPlan SIR',
  description: 'AI 기반 디지털 평판 관리 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
