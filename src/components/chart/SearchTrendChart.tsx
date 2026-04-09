'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface SearchTrendChartProps {
  data: { date: string; label: string; 네이버: number; 구글: number | null }[];
  pdfMode: boolean;
}

export function SearchTrendChart({ data, pdfMode }: SearchTrendChartProps) {
  return (
    <div className={`outline-none **:outline-none ${pdfMode ? 'h-48' : 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d8dee9"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: '#d8dee9' }}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: '#d8dee9' }}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: '10px',
              border: 'none',
              fontSize: '12px',
              boxShadow: 'none',
              padding: '0',
              background: 'transparent',
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const [y, m, dd] = d.date.split('-');
              return (
                <div className="bg-bg-dark-95 border border-white rounded-lg px-4 py-4 shadow-card">
                  <p className="font-normal text-text-green mb-2 text-xs">
                    {y}.{Number(m)}.{Number(dd)}
                  </p>
                  {payload.map((entry, i: number) => (
                    <div key={i} className="flex items-center justify-between w-30">
                      <div className="flex gap-2 items-center">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-text-disabled text-sm">{entry.name}</span>
                      </div>
                      <span className="font-bold text-white text-base ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="네이버"
            stroke="var(--color-chart-sir)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: 'var(--color-chart-sir)', stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="구글"
            stroke="var(--color-chart-stock-up)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--color-chart-stock-up)',
              stroke: '#fff',
              strokeWidth: 2,
            }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
