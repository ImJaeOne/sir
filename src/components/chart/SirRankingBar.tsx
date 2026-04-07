'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { ReportCard } from '@/components/report/ReportCard';
import type { TierItem } from '@/lib/api/reportApi';

interface SirRankingBarProps {
  tiers: TierItem[];
  pdfMode: boolean;
}

export function SirRankingBar({ tiers, pdfMode }: SirRankingBarProps) {
  const max = Math.ceil(Math.max(...tiers.map((t) => t.count), 1) / 5) * 5 || 5;
  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => i * 5);

  return (
    <ReportCard className="flex-1" px={20} py={10}>
      <div className="flex flex-col gap-2">
        <div className={pdfMode ? 'h-56' : 'h-72'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tiers}
              layout="vertical"
              margin={{ top: 20, right: 0, bottom: 0, left: -30 }}
            >
              <defs>
                <linearGradient id="sir-ranking-bar-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#66B6FF" />
                  <stop offset="100%" stopColor="#362CFF" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={ticks}
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="tier"
                tick={({ x, y, payload }) => {
                  const idx = tiers.findIndex((t) => t.tier === payload.value);
                  const isCurrent = Number(tiers[idx]?.isCurrent) === 1;
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fontSize={10}
                      fontWeight={isCurrent ? 700 : 400}
                      fill={isCurrent ? '#362cff' : 'var(--color-text-muted)'}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
                width={160}
                interval={0}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 8, 8]}
                barSize={16}
                minPointSize={1}
                isAnimationActive={false}
                background={{ fill: 'var(--color-bg-gray-track)', radius: 8 }}
              >
                {tiers.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.count === 0
                        ? 'transparent'
                        : Number(entry.isCurrent) === 1
                          ? 'url(#sir-ranking-bar-gradient)'
                          : 'var(--color-bg-gray-cell)'
                    }
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  content={({ x, y, width, value, index }) => {
                    const isCurrent = Number(tiers[index as number]?.isCurrent) === 1;
                    return (
                      <text
                        x={x ? (x as number) + (width as number) + 8 : 0}
                        y={y}
                        dy={12}
                        fontSize={10}
                        fontWeight={isCurrent ? 700 : 600}
                        fill={isCurrent ? '#362cff' : 'var(--color-text-gray-cell)'}
                      >
                        {value}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ReportCard>
  );
}
