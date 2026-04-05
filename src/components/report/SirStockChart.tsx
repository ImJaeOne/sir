'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from 'recharts';

import type { SirStockPoint } from '@/lib/api/reportApi';

type TimeFrame = 'daily' | 'weekly';

function getWeekKey(dateStr: string): string {
  // MM-DD → 주차 키 (해당 주의 월요일 기준)
  const year = 2026; // 목데이터 기준
  const [m, d] = dateStr.split('-').map(Number);
  const date = new Date(year, m - 1, d);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return `${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function aggregateWeekly(data: SirStockPoint[]) {
  const weeks = new Map<string, SirStockPoint[]>();
  for (const d of data) {
    const key = getWeekKey(d.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(d);
  }

  return Array.from(weeks.entries()).map(([weekStart, items]) => {
    const sirItems = items.filter((i) => i.sir != null);
    const priceItems = items.filter((i) => i.high_price != null);
    return {
      date: `${weekStart}~`,
      sir: sirItems.length
        ? Math.round(sirItems.reduce((s, i) => s + (i.sir ?? 0), 0) / sirItems.length)
        : null,
      open_price: priceItems[0]?.open_price ?? null,
      close_price: priceItems[priceItems.length - 1]?.close_price ?? null,
      high_price: priceItems.length ? Math.max(...priceItems.map((i) => i.high_price!)) : null,
      low_price: priceItems.length ? Math.min(...priceItems.map((i) => i.low_price!)) : null,
    };
  });
}

export function SirStockChart({
  timeFrame = 'daily' as TimeFrame,
  pdfMode = false,
  data: chartInput = [],
}: {
  timeFrame?: TimeFrame;
  pdfMode?: boolean;
  data?: SirStockPoint[];
}) {
  const displayData = useMemo(() => {
    const source = timeFrame === 'weekly' ? aggregateWeekly(chartInput) : chartInput;
    return source.map((d) => ({ ...d, _candle: d.high_price }));
  }, [timeFrame, chartInput]);

  const allPrices = displayData
    .flatMap((d) => [d.low_price, d.high_price])
    .filter((v): v is number => v != null);
  const minPrice = allPrices.length ? Math.floor(Math.min(...allPrices) * 0.95) : 0;
  const maxPrice = allPrices.length ? Math.ceil(Math.max(...allPrices) * 1.05) : 100;

  return (
    <div className="outline-none **:outline-none">
      <div className={pdfMode ? 'h-60' : 'h-80'}>
        <ResponsiveContainer width="105%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 55, bottom: 0, left: 10 }}>
            <CartesianGrid
              yAxisId="sir"
              strokeDasharray="3 3"
              stroke="#d8dee9"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              interval={2}
            />
            {/* 왼쪽: SIR 지수 */}
            <YAxis
              yAxisId="sir"
              orientation="left"
              domain={[0, 1000]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              width={35}
              label={{
                value: 'SIR',
                angle: -90,
                position: 'outside',
                dx: -20,
                style: { fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' },
              }}
            />
            {/* 오른쪽: 주가 */}
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              width={50}
              tickFormatter={(v) => `${(v / 10000).toFixed(1)}만`}
              label={{
                value: '주가',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' },
              }}
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
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div className="bg-bg-dark-95 border border-slate-200 rounded-lg px-4 py-4 shadow-card">
                    <p className="font-normal text-text-green mb-1 text-sm">
                      {d.fullDate ? d.fullDate.replace(/-/g, '.') : label}
                    </p>
                    <p className="text-white font-bold text-xl">SIR {d.sir}점</p>
                    {d.open_price && (
                      <div className="text-text-disabled mt-2 grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                        <span>시</span>
                        <span className="text-right">{d.open_price.toLocaleString()}</span>
                        <span>종</span>
                        <span className="text-right">{d.close_price.toLocaleString()}</span>
                        <span>고</span>
                        <span className="text-right">{d.high_price.toLocaleString()}</span>
                        <span>저</span>
                        <span className="text-right">{d.low_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {/* SIR 라인 */}
            <Line
              yAxisId="sir"
              type="monotone"
              dataKey="sir"
              name="SIR 지수"
              stroke="#17d82d"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#17d82d', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />

            {/* 캔들스틱 (커스텀 바) */}
            <Bar
              yAxisId="price"
              dataKey="_candle"
              name="주가"
              fill="transparent"
              barSize={14}
              isAnimationActive={false}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                if (!payload?.open_price) return null;

                const { open_price, close_price, high_price, low_price } = payload;
                const isUp = close_price >= open_price;
                const color = isUp ? '#ef4444' : '#3b82f6';

                // recharts 바 좌표에서 가격 스케일 역산
                const barTop = y;
                const barBottom = y + height;
                const priceRange = high_price - minPrice;
                const fullRange = maxPrice - minPrice;

                const priceToY = (val: number) => {
                  const ratio = (val - minPrice) / fullRange;
                  return barBottom - ratio * (barBottom - barTop) * (fullRange / priceRange);
                };

                const bodyTop = priceToY(Math.max(open_price, close_price));
                const bodyBottom = priceToY(Math.min(open_price, close_price));
                const bodyH = Math.max(bodyBottom - bodyTop, 1.5);
                const wickTop = priceToY(high_price);
                const wickBottom = priceToY(low_price);
                const cx = x + width / 2;

                return (
                  <g>
                    <line
                      x1={cx}
                      y1={wickTop}
                      x2={cx}
                      y2={wickBottom}
                      stroke={color}
                      strokeWidth={1}
                    />
                    <rect
                      x={x + width * 0.1}
                      y={bodyTop}
                      width={width * 0.8}
                      height={bodyH}
                      fill={color}
                      rx={1}
                    />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
