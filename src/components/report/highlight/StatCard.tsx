import { cn } from '@/lib/utils';

export function formatChange(
  diff: number,
  unit: string,
  upLabel: string,
  downLabel: string,
  prefix: string,
  invertColor?: boolean,
): { label: string; type: 'up' | 'down' | 'neutral' } {
  if (diff === 0) return { label: `${prefix}유지`, type: 'neutral' };
  const isUp = diff > 0;
  const arrow = isUp ? '▲' : '▼';
  const colorType = invertColor ? (isUp ? 'down' : 'up') : isUp ? 'up' : 'down';
  return {
    label: `${prefix}${arrow} ${Math.abs(diff)}${unit} ${isUp ? upLabel : downLabel}`,
    type: colorType,
  };
}

export function StatCard({
  title,
  description,
  value,
  change,
}: {
  title: string;
  description: string;
  value: string;
  change?: { label: string; type: 'up' | 'down' | 'neutral' } | null;
}) {
  return (
    <div className="bg-white rounded-xl px-5 py-5 flex flex-1 flex-col items-start shadow-card">
      <span className="text-sm font-bold text-text-muted mb-5">{title}</span>
      <div className="flex flex-col mb-3">
        <span className="text-xs font-normal text-text-muted">{description}</span>
        <span className="text-[28px] font-extrabold text-text-dark">{value}</span>
      </div>
      <div
        className={cn(
          'w-full flex justify-center py-1.5 rounded-lg',
          change?.type === 'down' ? 'bg-bg-danger' : 'bg-bg-blue',
        )}
      >
        {change && (
          <span
            className={`text-xs font-bold ${change.type === 'up' ? 'text-text-accent' : change.type === 'down' ? 'text-text-danger' : 'text-text-muted'}`}
          >
            {change.label}
          </span>
        )}
      </div>
    </div>
  );
}
