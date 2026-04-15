'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import { useReportInfo } from '@/hooks/report/useReportQuery';
import { LoadingOverlay } from '@/components/ui/Loading';

interface ReportHeaderProps {
  workspaceId: string;
  reportId: string;
  showPdfButton?: boolean;
}

export function ReportHeader({ workspaceId, reportId, showPdfButton = true }: ReportHeaderProps) {
  const [downloading, setDownloading] = useState(false);
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: report } = useReportInfo(reportId);

  const handleDownload = async () => {
    if (!showPdfButton) return;
    setDownloading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:8000/api/report/${workspaceId}/${reportId}/pdf`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) throw new Error('PDF 생성 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const shortPeriod = (s: string) => s.replace(/^\d{2}/, '').replace(/-/g, '.');
      const fileName = `${workspace?.company_name ?? 'report'}(${shortPeriod(report?.period_start ?? '')}\u007E${shortPeriod(report?.period_end ?? '')}).pdf`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('PDF 생성에 실패했습니다. 관리자에게 문의하세요.');
    } finally {
      setDownloading(false);
    }
  };

  const periodStart = report?.period_start?.replace(/-/g, '.') ?? '';
  const periodEnd = report?.period_end?.replace(/-/g, '.') ?? '';

  return (
    <div className="flex flex-col gap-2">
      {downloading && <LoadingOverlay title="보고서를 다운로드 중입니다." />}
      <div className="w-full flex justify-between items-center">
        <p className="text-sm lg:text-base text-text-muted font-semibold">SIR Weekly Report</p>
        {showPdfButton && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-base font-bold text-text-muted bg-bg-gray-button hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-[10px] transition-colors cursor-pointer shrink-0"
          >
            {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
        )}
      </div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between bg-bg-dark px-5 py-5 lg:px-10 lg:py-8 rounded-xl gap-3">
        <h1 className="flex lg:flex-row items-baseline gap-2 font-bold">
          <span className="text-white text-xl lg:text-[36px]">{workspace?.company_name ?? ''}</span>
          <span className="text-text-muted text-sm lg:text-[22px]">{workspace?.ticker ?? ''}</span>
        </h1>
        <p className="flex flex-col text-[10px] lg:text-sm">
          <span className="w-12 lg:w-20 text-white font-bold">분석 기간</span>
          <span className="text-text-muted">
            {periodStart} ~ {periodEnd}
          </span>
        </p>
      </div>
    </div>
  );
}
