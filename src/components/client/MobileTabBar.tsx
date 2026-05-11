'use client';

import { useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { FileText, ShieldAlert, LineChart } from 'lucide-react';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';

/** 모바일 하단 고정 탭 바 — 보고서 / 모니터링 / 위기 대응 센터 */
export function MobileTabBar() {
  const params = useParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();

  const workspaceId = (params?.workspaceId as string | undefined) ?? '';
  const { data: reports } = useReports(workspaceId);

  const reportHref = useMemo(() => {
    if (!workspaceId) return '';
    const currentReportId = params?.reportId as string | undefined;
    const targetId = currentReportId ?? reports?.[0]?.id;
    return targetId ? `/report/${workspaceId}/${targetId}` : '';
  }, [workspaceId, params?.reportId, reports]);

  const monitoringHref = workspaceId ? `/monitoring/${workspaceId}` : '';
  const crisisHref = workspaceId ? `/crisis/${workspaceId}` : '';

  const items: { label: string; Icon: typeof FileText; href: string; active: boolean }[] = [
    { label: '보고서', Icon: FileText, href: reportHref, active: pathname.startsWith('/report/') },
    { label: '인스턴스', Icon: LineChart, href: monitoringHref, active: pathname.startsWith('/monitoring/') },
    { label: '위기 대응', Icon: ShieldAlert, href: crisisHref, active: pathname.startsWith('/crisis/') },
  ];

  const handleClick = (href: string) => {
    if (!href) return;
    router.push(href);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-white border-t border-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ label, Icon, href, active }) => (
        <button
          key={label}
          onClick={() => handleClick(href)}
          disabled={!href}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon size={20} color={active ? '#362CFF' : '#828EA6'} strokeWidth={1.75} />
          <span className={`text-[11px] font-medium ${active ? 'text-text-accent' : 'text-text-muted'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
