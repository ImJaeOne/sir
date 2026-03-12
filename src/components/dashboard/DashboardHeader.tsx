'use client';

import { useSearchParams } from 'next/navigation';
import { formatDateDisplay } from '@/utils/date';

export function DashboardHeader() {
  const searchParams = useSearchParams();
  const company = searchParams?.get('company') ?? '';
  const keywords = (searchParams?.get('keywords') ?? '').split(',').filter(Boolean);
  const startDate = searchParams?.get('startDate') ?? '';
  const endDate = searchParams?.get('endDate') ?? '';

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {company && (
            <span className="text-sm font-semibold text-slate-800">{company}</span>
          )}
          {keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          {startDate && endDate && (
            <span className="text-xs text-slate-400">
              {formatDateDisplay(startDate)} ~ {formatDateDisplay(endDate)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
