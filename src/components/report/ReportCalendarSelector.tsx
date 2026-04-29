'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useReports } from '@/hooks/workspace/useWorkspaceQuery';
import { createClient } from '@/lib/supabase/client';

const ReportCalendarModal = dynamic(
  () => import('@/components/client/sidebar/ReportCalendarModal').then((m) => m.ReportCalendarModal),
  { ssr: false },
);

interface ReportCalendarSelectorProps {
  /** 빈 문자열 시 모든 워크스페이스 통합 reports 조회 (관리자 /risk-reports 용) */
  workspaceId: string;
  selectedReportId: string;
  onChange: (reportId: string) => void;
  /** 선택된 보고서가 없을 때 표시할 라벨 — default "전체 보고서" */
  placeholder?: string;
  /** 위기 대응 센터 등 prominent 강조가 필요한 곳에서 true. default 는 차분한 톤 */
  accent?: boolean;
}

export function ReportCalendarSelector({
  workspaceId,
  selectedReportId,
  onChange,
  placeholder = '전체 보고서',
  accent = false,
}: ReportCalendarSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const { data: wsReports } = useReports(workspaceId);
  const { data: allReports } = useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const { data } = await createClient()
        .from('reports')
        .select('id, type, status, period_start, period_end')
        .order('period_end', { ascending: false });
      return data ?? [];
    },
    enabled: !workspaceId,
    staleTime: 5 * 60 * 1000,
  });
  const reports = workspaceId ? wsReports : allReports;

  const selectedReport = reports?.find((r) => r.id === selectedReportId);
  const label = selectedReport
    ? `${selectedReport.period_start.replace(/-/g, '.')} ~ ${selectedReport.period_end.replace(/-/g, '.')}`
    : placeholder;

  const handleSelect = (reportId: string) => {
    onChange(reportId);
    setShowCalendar(false);
  };

  return (
    <>
      {accent ? (
        <button
          onClick={() => setShowCalendar(true)}
          className="group flex items-center gap-2 text-sm border-2 border-text-accent/30 rounded-lg px-4 py-2.5 bg-white hover:bg-bg-blue hover:border-text-accent transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
        >
          <CalendarDays size={16} className="text-text-accent" />
          <span
            className={
              selectedReport
                ? 'text-text-dark font-semibold'
                : 'text-text-accent font-semibold'
            }
          >
            {label}
          </span>
          <ChevronDown size={14} className="text-text-accent shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </button>
      ) : (
        <button
          onClick={() => setShowCalendar(true)}
          className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors cursor-pointer w-full sm:w-auto"
        >
          <CalendarDays size={16} className="text-slate-400" />
          <span className={selectedReport ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
            {label}
          </span>
        </button>
      )}
      {showCalendar && reports && (
        <ReportCalendarModal
          reports={reports}
          currentReportId={selectedReportId}
          onSelect={handleSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}
