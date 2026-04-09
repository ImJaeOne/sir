'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { SentimentStackedBar } from '@/components/chart/SentimentStackedBar';
import { SentimentSummaryCard } from '@/components/report/reputation/SentimentSummaryCard';
import { LikeIcon } from '@/components/icons/LikeIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';
import { DislikeIcon } from '@/components/icons/DislikeIcon';
import type { ChannelStat } from '@/lib/api/reportApi';

interface SentimentPanelProps {
  channelStats: ChannelStat[];
  pdfMode: boolean;
}

export function SentimentPanel({ channelStats, pdfMode }: SentimentPanelProps) {
  const sentimentData = channelStats.map((ch) => {
    const total = ch.positive + ch.neutral + ch.negative;
    return {
      channel: ch.label,
      긍정: total > 0 ? Math.round((ch.positive / total) * 100) : 0,
      중립: total > 0 ? Math.round((ch.neutral / total) * 100) : 0,
      부정: total > 0 ? Math.round((ch.negative / total) * 100) : 0,
      rawPositive: ch.positive,
      rawNeutral: ch.neutral,
      rawNegative: ch.negative,
    };
  });

  const totalPositive = channelStats.reduce((s, c) => s + c.positive, 0);
  const totalNeutral = channelStats.reduce((s, c) => s + c.neutral, 0);
  const totalNegative = channelStats.reduce((s, c) => s + c.negative, 0);

  const CARD_ITEMS = [
    {
      label: '긍정적 평판',
      count: totalPositive,
      icon: <LikeIcon size={18} color="var(--color-text-accent)" />,
      className: 'text-text-accent',
      bgClass: 'bg-bg-blue',
    },
    {
      label: '중립적 평판',
      count: totalNeutral,
      icon: <NeutralIcon size={18} color="var(--color-text-muted)" />,
      className: 'text-text-muted',
      bgClass: 'bg-bg-light',
    },
    {
      label: '부정적 평판',
      count: totalNegative,
      icon: <DislikeIcon size={18} color="var(--color-text-danger)" />,
      className: 'text-text-danger',
      bgClass: 'bg-bg-danger',
    },
  ];

  return (
    <ReportSubSection
      title="채널별 긍정·중립·부정 여론 비중"
      description="채널별 감정 분포를 100% 누적 막대로 비교하여 여론 구조를 직관적으로 보여줍니다."
    >
      <div className="flex gap-4">
        <div className="shrink-0 w-[270px] flex flex-col gap-3">
          {CARD_ITEMS.map((card) => (
            <SentimentSummaryCard key={card.label} {...card} />
          ))}
        </div>
        <ReportCard className="flex-1" px={20} py={20}>
          <SentimentStackedBar data={sentimentData} pdfMode={pdfMode} />
        </ReportCard>
      </div>
    </ReportSubSection>
  );
}
