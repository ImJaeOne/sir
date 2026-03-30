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
  Legend,
  Bar,
  Cell,
  Rectangle,
} from 'recharts';

// 캔들스틱 커스텀 Shape
function CandlestickShape(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload?.open_price) return null;

  const { open_price, close_price, high_price, low_price } = payload;
  const isUp = close_price >= open_price;
  const color = isUp ? '#ef4444' : '#3b82f6'; // 상승: 빨강, 하락: 파랑

  // y축 스케일 계산
  const yAxis = props.yAxis || {};
  const domain = yAxis.domain || [0, 100];
  const chartHeight = yAxis.height || height;
  const chartY = yAxis.y || 0;

  const scale = (val: number) => {
    const ratio = (val - domain[0]) / (domain[1] - domain[0]);
    return chartY + chartHeight - ratio * chartHeight;
  };

  const bodyTop = scale(Math.max(open_price, close_price));
  const bodyBottom = scale(Math.min(open_price, close_price));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
  const wickTop = scale(high_price);
  const wickBottom = scale(low_price);
  const centerX = x + width / 2;

  return (
    <g>
      {/* 꼬리 (wick) */}
      <line x1={centerX} y1={wickTop} x2={centerX} y2={wickBottom} stroke={color} strokeWidth={1} />
      {/* 몸통 (body) */}
      <rect
        x={x + width * 0.15}
        y={bodyTop}
        width={width * 0.7}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
      />
    </g>
  );
}

// 목데이터
const mockData = [
  { date: '02-24', sir: 45, open_price: 30480, high_price: 30627, low_price: 29300, close_price: 29988 },
  { date: '02-26', sir: 42, open_price: 29550, high_price: 29700, low_price: 27950, close_price: 28150 },
  { date: '02-28', sir: 48, open_price: 27800, high_price: 28150, low_price: 26850, close_price: 27200 },
  { date: '03-03', sir: 44, open_price: 26550, high_price: 28100, low_price: 26350, close_price: 26500 },
  { date: '03-04', sir: 40, open_price: 25800, high_price: 25950, low_price: 22950, close_price: 23350 },
  { date: '03-05', sir: 38, open_price: 24750, high_price: 25100, low_price: 24000, close_price: 24500 },
  { date: '03-06', sir: 43, open_price: 24250, high_price: 25900, low_price: 24200, close_price: 25100 },
  { date: '03-09', sir: 52, open_price: 24100, high_price: 26850, low_price: 23550, close_price: 26300 },
  { date: '03-10', sir: 55, open_price: 27700, high_price: 28250, low_price: 26300, close_price: 27750 },
  { date: '03-11', sir: 50, open_price: 27850, high_price: 28850, low_price: 27750, close_price: 28000 },
  { date: '03-12', sir: 48, open_price: 28000, high_price: 28450, low_price: 27150, close_price: 27650 },
  { date: '03-13', sir: 46, open_price: 26950, high_price: 28050, low_price: 26650, close_price: 27600 },
  { date: '03-16', sir: 72, open_price: 29000, high_price: 35850, low_price: 28850, close_price: 35850 },
  { date: '03-17', sir: 68, open_price: 35300, high_price: 37300, low_price: 35250, close_price: 35800 },
  { date: '03-18', sir: 65, open_price: 37450, high_price: 39750, low_price: 36450, close_price: 37950 },
  { date: '03-19', sir: 60, open_price: 36850, high_price: 40700, low_price: 36300, close_price: 39600 },
  { date: '03-20', sir: 58, open_price: 39100, high_price: 39900, low_price: 37350, close_price: 39750 },
  { date: '03-23', sir: 55, open_price: 37750, high_price: 38500, low_price: 36750, close_price: 37750 },
  { date: '03-24', sir: 53, open_price: 38600, high_price: 40050, low_price: 38450, close_price: 39250 },
  { date: '03-25', sir: 50, open_price: 39600, high_price: 41000, low_price: 38100, close_price: 39200 },
];

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

function aggregateWeekly(data: typeof mockData) {
  const weeks = new Map<string, typeof mockData>();
  for (const d of data) {
    const key = getWeekKey(d.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(d);
  }

  return Array.from(weeks.entries()).map(([weekStart, items]) => ({
    date: `${weekStart}~`,
    sir: Math.round(items.reduce((s, i) => s + i.sir, 0) / items.length),
    open_price: items[0].open_price,
    close_price: items[items.length - 1].close_price,
    high_price: Math.max(...items.map(i => i.high_price)),
    low_price: Math.min(...items.map(i => i.low_price)),
  }));
}

export function SirStockChart({ timeFrame = 'daily' as TimeFrame, pdfMode = false }: { timeFrame?: TimeFrame; pdfMode?: boolean }) {

  const displayData = useMemo(() => {
    const source = timeFrame === 'weekly' ? aggregateWeekly(mockData) : mockData;
    return source.map(d => ({ ...d, _candle: d.high_price }));
  }, [timeFrame]);

  const allPrices = displayData.flatMap(d => [d.low_price, d.high_price]);
  const minPrice = Math.floor(Math.min(...allPrices) * 0.95);
  const maxPrice = Math.ceil(Math.max(...allPrices) * 1.05);

  return (
    <div>
      <div className={pdfMode ? "h-60" : "h-80"}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={displayData} margin={{ top: 10, right: 55, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          {/* 왼쪽: SIR 지수 */}
          <YAxis
            yAxisId="sir"
            orientation="left"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={35}
            label={{ value: 'SIR', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' } }}
          />
          {/* 오른쪽: 주가 */}
          <YAxis
            yAxisId="price"
            orientation="right"
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v) => `${(v / 10000).toFixed(1)}만`}
            label={{ value: '주가', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#94a3b8', textAnchor: 'middle' } }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: '8px 12px',
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              const isUp = d.close_price >= d.open_price;
              return (
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
                  <p className="font-semibold text-slate-700 mb-1">{label}</p>
                  <p className="text-indigo-600">SIR: {d.sir}점</p>
                  {d.open_price && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <p className={isUp ? 'text-red-500' : 'text-blue-500'}>
                        시 {d.open_price.toLocaleString()} → 종 {d.close_price.toLocaleString()}
                      </p>
                      <p className="text-slate-400">
                        고 {d.high_price.toLocaleString()} / 저 {d.low_price.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              );
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
          />

          {/* SIR 라인 */}
          <Line
            yAxisId="sir"
            type="monotone"
            dataKey="sir"
            name="SIR 지수"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
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
                  <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1} />
                  <rect x={x + width * 0.1} y={bodyTop} width={width * 0.8} height={bodyH} fill={color} rx={1} />
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
