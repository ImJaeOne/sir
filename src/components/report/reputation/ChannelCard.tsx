import { ReportCard } from '@/components/report/ReportCard';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { YoutubeIcon } from '@/components/icons/YoutubeIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';
import { cn } from '@/lib/utils';

const CHANNEL_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  news: NewsIcon,
  blog: BlogIcon,
  youtube: YoutubeIcon,
  community: CommunityIcon,
};

interface ChannelCardProps {
  id: string;
  label: string;
  value: number;
  ratio: string;
  onClick?: () => void;
}

export function ChannelCard({ id, label, value, ratio, onClick }: ChannelCardProps) {
  const Icon = CHANNEL_ICONS[id];
  const interactive = !!onClick && value > 0;
  const content = (
    <div className="flex flex-col items-start justify-between h-full">
      <div className="flex gap-2 items-center mb-4 lg:mb-0">
        {Icon && <Icon size={20} />}
        <span
          className={cn(
            'text-sm font-semibold transition-transform duration-150 origin-left',
            value > 0 ? 'text-text-muted' : 'text-text-muted/60',
            interactive && 'group-hover:scale-105',
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-col w-full gap-1">
        <span className="text-xs text-text-muted text-right font-light">비중 {ratio}%</span>
        <span
          className={cn(
            'text-2xl font-bold text-right tabular-nums',
            value > 0 ? 'text-text-dark' : 'text-text-muted/60',
          )}
        >
          {value.toLocaleString()}건
        </span>
      </div>
    </div>
  );

  return (
    <ReportCard
      px={20}
      py={20}
      className={cn(
        'transition-transform duration-150',
        interactive && 'hover:-translate-y-0.5 hover:shadow-lg',
      )}
    >
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label} 수집 데이터 보기`}
          className="group block h-full w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded-lg"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </ReportCard>
  );
}
