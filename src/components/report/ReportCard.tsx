'use client';

import { useState } from 'react';

interface ReportCardProps {
  title?: string;
  description?: string;
  emphasis?: string;
  tooltip?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  px?: number;
  py?: number;
}

export function ReportCard({
  title,
  description,
  emphasis,
  tooltip,
  children,
  headerRight,
  px,
  py,
}: ReportCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card" style={{ padding: `${py}px ${px}px` }}>
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {tooltip && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center hover:bg-slate-300 transition-colors"
              >
                ?
              </button>
              {showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2.5 bg-slate-800 text-white text-xs leading-relaxed rounded-lg shadow-lg z-50 whitespace-pre-line">
                  {tooltip}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800" />
                </div>
              )}
            </div>
          )}
        </div>
        {description && <p className="text-xs text-slate-400 pl-1">{description}</p>}
        {emphasis && <p className="text-xs text-red-400 pl-1 mt-1">{emphasis}</p>}
      </div>
      {headerRight && <div className="shrink-0 ml-4">{headerRight}</div>}
      {children}
    </div>
  );
}
