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
