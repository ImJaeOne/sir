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
      title="데이터 수집 채널별 SIR 감정 지수"
      description="각 채널에서 수집된 콘텐츠의 감정 분석 결과를 SIR 점수로 확인합니다."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {channelStats.map((ch) => (
          <SirCard key={ch.id} stat={ch} isInitial={isInitial} prevIsInitial={prevIsInitial} isDaily={isDaily} prevSir={prevChannelSirMap[ch.id]} />
        ))}
      </div>
    </ReportSubSection>
  );
}
