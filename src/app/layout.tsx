import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'InnoPlan SIR',
  description: 'AI 기반 디지털 평판 관리 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors toastOptions={{ style: { width: 'fit-content', whiteSpace: 'nowrap' } }} />
      </body>
    </html>
  );
}
