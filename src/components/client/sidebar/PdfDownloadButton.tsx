'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { LoadingOverlay } from '@/components/ui/Loading';

function useReportMeta(workspaceId?: string, reportId?: string) {
  return useQuery({
    queryKey: ['pdf-meta', workspaceId, reportId],
    queryFn: async () => {
      const supabase = createClient();
      const [{ data: ws }, { data: rp }] = await Promise.all([
        supabase.from('workspaces').select('company_name').eq('id', workspaceId!).maybeSingle(),
        supabase
          .from('reports')
          .select('period_start, period_end')
          .eq('id', reportId!)
          .maybeSingle(),
      ]);
      return {
        companyName: ws?.company_name as string | undefined,
        periodStart: rp?.period_start as string | undefined,
        periodEnd: rp?.period_end as string | undefined,
      };
    },
    enabled: !!workspaceId && !!reportId,
    staleTime: Infinity,
  });
}

export function PdfDownloadButton() {
  const [downloading, setDownloading] = useState(false);
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;
  const reportId = params?.reportId as string | undefined;
  const { data: meta } = useReportMeta(workspaceId, reportId);

  if (!workspaceId || !reportId) return null;

  const handleDownload = async () => {
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
      const shortPeriod = (s?: string) => (s ?? '').replace(/^\d{2}/, '').replace(/-/g, '.');
      a.download = `${meta?.companyName ?? 'report'}(${shortPeriod(meta?.periodStart)}\u007E${shortPeriod(meta?.periodEnd)}).pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('PDF 생성에 실패했습니다. 관리자에게 문의하세요.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {downloading && <LoadingOverlay text="보고서 다운로드 중" />}
      <div className="px-3 w-full">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer justify-center border border-bg-dark px-3 py-2.5 hover:bg-bg-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-text-dark font-semibold text-center">
            {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </span>
        </button>
      </div>
    </>
  );
}
