'use client';

import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartLegend } from '@/components/ui/ChartLegend';
import type { ChannelStat } from '@/lib/api/reportApi';

const CHANNEL_COLORS: Record<string, string> = {
  news: 'var(--color-bg-accent)',
  blog: 'var(--color-bg-pupple)',
  youtube: 'var(--color-bg-youtube)',
  community: 'var(--color-bg-green)',
};

const LEGEND_ITEMS = [
  { color: 'bg-bg-accent', label: '뉴스' },
  { color: 'bg-bg-pupple', label: '블로그' },
  { color: 'bg-bg-youtube', label: '유튜브' },
  { color: 'bg-bg-green', label: '커뮤니티' },
];

interface MobileChannelDonutChartProps {
  channelStats: ChannelStat[];
  total: number;
}

export function MobileChannelDonutChart({ channelStats, total }: MobileChannelDonutChartProps) {
  return (
    <div>
      <div className="flex justify-start mb-4">
        <ChartLegend items={LEGEND_ITEMS} />
      </div>
      <div className="flex justify-center outline-none **:outline-none">
        <PieChart width={180} height={180}>
          <Pie
            data={channelStats}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="78%"
            outerRadius="100%"
            paddingAngle={2}
            isAnimationActive={false}
            stroke="none"
          >
            {channelStats.map((ch) => (
              <Cell key={ch.id} fill={CHANNEL_COLORS[ch.id] ?? ch.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0];
              const channelId = (d.payload as ChannelStat)?.id;
              return (
                <div className="flex items-center bg-bg-dark-95 rounded-lg px-3 py-2 shadow-card">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHANNEL_COLORS[channelId] ?? d.payload?.color }}
                    />
                    <span className="font-normal text-text-disabled text-[10px]">{d.name}</span>
                  </div>
                  <p className="text-white font-semibold text-xs ml-3">
                    {(d.value as number).toLocaleString()}건 (
                    {total > 0 ? (((d.value as number) / total) * 100).toFixed(1) : 0}%)
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </div>
    </div>
  );
}
