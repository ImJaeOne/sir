import { cn } from '@/lib/utils';

export function formatChange(
  diff: number,
  unit: string,
  upLabel: string,
  downLabel: string,
  prefix: string,
  invertColor?: boolean
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
  mobileTitle,
  description,
  value,
  change,
}: {
  title: string;
  mobileTitle?: string;
  description: string;
  value: string;
  change?: { label: string; type: 'up' | 'down' | 'neutral' } | null;
}) {
  return (
    <div className="bg-white rounded-xl px-4 py-4 lg:px-5 lg:py-5 flex flex-col items-start shadow-card">
      {mobileTitle && (
        <span className="text-[14px] font-bold text-text-mobile-muted mb-3 whitespace-pre-line min-h-[45px] lg:min-h-[32px] lg:hidden">
          {mobileTitle}
        </span>
      )}
      <span className="text-sm font-bold text-text-muted mb-5 hidden lg:block">{title}</span>
      <div className="flex flex-col mb-3">
        <span className="text-xs font-normal text-text-muted">{description}</span>
        <span className="text-[28px] font-extrabold text-text-dark">{value}</span>
      </div>
      <div
        className={cn(
          'w-full flex justify-center py-1.5 rounded-lg',
          change?.type === 'down'
            ? 'bg-bg-danger'
            : change?.type === 'neutral'
              ? 'bg-bg-light'
              : 'bg-bg-blue'
        )}
      >
        {change && (
          <span
            className={`text-[10px] lg:text-xs font-bold ${change.type === 'up' ? 'text-text-accent' : change.type === 'down' ? 'text-text-danger' : 'text-text-muted'}`}
          >
            {change.label}
          </span>
        )}
      </div>
    </div>
  );
}
