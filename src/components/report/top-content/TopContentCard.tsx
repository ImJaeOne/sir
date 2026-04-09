'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { YoutubeIcon } from '@/components/icons/YoutubeIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';

const CHANNEL_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  news: NewsIcon,
  blog: BlogIcon,
  youtube: YoutubeIcon,
  community: CommunityIcon,
};

interface TopContentCardProps {
  channelId: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function TopContentCard({ channelId, title, description, children }: TopContentCardProps) {
  const Icon = CHANNEL_ICONS[channelId];

  return (
    <ReportCard className="flex flex-col gap-2 p-4">
      <div className="bg-bg-accent rounded-xl px-10 py-8 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-xs font-light text-white">{description}</span>
        </div>
        {Icon && <Icon size={28} color="white" />}
      </div>
      {children}
    </ReportCard>
  );
}
