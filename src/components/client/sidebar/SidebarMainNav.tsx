'use client';

import { useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { FileText, ShieldAlert, LineChart } from 'lucide-react';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';

interface SidebarMainNavProps {
  isOpen: boolean;
}

/** client 사이드바 상위 2 메뉴 — 보고서 / 위기 대응 센터 */
export function SidebarMainNav({ isOpen }: SidebarMainNavProps) {
  const params = useParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();

  const workspaceId = (params?.workspaceId as string | undefined) ?? '';
  const { data: reports } = useReports(workspaceId);

  // 보고서 클릭 시 이동할 URL — 현재 URL 에 reportId 있으면 유지, 없으면 최신 report
  const reportHref = useMemo(() => {
    if (!workspaceId) return '';
    const currentReportId = params?.reportId as string | undefined;
    const targetId = currentReportId ?? reports?.[0]?.id;
    return targetId ? `/report/${workspaceId}/${targetId}` : '';
  }, [workspaceId, params?.reportId, reports]);

  const crisisHref = workspaceId ? `/crisis/${workspaceId}` : '';
  const monitoringHref = workspaceId ? `/monitoring/${workspaceId}` : '';

  const isReport = pathname.startsWith('/report/');
  const isCrisis = pathname.startsWith('/crisis/');
  const isMonitoring = pathname.startsWith('/monitoring/');

  const items: { label: string; Icon: typeof FileText; href: string; active: boolean }[] = [
    { label: '보고서', Icon: FileText, href: reportHref, active: isReport },
    { label: '인사이트', Icon: LineChart, href: monitoringHref, active: isMonitoring },
    { label: '위기 대응 센터', Icon: ShieldAlert, href: crisisHref, active: isCrisis },
  ];

  const handleClick = (href: string) => {
    if (!href) return;
    router.push(href);
  };

  return (
    <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
      {items.map(({ label, Icon, href, active }) => (
        <button
          key={label}
          onClick={() => handleClick(href)}
          disabled={!href}
          className={`flex items-center gap-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isOpen ? 'px-9 py-4' : 'py-2.5 justify-center'
          } ${active ? 'bg-bg-accent' : isOpen ? 'bg-bg-light' : ''}`}
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <Icon size={20} color={active ? 'white' : '#828EA6'} strokeWidth={1.5} />
          </div>
          {isOpen && (
            <span
              className={`text-sm font-medium whitespace-nowrap ${active ? 'text-white' : 'text-text-muted'}`}
            >
              {label}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
