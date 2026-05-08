'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ReportCalendarModal = dynamic(
  () =>
    import('@/components/client/sidebar/ReportCalendarModal').then((m) => m.ReportCalendarModal),
  { ssr: false }
);

function useReportList(workspaceId?: string, enabled = false) {
  return useQuery({
    queryKey: ['reports', 'published', workspaceId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('reports')
        .select('id, type, status, period_start, period_end')
        .eq('workspace_id', workspaceId!)
        .eq('status', 'published')
        .order('period_end', { ascending: false });
      return data ?? [];
    },
    enabled: !!workspaceId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

interface ReportSelectorProps {
  /** 'sidebar' (기본) — 사이드바용 가로 버튼 / 'icon' — 모바일 헤더용 아이콘 버튼 */
  variant?: 'sidebar' | 'icon';
}

export function ReportSelector({ variant = 'sidebar' }: ReportSelectorProps = {}) {
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
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-light transition-colors cursor-pointer"
          aria-label="지난 보고서 보기"
        >
          <CalendarDays size={18} />
        </button>
      ) : (
        <div className="px-3 w-full">
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer justify-center border border-bg-dark px-3 py-2.5 hover:bg-bg-light"
          >
            <span className="text-text-dark font-semibold text-center">지난 보고서 보기</span>
          </button>
        </div>
      )}

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
