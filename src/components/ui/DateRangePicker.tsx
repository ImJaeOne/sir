'use client';

import { useState, useRef, useEffect } from 'react';
import {
  toDateStr,
  addDays,
  formatDateDisplay,
  getDaysInMonth,
  getFirstDayOfWeek,
} from '@/utils/date';

interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: '1일', days: 1 },
  { label: '3일', days: 3 },
  { label: '1주', days: 7 },
  { label: '1개월', days: 30 },
  { label: '3개월', days: 90 },
  { label: '6개월', days: 180 },
  { label: '1년', days: 365 },
];

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [tempStart, setTempStart] = useState(value.start);
  const [tempEnd, setTempEnd] = useState(value.end);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(value.end);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelecting(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = toDateStr(new Date());

  const handlePreset = (days: number) => {
    const end = today;
    const start = addDays(today, -(days - 1));
    setTempStart(start);
    setTempEnd(end);
    onChange({ start, end });
    setSelecting(null);
    setOpen(false);
  };

  const handleDayClick = (dateStr: string) => {
    if (!selecting || selecting === 'start') {
      setTempStart(dateStr);
      setTempEnd('');
      setSelecting('end');
    } else {
      let start = tempStart;
      let end = dateStr;
      if (start > end) {
        [start, end] = [end, start];
      }
      setTempStart(start);
      setTempEnd(end);
      onChange({ start, end });
      setSelecting(null);
      setOpen(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setSelecting('start');
    setTempStart(value.start);
    setTempEnd(value.end);
    const d = new Date(value.end);
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
  };

  const prevMonth = () => {
    setViewDate((v) => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { ...v, month: v.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate((v) => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { ...v, month: v.month + 1 };
    });
  };

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfWeek(viewDate.year, viewDate.month);

  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    calendarDays.push(`${viewDate.year}-${m}-${dd}`);
  }

  const isInRange = (dateStr: string) => {
    if (!tempStart || !tempEnd) return false;
    return dateStr >= tempStart && dateStr <= tempEnd;
  };

  const isStart = (dateStr: string) => dateStr === tempStart;
  const isEnd = (dateStr: string) => dateStr === tempEnd;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-auto flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none hover:border-blue-400 transition-colors cursor-pointer text-left bg-white"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400 shrink-0"
        >
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <path d="M2 6.5h12" />
          <path d="M5.5 1.5v3" />
          <path d="M10.5 1.5v3" />
        </svg>
        <span className="text-slate-700">
          {formatDateDisplay(value.start)} ~ {formatDateDisplay(value.end)}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-[320px] sm:w-[360px]">
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                onClick={() => handlePreset(p.days)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Guide text */}
          <p className="text-xs text-slate-400 mb-3">
            {selecting === 'start' && '시작 날짜를 선택하세요'}
            {selecting === 'end' && '종료 날짜를 선택하세요'}
          </p>

          {/* Calendar nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M10 4l-4 4 4 4" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {viewDate.year}년 {viewDate.month + 1}월
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((label) => (
              <div key={label} className="text-center text-xs font-medium text-slate-400 py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) {
                return <div key={`empty-${i}`} className="h-9" />;
              }

              const inRange = isInRange(dateStr);
              const start = isStart(dateStr);
              const end = isEnd(dateStr);
              const isToday = dateStr === today;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-9 text-sm font-medium transition-colors cursor-pointer relative flex items-center justify-center
                    ${inRange && !start && !end ? 'bg-blue-50 text-blue-700' : ''}
                    ${start || end ? 'bg-blue-600 text-white rounded-lg z-10' : ''}
                    ${!inRange && !start && !end ? 'text-slate-700 hover:bg-slate-100 rounded-lg' : ''}
                    ${isToday && !start && !end ? 'ring-1 ring-blue-300 rounded-lg' : ''}
                  `}
                >
                  {parseInt(dateStr.split('-')[2])}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
