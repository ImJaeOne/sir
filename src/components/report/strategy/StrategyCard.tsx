'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ReportCard } from '@/components/report/ReportCard';
import { StrategySections } from '@/components/report/strategy/StrategySections';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';
import type { StrategyData } from '@/lib/api/reportApi';

const CHANNEL_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; bg: string }
> = {
  news: { icon: NewsIcon, label: '뉴스', bg: 'bg-bg-blue' },
  sns: { icon: BlogIcon, label: 'SNS', bg: 'bg-bg-pupple-15' },
  community: { icon: CommunityIcon, label: '커뮤니티', bg: 'bg-bg-green-15' },
};

interface StrategyCardProps {
  category: string;
  label: string;
  strategy: StrategyData;
}

export function StrategyCard({ category, strategy }: StrategyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = CHANNEL_CONFIG[category] ?? { icon: NewsIcon, label: category, bg: 'bg-bg-light' };
  const Icon = config.icon;

  return (
    <ReportCard px={20} py={20}>
      {/* 데스크톱 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="hidden lg:flex w-full items-center gap-8 text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-[160px] shrink-0 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg}`}>
            <Icon size={20} />
          </div>
          <span className="text-sm font-semibold text-text-muted text-center whitespace-pre-line">
            {config.label}
          </span>
        </div>
        {!isOpen && (
          <p className="flex-1 text-sm font-semibold text-text-dark">{strategy.proposal.summary}</p>
        )}
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-400 shrink-0 ml-auto" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 shrink-0" />
        )}
      </button>

      {/* 모바일 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="lg:hidden w-full flex flex-col gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
              <Icon size={16} />
            </div>
            <span className="text-base font-semibold text-text-mobile-muted">{config.label}</span>
          </div>
          {isOpen ? (
            <ChevronUp size={16} className="text-slate-400 shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 shrink-0" />
          )}
        </div>
        {!isOpen && (
          <p className="text-sm font-semibold text-text-dark leading-relaxed">
            {strategy.proposal.summary}
          </p>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 lg:mt-6 lg:pl-[192px]">
          <StrategySections strategy={strategy} />
        </div>
      )}
    </ReportCard>
  );
}
