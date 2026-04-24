'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { ChartCanvas } from '@/components/chart/ChartCanvas';
import { ReportCard } from '@/components/report/ReportCard';
import type { TierItem } from '@/lib/api/reportApi';

interface MobileSirRankingBarProps {
  tiers: TierItem[];
}

function splitTierLabel(label: string): [string, string] {
  const match = label.match(/^(.+?)\s*(\(.+\))$/);
  if (match) return [match[1], match[2]];
  return [label, ''];
}

export function MobileSirRankingBar({ tiers }: MobileSirRankingBarProps) {
  const max = Math.ceil(Math.max(...tiers.map((t) => t.count), 1) / 5) * 5 || 5;
  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => i * 5);

  return (
    <div className="flex flex-col gap-2 w-full relative outline-none **:outline-none">
      <ReportCard className="flex-1" px={10} py={10}>
        <div className="flex justify-end mr-1 mb-1">
          <span className="text-[10px] text-text-muted">(단위: 기업 수)</span>
        </div>
        <div style={{ height: 320 }}>
          <ChartCanvas width="100%">
            <BarChart
              data={tiers}
              layout="vertical"
              margin={{ top: 5, right: 25, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="sir-ranking-bar-gradient-m" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#66B6FF" />
                  <stop offset="100%" stopColor="#362CFF" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, max]}
                ticks={ticks}
                tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="tier"
                tick={({ x, y, payload }) => {
                  const idx = tiers.findIndex((t) => t.tier === payload.value);
                  const isCurrent = Number(tiers[idx]?.isCurrent) === 1;
                  const [line1, line2] = splitTierLabel(payload.value);
                  return (
                    <text
                      x={x}
                      y={y}
                      textAnchor="end"
                      fontSize={8}
                      fontWeight={isCurrent ? 700 : 400}
                      fill={isCurrent ? '#362cff' : 'var(--color-text-muted)'}
                    >
                      <tspan x={x} dy="-0.3em">
                        {line1}
                      </tspan>
                      <tspan x={x} dy="1.1em">
                        {line2}
                      </tspan>
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
                width={60}
                interval={0}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 6, 6]}
                barSize={12}
                minPointSize={1}
                isAnimationActive={false}
                background={{ fill: 'var(--color-bg-gray-track)', radius: 6 }}
              >
                {tiers.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.count === 0
                        ? 'transparent'
                        : Number(entry.isCurrent) === 1
                          ? 'url(#sir-ranking-bar-gradient-m)'
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
                        x={x ? (x as number) + (width as number) + 6 : 0}
                        y={y}
                        dy={10}
                        fontSize={9}
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
          </ChartCanvas>
        </div>
      </ReportCard>
    </div>
  );
}
