'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { StrategySections } from '@/components/report/strategy/StrategySections';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';

const CHANNEL_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; bg: string }
> = {
  news: { icon: NewsIcon, label: '뉴스 채널\n대응 전략', bg: 'bg-bg-blue' },
  sns: { icon: BlogIcon, label: 'SNS 채널\n대응 전략', bg: 'bg-bg-pupple-15' },
  community: { icon: CommunityIcon, label: '커뮤니티 채널\n대응 전략', bg: 'bg-bg-green-15' },
};

interface StrategyCardProps {
  category: string;
  label: string;
  strategy: string;
}

export function StrategyCard({ category, strategy }: StrategyCardProps) {
  const config = CHANNEL_CONFIG[category] ?? { icon: NewsIcon, label: category, bg: 'bg-bg-light' };
  const Icon = config.icon;

  return (
    <ReportCard px={30} py={30}>
      <div className="flex items-start gap-8">
        <div className="w-[160px] shrink-0 flex items-center gap-3">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${config.bg}`}>
            <Icon size={24} />
          </div>
          <span className="text-sm font-semibold text-text-muted text-center whitespace-pre-line">
            {config.label}
          </span>
        </div>
        <StrategySections strategy={strategy} />
      </div>
    </ReportCard>
  );
}
