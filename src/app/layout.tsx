import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { QueryProvider } from '@/providers/QueryProvider';
import { Toaster } from 'sonner';
import './globals.css';

const pretendard = localFont({
  src: '../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: 'InnoPlan SIR',
  description: 'AI 기반 디지털 평판 관리 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className={pretendard.className}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors toastOptions={{ style: { width: 'fit-content', whiteSpace: 'nowrap' } }} />
      </body>
    </html>
  );
}
