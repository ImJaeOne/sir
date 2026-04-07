'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartLegend } from '@/components/ui/ChartLegend';
import type { ChannelStat } from '@/lib/api/reportApi';

const CHANNEL_COLORS: Record<string, string> = {
  news: 'var(--color-bg-accent)',
  blog: 'var(--color-bg-pupple)',
  youtube: 'var(--color-bg-skyblue)',
  community: 'var(--color-bg-green)',
};

const LEGEND_ITEMS = [
  { color: 'bg-bg-accent', label: '뉴스' },
  { color: 'bg-bg-pupple', label: '블로그' },
  { color: 'bg-bg-skyblue', label: '유튜브' },
  { color: 'bg-bg-green', label: '커뮤니티' },
];

interface ChannelDonutChartProps {
  channelStats: ChannelStat[];
  total: number;
  pdfMode: boolean;
}

export function ChannelDonutChart({ channelStats, total, pdfMode }: ChannelDonutChartProps) {
  return (
    <div>
      <div className="flex justify-start mb-10">
        <ChartLegend items={LEGEND_ITEMS} />
      </div>
      <div className={`my-5 outline-none **:outline-none ${pdfMode ? 'h-48' : 'h-60'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={channelStats}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="80%"
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
                  <div className="flex items-center bg-bg-dark-95 rounded-lg px-4 py-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHANNEL_COLORS[channelId] ?? d.payload?.color }}
                      />
                      <span className="font-normal text-text-disabled text-xs">{d.name}</span>
                    </div>
                    <p className="text-white font-semibold text-sm ml-4">
                      {(d.value as number).toLocaleString()}건 (
                      {total > 0 ? (((d.value as number) / total) * 100).toFixed(1) : 0}%)
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
