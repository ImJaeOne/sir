'use client';

import { useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatLabel(date: string): string {
  const d = new Date(date);
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${m}/${dd}(${day})`;
}

interface MobileSearchTrendChartProps {
  data: { date: string; label: string; 네이버: number; 구글: number | null }[];
}

const CHART_H = 180;
const ITEM_W = 28;
const TOP = 10;
const BOTTOM = 20;

export function MobileSearchTrendChart({ data }: MobileSearchTrendChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyW = Math.max(data.length * ITEM_W, 300);

  const mobileData = data.map((d) => ({ ...d, label: formatLabel(d.date) }));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [data]);

  return (
    <div className="outline-none **:outline-none">
      <div className="flex" style={{ height: CHART_H }}>
        {/* 좌 Y축 — 고정 */}
        <div style={{ flexShrink: 0, width: 25, overflow: 'hidden' }}>
          <LineChart
            width={120}
            height={170}
            data={mobileData}
            margin={{ top: TOP, right: 0, bottom: BOTTOM, left: 0 }}
          >
            <YAxis
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              width={25}
            />
            <Line dataKey="네이버" stroke="transparent" dot={false} isAnimationActive={false} />
          </LineChart>
        </div>

        {/* 본문 — 스크롤 */}
        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <LineChart
            width={bodyW}
            height={180}
            data={mobileData}
            margin={{ top: TOP, right: 5, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#d8dee9"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={{ stroke: '#d8dee9' }}
              interval={2}
            />
            <YAxis hide />
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
                  <div className="bg-bg-dark-95 border border-white rounded-lg px-3 py-3 shadow-card">
                    <p className="font-normal text-text-green mb-1.5 text-[10px]">
                      {y}.{Number(m)}.{Number(dd)}
                    </p>
                    {payload.map((entry, i: number) => (
                      <div key={i} className="flex items-center justify-between w-24">
                        <div className="flex gap-1.5 items-center">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-text-disabled text-xs">{entry.name}</span>
                        </div>
                        <span className="font-bold text-white text-sm ml-auto">{entry.value}</span>
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
              activeDot={{ r: 4, fill: 'var(--color-chart-sir)', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="구글"
              stroke="var(--color-chart-stock-up)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: 'var(--color-chart-stock-up)',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
