import type { Metadata, Viewport } from 'next';
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/sir-icon.png', sizes: '80x80', type: 'image/png' },
      { url: '/icons/sir-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/sir-icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SIR',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#362CFF',
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
