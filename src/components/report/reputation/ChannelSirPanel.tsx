'use client';

import { ReportSubSection } from '@/components/report/ReportSection';
import { SirCard } from '@/components/report/reputation/SirCard';
import type { ChannelStat } from '@/lib/api/reportApi';

interface ChannelSirPanelProps {
  channelStats: ChannelStat[];
  isInitial: boolean;
  prevIsInitial: boolean;
  isDaily?: boolean;
  prevChannelSirMap: Record<string, number>;
}

export function ChannelSirPanel({ channelStats, isInitial, prevIsInitial, isDaily = false, prevChannelSirMap }: ChannelSirPanelProps) {
  return (
    <ReportSubSection
      title="채널별 평판 지수"
      description="1,000점 만점을 기준으로 각 채널 별 긍정·부정 여론 강도를 확인할 수 있습니다."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {channelStats.map((ch) => (
          <SirCard key={ch.id} stat={ch} isInitial={isInitial} prevIsInitial={prevIsInitial} isDaily={isDaily} prevSir={prevChannelSirMap[ch.id]} />
        ))}
      </div>
    </ReportSubSection>
  );
}
