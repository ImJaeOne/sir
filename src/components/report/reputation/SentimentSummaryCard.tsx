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
    <ReportCard px={30} py={30} className="flex-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className={`text-xs font-semibold ${className}`}>{label}</span>
          <span className="text-2xl font-bold">{count.toLocaleString()}개</span>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass ?? 'bg-bg-light'}`}
        >
          {icon}
        </div>
      </div>
    </ReportCard>
  );
}
