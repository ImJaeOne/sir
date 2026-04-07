'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartLegend } from '@/components/ui/ChartLegend';

const LEGEND_ITEMS = [
  { color: 'bg-text-accent', label: '긍정' },
  { color: 'bg-text-muted', label: '중립' },
  { color: 'bg-text-danger', label: '부정' },
];

interface SentimentData {
  channel: string;
  긍정: number;
  중립: number;
  부정: number;
  rawPositive: number;
  rawNeutral: number;
  rawNegative: number;
}

interface SentimentStackedBarProps {
  data: SentimentData[];
  pdfMode: boolean;
}

export function SentimentStackedBar({ data, pdfMode }: SentimentStackedBarProps) {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <ChartLegend items={LEGEND_ITEMS} />
      </div>
      <div className={`outline-none **:outline-none ${pdfMode ? 'h-48' : 'h-80'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#d8dee9"
              strokeOpacity={0.5}
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="channel"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                borderRadius: '10px',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
                background: 'transparent',
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = data.find((s) => s.channel === label);
                if (!d) return null;
                const total = d.rawPositive + d.rawNeutral + d.rawNegative;
                return (
                  <div className="bg-bg-dark-95 border border-white rounded-lg px-4 py-3 shadow-card">
                    <div className="flex gap-2 items-center font-bold text-white text-base mb-2">
                      {label}
                      <span className="font-normal text-text-disabled text-xs">
                        총 {total.toLocaleString()}건
                      </span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {[
                          { dot: 'bg-text-accent', label: '긍정', pct: d.긍정, count: d.rawPositive },
                          { dot: 'bg-text-muted', label: '중립', pct: d.중립, count: d.rawNeutral },
                          { dot: 'bg-text-danger', label: '부정', pct: d.부정, count: d.rawNegative },
                        ].map((row) => (
                          <tr key={row.label}>
                            <td className="py-0.5 pr-2">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${row.dot}`} />
                            </td>
                            <td className="py-0.5 pr-3 text-white whitespace-nowrap">{row.label}</td>
                            <td className="py-0.5 pr-3 text-text-muted font-semibold text-right whitespace-nowrap">{row.pct}%</td>
                            <td className="py-0.5 text-text-muted font-semibold text-right whitespace-nowrap">{row.count.toLocaleString()}건</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="긍정"
              stackId="sentiment"
              fill="var(--color-text-accent)"
              barSize={40}
              radius={[0, 0, 4, 4]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="중립"
              stackId="sentiment"
              fill="var(--color-text-muted)"
              barSize={40}
              isAnimationActive={false}
            />
            <Bar
              dataKey="부정"
              stackId="sentiment"
              fill="var(--color-text-danger)"
              barSize={40}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
