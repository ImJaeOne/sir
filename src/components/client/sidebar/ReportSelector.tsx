'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const ReportCalendarModal = dynamic(
  () =>
    import('@/components/client/sidebar/ReportCalendarModal').then((m) => m.ReportCalendarModal),
  { ssr: false }
);

function useReportList(workspaceId?: string, enabled = false) {
  return useQuery({
    queryKey: ['reports', workspaceId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('reports')
        .select('id, type, status, period_start, period_end')
        .eq('workspace_id', workspaceId!)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!workspaceId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function ReportSelector() {
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.workspaceId as string | undefined;
  const reportId = params?.reportId as string | undefined;

  const { data: reports } = useReportList(workspaceId, showModal);

  const handleSelect = (id: string) => {
    setShowModal(false);
    router.push(`/report/${workspaceId}/${id}`);
  };

  if (!workspaceId) return null;

  return (
    <>
      <div className="px-3 py-2">
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer justify-center border border-bg-dark px-3 py-2.5 hover:bg-bg-light"
        >
          <span className="text-text-dark font-semibold text-center">지난 보고서</span>
        </button>
      </div>

      {showModal && reports && (
        <ReportCalendarModal
          reports={reports}
          currentReportId={reportId}
          onSelect={handleSelect}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
