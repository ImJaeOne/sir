'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';
import { X } from 'lucide-react';
import 'react-day-picker/style.css';

interface Report {
  id: string;
  type: string;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
}

interface ReportCalendarModalProps {
  reports: Report[];
  currentReportId?: string;
  onSelect: (reportId: string) => void;
  onClose: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; bgActive: string }> = {
  initial: { bg: 'rgba(99, 102, 241, 0.15)', bgActive: 'rgba(99, 102, 241, 0.4)' },
  weekly: { bg: 'rgba(59, 130, 246, 0.15)', bgActive: 'rgba(59, 130, 246, 0.4)' },
};

const TYPE_LABEL: Record<string, string> = {
  initial: '초기 보고서',
  weekly: '주간 보고서',
};

function parseDate(str: string | null): Date | null {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

function formatPeriod(start: string | null, end: string | null) {
  const s = start?.slice(2).replace(/-/g, '.') ?? '';
  const e = end?.slice(2).replace(/-/g, '.') ?? '';
  return `${s} ~ ${e}`;
}

export function ReportCalendarModal({ reports, currentReportId, onSelect, onClose }: ReportCalendarModalProps) {
  // 각 보고서의 기간 내 날짜들을 매핑
  const reportDateMap = useMemo(() => {
    const map = new Map<string, Report>();
    for (const report of reports) {
      const start = parseDate(report.period_start);
      const end = parseDate(report.period_end);
      if (!start || !end) continue;
      const d = new Date(start);
      while (d <= end) {
        map.set(d.toISOString().slice(0, 10), report);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [reports]);

  // 달력에 표시할 modifier + style
  const modifiers = useMemo(() => {
    const result: Record<string, Date[]> = {};
    for (const report of reports) {
      const start = parseDate(report.period_start);
      const end = parseDate(report.period_end);
      if (!start || !end) continue;
      const key = `report-${report.id.slice(0, 8)}`;
      const dates: Date[] = [];
      const d = new Date(start);
      while (d <= end) {
        dates.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }
      result[key] = dates;
    }
    return result;
  }, [reports]);

  const modifiersStyles = useMemo(() => {
    const result: Record<string, React.CSSProperties> = {};
    for (const report of reports) {
      const key = `report-${report.id.slice(0, 8)}`;
      const colors = TYPE_COLORS[report.type] ?? TYPE_COLORS.weekly;
      const isActive = report.id === currentReportId;
      result[key] = {
        backgroundColor: isActive ? colors.bgActive : colors.bg,
        borderRadius: 0,
        cursor: 'pointer',
      };
    }
    return result;
  }, [reports, currentReportId]);

  const handleDayClick = (day: Date) => {
    const key = day.toISOString().slice(0, 10);
    const report = reportDateMap.get(key);
    if (report) onSelect(report.id);
  };

  // 가장 최근 보고서 기간의 월로 기본 표시
  const defaultMonth = reports[0]?.period_end ? parseDate(reports[0].period_end) ?? undefined : undefined;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-dark">지난 보고서</h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* 범례 */}
          <div className="flex gap-4 mb-3">
            {Object.entries(TYPE_LABEL).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type]?.bg.replace('0.15', '0.5') }} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* 달력 */}
          <style>{`
            .report-calendar .rdp-day { position: relative; }
            .report-calendar .rdp-day:hover { opacity: 0.8; }
            .report-calendar .rdp-today { font-weight: bold; }
          `}</style>
          <DayPicker
            className="report-calendar"
            locale={ko}
            defaultMonth={defaultMonth}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            onDayClick={handleDayClick}
            showOutsideDays
          />

          {/* 보고서 목록 */}
          <div className="mt-4 border-t border-border-light pt-3 max-h-40 overflow-y-auto flex flex-col gap-1">
            {reports.map((r) => {
              const isActive = r.id === currentReportId;
              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                    ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-text-dark hover:bg-bg-light'}`}
                >
                  <span className="font-medium">{TYPE_LABEL[r.type] ?? r.type}</span>
                  <span className={`ml-2 text-xs ${isActive ? 'text-blue-400' : 'text-text-muted'}`}>
                    {formatPeriod(r.period_start, r.period_end)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
