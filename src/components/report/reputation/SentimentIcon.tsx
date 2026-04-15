import { LikeIcon } from '@/components/icons/LikeIcon';
import { DislikeIcon } from '@/components/icons/DislikeIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';

const SENTIMENT_CONFIG: Record<
  string,
  { Icon: React.ComponentType<{ size?: number; color?: string }>; bg: string; color: string }
> = {
  positive: { Icon: LikeIcon, bg: 'bg-bg-blue', color: 'var(--color-text-accent)' },
  neutral: { Icon: NeutralIcon, bg: 'bg-bg-light', color: 'var(--color-text-muted)' },
  negative: { Icon: DislikeIcon, bg: 'bg-bg-danger', color: 'var(--color-text-danger)' },
};

const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  positive: { label: '긍정', className: 'bg-blue-50 text-text-accent' },
  neutral: { label: '중립', className: 'bg-slate-100 text-text-muted' },
  negative: { label: '부정', className: 'bg-red-50 text-text-danger' },
};

export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = BADGE_CONFIG[sentiment] ?? BADGE_CONFIG.neutral;
  return (
    <span
      className={`text-[8px] lg:text-[10px] font-semibold  px-2 py-0.5 lg:px-1.5 lg:py-0.5 rounded-sm lg:rounded ${config.className} shrink-0`}
    >
      {config.label}
    </span>
  );
}

export function SentimentIcon({ sentiment, size = 30 }: { sentiment: string; size?: number }) {
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const iconSize = Math.round(size * 0.4);

  return (
    <div
      className={`rounded-md flex items-center justify-center shrink-0 ${config.bg}`}
      style={{ width: size, height: size }}
    >
      <config.Icon size={iconSize} color={config.color} />
    </div>
  );
}
