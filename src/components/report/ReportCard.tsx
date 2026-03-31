'use client';

interface ReportCardProps {
  title: string;
  description?: string;
  emphasis?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function ReportCard({ title, description, emphasis, children, headerRight }: ReportCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_0_0_1px_rgba(241,245,249,1),0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>
          {description && <p className="text-xs text-slate-400 pl-1">{description}</p>}
          {emphasis && <p className="text-xs text-red-400 pl-1 mt-1">{emphasis}</p>}
        </div>
        {headerRight && <div className="shrink-0 ml-4">{headerRight}</div>}
      </div>
      {children}
    </div>
  );
}
