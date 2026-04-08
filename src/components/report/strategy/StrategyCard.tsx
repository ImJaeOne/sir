'use client';

import { ReportCard } from '@/components/report/ReportCard';
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

interface StrategySection {
  title: string;
  content: string;
}

function parseStrategy(strategy: string): StrategySection[] {
  const sections: StrategySection[] = [];
  const parts = strategy.split(/^(#{1,3}\s+.+)$/m);

  let currentTitle = '';
  let currentBody = '';

  for (const part of parts) {
    if (/^#{1,3}\s+/.test(part)) {
      if (currentTitle || currentBody.trim()) {
        sections.push({ title: currentTitle, content: currentBody.trim() });
      }
      currentTitle = part.replace(/^#{1,3}\s+/, '');
      currentBody = '';
    } else {
      currentBody += part;
    }
  }
  if (currentTitle || currentBody.trim()) {
    sections.push({ title: currentTitle, content: currentBody.trim() });
  }

  return sections;
}

function getSectionStyle(title: string): { bg: string; text: string; titleColor: string } {
  const lower = title.toLowerCase();
  if (lower.includes('핵심') || lower.includes('전략 제안') || lower.includes('핵심 전략')) {
    return { bg: 'bg-bg-accent', text: 'text-white', titleColor: 'text-white' };
  }
  return { bg: 'bg-bg-light', text: 'text-text-dark', titleColor: 'text-text-accent' };
}

interface StrategyCardProps {
  category: string;
  label: string;
  strategy: string;
}

export function StrategyCard({ category, strategy }: StrategyCardProps) {
  const config = CHANNEL_CONFIG[category] ?? { icon: NewsIcon, label: category, bg: 'bg-bg-light' };
  const Icon = config.icon;
  const sections = parseStrategy(strategy);

  return (
    <ReportCard px={30} py={30}>
      <div className="flex items-start gap-8">
        {/* 좌측: 아이콘 + 채널명 */}
        <div className="w-[160px] shrink-0 flex items-center gap-3">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${config.bg}`}>
            <Icon size={24} />
          </div>
          <span className="text-sm font-semibold text-text-muted text-center whitespace-pre-line">
            {config.label}
          </span>
        </div>

        {/* 우측: 전략 내용 */}
        <div className="flex-1 flex flex-col gap-3">
          {sections.map((section, i) => {
            const style = getSectionStyle(section.title);
            return (
              <div key={i} className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-text-accent">{section.title}</h4>
                <div className={`rounded-xl px-5 py-4 ${style.bg}`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${style.text}`}>
                    {section.content}
                  </p>
                </div>
              </div>
            );
          })}
          {sections.length === 0 && (
            <div className="rounded-xl px-5 py-4 bg-bg-light">
              <p className="text-sm text-text-dark leading-relaxed whitespace-pre-line">
                {strategy}
              </p>
            </div>
          )}
        </div>
      </div>
    </ReportCard>
  );
}
