import { ReportCard } from '@/components/report/ReportCard';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { YoutubeIcon } from '@/components/icons/YoutubeIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';

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
}

export function ChannelCard({ id, label, value, ratio }: ChannelCardProps) {
  const Icon = CHANNEL_ICONS[id];

  return (
    <ReportCard px={20} py={20}>
      <div className="flex flex-col items-start justify-between h-full">
        <div className="flex gap-2 items-center">
          {Icon && <Icon size={20} />}
          <span className="text-sm text-text-muted font-semibold">{label}</span>
        </div>
        <div className="flex flex-col w-full gap-1">
          <span className="text-xs text-text-muted text-right font-light">비중 {ratio}%</span>
          <span className="text-2xl font-bold text-text-dark text-right">
            {value.toLocaleString()}건
          </span>
        </div>
      </div>
    </ReportCard>
  );
}
