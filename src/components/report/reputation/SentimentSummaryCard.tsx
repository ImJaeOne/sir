import { ReportCard } from '@/components/report/ReportCard';

export function SentimentSummaryCard({
  label,
  count,
  icon,
  className,
  bgClass,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  className: string;
  bgClass?: string;
}) {
  return (
    <ReportCard className="flex-1 p-4 lg:p-[30px]">
      <div className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center lg:items-start gap-1 lg:gap-2">
          <span className={`text-xs font-semibold ${className}`}>{label}</span>
          <span className="text-lg lg:text-2xl font-bold">{count.toLocaleString()}개</span>
        </div>
        <div
          className={`w-8 h-8 hidden lg:w-10 lg:h-10 rounded-lg lg:flex items-center justify-center ${bgClass ?? 'bg-bg-light'}`}
        >
          {icon}
        </div>
      </div>
    </ReportCard>
  );
}
