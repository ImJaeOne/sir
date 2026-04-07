'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge, CountBadge } from '@/components/ui/Badge';
import { NewsIcon } from '@/components/icons/NewsIcon';
import { BlogIcon } from '@/components/icons/BlogIcon';
import { YoutubeIcon } from '@/components/icons/YoutubeIcon';
import { CommunityIcon } from '@/components/icons/CommunityIcon';

const CHANNEL_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number }>; bg: string }> =
  {
    뉴스: { icon: NewsIcon, bg: 'bg-bg-blue' },
    블로그: { icon: BlogIcon, bg: 'bg-bg-pupple-15' },
    유튜브: { icon: YoutubeIcon, bg: 'bg-bg-skyblue-15' },
    커뮤니티: { icon: CommunityIcon, bg: 'bg-bg-green-15' },
  };

const channelDescriptions: Record<string, string> = {
  뉴스: '주요 포털 및 언론사 기사 수집',
  블로그: '주요 포털 블로그 포스팅 수집',
  유튜브: '영상 요약 기반 분석',
  커뮤니티: '네이버 종목토론방, 디시인사이드 게시글 수집',
};

interface ChannelAccordionProps {
  name: string;
  total: number;
  trend: string;
  children: React.ReactNode;
}

export function ChannelAccordion({ name, total, trend, children }: ChannelAccordionProps) {
  const [open, setOpen] = useState(false);
  const isEmpty = total === 0;

  return (
    <div className="border rounded-xl overflow-hidden transition-colors border-slate-100">
      <button
        onClick={() => !isEmpty && setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-4 transition-colors text-left hover:cursor-pointer`}
      >
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-4">
            {CHANNEL_CONFIG[name] &&
              (() => {
                const { icon: Icon, bg } = CHANNEL_CONFIG[name];
                return (
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
                  >
                    <Icon size={20} />
                  </div>
                );
              })()}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-text-dark font-semibold">{name}</span>
              <span className="text-xs text-text-muted">{channelDescriptions[name] ?? ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-4">
            <CountBadge count={total} label="수집" />
            {!isEmpty && <Badge variant={trend.includes('긍정') ? 'blue' : 'red'}>{trend}</Badge>}
          </div>
        </div>
        {!isEmpty &&
          (open ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          ))}
      </button>
      {open && <div className="border-t border-slate-50 pl-[72px] pr-10 py-2">{children}</div>}
    </div>
  );
}
