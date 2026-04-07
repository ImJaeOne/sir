import { ReportCard } from '@/components/report/ReportCard';

export function SirRankingCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <ReportCard className="flex-1 flex items-center justify-between" px={20} py={16}>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-2xl font-bold text-text-dark">{value}</span>
      </div>
      {children}
    </ReportCard>
  );
}
