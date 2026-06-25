'use client';

import { useMemo, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { ReportSelector } from '@/components/client/sidebar/ReportSelector';
import { PdfDownloadButton } from '@/components/client/sidebar/PdfDownloadButton';
import { ServiceUpgradeButton } from '@/components/client/sidebar/ServiceUpgradeButton';
import { SidebarLogo } from '@/components/client/sidebar/SidebarLogo';
import { SidebarMainNav } from '@/components/client/sidebar/SidebarMainNav';
import { SidebarUserInfo } from '@/components/client/sidebar/SidebarUserInfo';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';
import { useLastReportStore } from '@/store/lastReport';
import type { AuthUser } from '@/types/auth';

interface ClientSidebarProps {
  user?: AuthUser | null;
}

export function ClientSidebar({ user = null }: ClientSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const params = useParams();
  const pathname = usePathname() ?? '';
  const workspaceId = (params?.workspaceId as string | undefined) ?? '';
  const { data: reports } = useReports(workspaceId);
  const lastReportId = useLastReportStore((s) => s.lastReportByWorkspace[workspaceId]);
  const onReportPath = pathname.startsWith('/report/');

  // 보고서 이동 URL — 현재 URL reportId 유지 → 마지막으로 본 보고서(존재 검증) → 최신 보고서
  const reportHref = useMemo(() => {
    if (!workspaceId) return '';
    const currentReportId = params?.reportId as string | undefined;
    const savedId =
      lastReportId && reports?.some((r) => r.id === lastReportId) ? lastReportId : undefined;
    const targetId = currentReportId ?? savedId ?? reports?.[0]?.id;
    return targetId ? `/report/${workspaceId}/${targetId}` : '';
  }, [workspaceId, params?.reportId, reports, lastReportId]);

  return (
    <aside
      className={`${isOpen ? 'w-60 px-2' : 'w-14'} border-r border-border-light bg-bg-white flex flex-col shrink-0 transition-all duration-300`}
    >
      <SidebarLogo
        isOpen={isOpen}
        reportHref={reportHref}
        onToggle={() => setIsOpen((v) => !v)}
      />
      <SidebarMainNav isOpen={isOpen} workspaceId={workspaceId} reportHref={reportHref} />
      {isOpen && (
        <div className="flex flex-col gap-2 w-full items-center mb-6">
          {/* PDF 다운로드 / 지난 보고서 — 보고서 메뉴에서만 노출 */}
          {onReportPath && <PdfDownloadButton />}
          {onReportPath && <ReportSelector />}
          <ServiceUpgradeButton />
          <div className="flex flex-col text-text-dark text-[10px] items-center font-light">
            <p>SIR 서비스에 사용된 데이터는 최근 3년까지만</p>
            <p>보관되며 순차적으로 삭제됩니다.</p>
          </div>
        </div>
      )}
      <SidebarUserInfo isOpen={isOpen} user={user} />
    </aside>
  );
}
