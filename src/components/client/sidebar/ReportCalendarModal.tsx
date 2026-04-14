'use client';

import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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

function parseDate(str: string | null): Date | null {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const d = new Date(start);
  while (d <= end) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function ReportCalendarModal({
  reports,
  currentReportId,
  onSelect,
  onClose,
}: ReportCalendarModalProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(currentReportId);
  const [month, setMonth] = useState<Date | undefined>(() => {
    const current = reports.find((r) => r.id === currentReportId);
    return current?.period_end ? (parseDate(current.period_end) ?? undefined) : undefined;
  });

  // 날짜 → 보고서 매핑
  const reportDateMap = useMemo(() => {
    const map = new Map<string, Report>();
    for (const report of reports) {
      const start = parseDate(report.period_start);
      const end = parseDate(report.period_end);
      if (!start || !end) continue;
      for (const date of getDatesInRange(start, end)) {
        map.set(date.toISOString().slice(0, 10), report);
      }
    }
    return map;
  }, [reports]);

  // 현재 보고 있는 보고서 기간 (currentReportId 없으면 전체 보고서 기간 표시)
  const {
    dates: currentDates,
    starts: currentStarts,
    ends: currentEnds,
  } = useMemo(() => {
    if (currentReportId) {
      const target = reports.find((r) => r.id === currentReportId);
      if (!target) return { dates: [], starts: [], ends: [] };
      const s = parseDate(target.period_start);
      const e = parseDate(target.period_end);
      if (!s || !e) return { dates: [], starts: [], ends: [] };
      return { dates: getDatesInRange(s, e), starts: [s], ends: [e] };
    }
    // 전체: 모든 보고서 기간 표시
    const allDates: Date[] = [];
    const allStarts: Date[] = [];
    const allEnds: Date[] = [];
    for (const r of reports) {
      const s = parseDate(r.period_start);
      const e = parseDate(r.period_end);
      if (!s || !e) continue;
      allDates.push(...getDatesInRange(s, e));
      allStarts.push(s);
      allEnds.push(e);
    }
    return { dates: allDates, starts: allStarts, ends: allEnds };
  }, [reports, currentReportId]);

  // 선택된 보고서 기간 (현재 보고서와 다른 것)
  const {
    dates: selectedDates,
    start: selectedStart,
    end: selectedEnd,
  } = useMemo(() => {
    if (!selectedReportId || selectedReportId === currentReportId)
      return { dates: [], start: null, end: null };
    const target = reports.find((r) => r.id === selectedReportId);
    if (!target) return { dates: [], start: null, end: null };
    const s = parseDate(target.period_start);
    const e = parseDate(target.period_end);
    if (!s || !e) return { dates: [], start: null, end: null };
    return { dates: getDatesInRange(s, e), start: s, end: e };
  }, [reports, selectedReportId, currentReportId]);

  // 최신 보고서의 period_end 이후는 비활성화
  const latestEnd = useMemo(() => {
    const dates = reports.map((r) => parseDate(r.period_end)).filter((d): d is Date => d !== null);
    if (dates.length === 0) return undefined;
    return dates.reduce((max, d) => (d > max ? d : max));
  }, [reports]);

  const handleDayClick = (day: Date) => {
    const key = day.toISOString().slice(0, 10);
    const report = reportDateMap.get(key);
    if (report) setSelectedReportId(report.id);
  };

  const handleApply = () => {
    if (!selectedReportId || selectedReportId === currentReportId) return;
    onSelect(selectedReportId);
  };

  const isChanged = selectedReportId && selectedReportId !== currentReportId;

  // 월 네비게이션 핸들러
  const goToPrevMonth = () => {
    setMonth((prev) => {
      const d = prev ? new Date(prev) : new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const goToNextMonth = () => {
    setMonth((prev) => {
      const d = prev ? new Date(prev) : new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const monthLabel = month ? `${month.getFullYear()}년 ${month.getMonth() + 1}월` : '';

  return (
    <Modal
      open
      onClose={onClose}
      title="지난 보고서"
      size="md"
      footer={
        <Button onClick={handleApply} disabled={!isChanged} fullWidth>
          적용하기
        </Button>
      }
    >
      <div className="flex flex-col gap-4 items-center">
        {/* 달력 */}
        <style>{`
          .report-calendar .rdp-nav { display: none; }
          .report-calendar .rdp-month_caption { display: none; }
          .report-calendar .rdp-months { display: flex; justify-content: center; }
          .report-calendar .rdp-weekday {
            font-weight: 300;
            color: var(--color-text-muted, #828EA6);
          }
          .report-calendar .rdp-day {
            font-weight: 400;
            font-size: 12px;
            color: var(--color-text-dark, #1E293B);
            height: 30px;
          }
          .report-calendar .rdp-outside {
            color: var(--color-text-dark, #1E293B) !important;
            opacity: 1 !important;
          }
          .report-calendar .rdp-disabled {
            color: var(--color-text-muted, #828EA6) !important;
          }
          .report-calendar .rdp-today {
            position: relative;
          }
          .report-calendar .rdp-today::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: 8px;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 9999px;
            background-color: var(--color-bg-accent, #362CFF);
          }
          .report-calendar .day-current,
          .report-calendar .day-selected {
            position: relative;
            isolation: isolate;
          }
          .report-calendar .day-current::before,
          .report-calendar .day-selected::before {
            content: '';
            position: absolute;
            inset: 15% 0;
            z-index: -1;
            border-radius: 0;
          }
          .report-calendar .day-current::before {
            background-color: var(--color-bg-blue, #E8F1FF);
          }
          .report-calendar .day-selected::before {
            background-color: var(--color-bg-pupple-calendar, #9747ff26);
          }
          .report-calendar .day-range-start::before {
            border-radius: 9999px 0 0 9999px;
          }
          .report-calendar .day-range-end::before {
            border-radius: 0 9999px 9999px 0;
          }
          .report-calendar .day-range-start.day-range-end::before {
            border-radius: 8px;
          }
        `}</style>
        <div className="inline-flex flex-col gap-2">
          {/* 월 네비게이션 — 달력과 동일 너비 */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="text-text-muted hover:text-text-dark transition-colors cursor-pointer p-1"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-dark">{monthLabel}</span>
            <button
              onClick={goToNextMonth}
              className="text-text-muted hover:text-text-dark transition-colors cursor-pointer p-1"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <DayPicker
            className="report-calendar"
            locale={ko}
            weekStartsOn={1}
            month={month}
            onMonthChange={setMonth}
            disabled={latestEnd ? { after: latestEnd } : undefined}
            modifiers={{
              current: currentDates,
              currentStart: currentStarts,
              currentEnd: currentEnds,
              selected: selectedDates,
              selectedStart: selectedStart ? [selectedStart] : [],
              selectedEnd: selectedEnd ? [selectedEnd] : [],
            }}
            modifiersClassNames={{
              current: 'day-current',
              currentStart: 'day-range-start',
              currentEnd: 'day-range-end',
              selected: 'day-selected',
              selectedStart: 'day-range-start',
              selectedEnd: 'day-range-end',
            }}
            onDayClick={handleDayClick}
            showOutsideDays
          />
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bg-accent" />
            <span className="text-xs text-text-muted">오늘</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bg-blue" />
            <span className="text-xs text-text-muted">현재 보고서</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bg-pupple-calendar" />
            <span className="text-xs text-text-muted">선택된 보고서</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
