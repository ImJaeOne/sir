'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ChannelDonutChart } from '@/components/chart/ChannelDonutChart';
import { MobileChannelDonutChart } from '@/components/chart/MobileChannelDonutChart';
import { ChannelCard } from '@/components/report/reputation/ChannelCard';
import type { ChannelStat } from '@/lib/api/reportApi';

interface ChannelVolumePanelProps {
  channelStats: ChannelStat[];
  pdfMode: boolean;
}

export function ChannelVolumePanel({ channelStats, pdfMode }: ChannelVolumePanelProps) {
  const total = channelStats.reduce((s, c) => s + c.value, 0);

  return (
    <ReportSubSection
      title="채널별 데이터 수집량 비중"
      description="전체 수집 데이터 중 어떤 채널이 큰 비중을 차지하는지 파악할 수 있습니다."
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <ReportCard className="lg:flex-1" px={20} py={20}>
          {total === 0 ? (
            <div className="h-48 lg:h-60 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-sm font-semibold text-text-muted">이번 기간 수집된 데이터가 없습니다.</span>
              <span className="text-xs text-text-muted">채널별 비중을 계산할 데이터가 없습니다.</span>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <ChannelDonutChart channelStats={channelStats} total={total} pdfMode={pdfMode} />
              </div>
              <div className="lg:hidden">
                <MobileChannelDonutChart channelStats={channelStats} total={total} />
              </div>
            </>
          )}
        </ReportCard>

        <div className="grid grid-cols-2 gap-3 lg:flex-1">
          {channelStats.map((ch) => (
            <ChannelCard
              key={ch.id}
              id={ch.id}
              label={ch.label}
              value={ch.value}
              ratio={total > 0 ? ((ch.value / total) * 100).toFixed(1) : '0'}
            />
          ))}
        </div>
      </div>
    </ReportSubSection>
  );
}
