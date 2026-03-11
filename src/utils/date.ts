export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y.slice(2)}.${m}.${d}`;
}

export function formatDateRange(range: { start: string; end: string }): string {
  return `${formatDateDisplay(range.start)} ~ ${formatDateDisplay(range.end)}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}
