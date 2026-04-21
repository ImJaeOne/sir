'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { AdminButton } from '@/components/ui/AdminButton';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | undefined>(value);
  const [month, setMonth] = useState<Date>(value ?? new Date());

  const handleOpen = () => {
    if (disabled) return;
    setPendingDate(value);
    setMonth(value ?? new Date());
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange(pendingDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const goToPrevMonth = () => {
    setMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };
  const goToNextMonth = () => {
    setMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none text-left bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {value ? (
          <span className="text-slate-800">{format(value, 'yyyy-MM-dd')}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      <Modal
        open={open}
        onClose={handleCancel}
        title="날짜 선택"
        size="md"
        footer={
          <div className="flex gap-2 w-full">
            <AdminButton variant="secondary" onClick={handleCancel} fullWidth>
              취소
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleConfirm}
              disabled={!pendingDate}
              fullWidth
            >
              확인
            </AdminButton>
          </div>
        }
      >
        <style>{`
          .sir-datepicker .rdp-nav { display: none; }
          .sir-datepicker .rdp-month_caption { display: none; }
          .sir-datepicker .rdp-months { display: flex; justify-content: center; }
          .sir-datepicker .rdp-weekday {
            font-weight: 300;
            font-size: 11px;
            color: var(--color-text-muted, #828EA6);
          }
          .sir-datepicker .rdp-day {
            font-weight: 400;
            font-size: 13px;
            color: var(--color-text-dark, #1E293B);
            height: 36px;
            width: 36px;
          }
          .sir-datepicker .rdp-day_button {
            border-radius: 9999px;
            height: 32px;
            width: 32px;
          }
          .sir-datepicker .rdp-outside {
            color: var(--color-text-muted, #828EA6) !important;
            opacity: 0.6 !important;
          }
          .sir-datepicker .rdp-selected .rdp-day_button {
            background-color: var(--color-bg-accent, #362CFF);
            color: white;
            font-weight: 600;
          }
        `}</style>

        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center justify-between w-full max-w-[280px]">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="text-text-muted hover:text-text-dark transition-colors cursor-pointer p-1"
              aria-label="이전 달"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-text-dark">{monthLabel}</span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="text-text-muted hover:text-text-dark transition-colors cursor-pointer p-1"
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <DayPicker
            className="sir-datepicker"
            mode="single"
            selected={pendingDate}
            onSelect={(d) => setPendingDate(d)}
            locale={ko}
            weekStartsOn={1}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays
          />
        </div>
      </Modal>
    </>
  );
}
