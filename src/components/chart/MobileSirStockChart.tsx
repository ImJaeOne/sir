'use client';

import { useMemo, useRef, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import type { SirStockPoint } from '@/lib/api/reportApi';

type TimeFrame = 'daily' | 'weekly';

function getWeekKey(fullDate: string): string {
  const date = new Date(fullDate);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().slice(0, 10);
}

function niceTicks(min: number, max: number, tickCount: number): number[] {
  if (!(max > min)) return Array.from({ length: tickCount }, (_, i) => min + i);
  const intervals = tickCount - 1;
  const pickStep = (raw: number) => {
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const factor = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return factor * mag;
  };
  let step = pickStep((max - min) / intervals);
  let lo = Math.floor(min / step) * step;
  let hi = lo + step * intervals;
  while (hi < max) {
    step = pickStep(step * 1.01);
    lo = Math.floor(min / step) * step;
    hi = lo + step * intervals;
  }
  return Array.from({ length: tickCount }, (_, i) => lo + step * i);
}

function formatPriceTick(v: number, step: number): string {
  if (v < 10000) return v.toLocaleString();
  const decimals = step >= 10000 ? 0 : step >= 1000 ? 1 : step >= 100 ? 2 : 3;
  return `${(v / 10000).toFixed(decimals)}만`;
}

function aggregateWeekly(data: SirStockPoint[]) {
  const weeks = new Map<string, SirStockPoint[]>();
  for (const d of data) {
    const key = getWeekKey(d.fullDate ?? d.date);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(d);
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-52)
    .map(([weekStart, items]) => {
      const sirItems = items.filter((i) => i.sir != null);
      const priceItems = items.filter((i) => i.high_price != null);
      const label = weekStart.slice(5).replace('-', '/');
      return {
        date: `${label}~`,
        fullDate: weekStart,
        sir: sirItems.length
          ? Math.round(sirItems.reduce((s, i) => s + (i.sir ?? 0), 0) / sirItems.length)
          : null,
        isCarried: false,
        open_price: priceItems[0]?.open_price ?? null,
        close_price: priceItems[priceItems.length - 1]?.close_price ?? null,
        high_price: priceItems.length ? Math.max(...priceItems.map((i) => i.high_price!)) : null,
        low_price: priceItems.length ? Math.min(...priceItems.map((i) => i.low_price!)) : null,
      };
    });
}

function CandleShape({ x, y, width, height, payload, minPrice, maxPrice }: any) {
  if (!payload?.open_price) return null;
  const { open_price, close_price, high_price, low_price } = payload;
  const isUp = close_price >= open_price;
  const color = isUp ? '#ef4444' : '#3b82f6';
  const barTop = y;
  const barBottom = y + height;
  const fullRange = maxPrice - minPrice;
  const priceRange = high_price - minPrice;
  const priceToY = (val: number) => {
    const ratio = (val - minPrice) / fullRange;
    return barBottom - ratio * (barBottom - barTop) * (fullRange / priceRange);
  };
  const bodyTop = priceToY(Math.max(open_price, close_price));
  const bodyBottom = priceToY(Math.min(open_price, close_price));
  const bodyH = Math.max(bodyBottom - bodyTop, 1.5);
  const cx = x + width / 2;
  return (
    <g>
      <line
        x1={cx}
        y1={priceToY(high_price)}
        x2={cx}
        y2={priceToY(low_price)}
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
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-bg-dark-95 border border-white rounded-lg px-3 py-3 shadow-card">
      <p className="font-normal text-text-green mb-1 text-xs">
        {d.fullDate ? d.fullDate.replace(/-/g, '.') : label}
      </p>
      <p className="text-white font-bold text-base">SIR {d.sir}점</p>
      {d.isCarried && (
        <p className="text-amber-300 text-[10px] mt-0.5">직전 일자 자동 보정</p>
      )}
      {d.open_price && (
        <div className="text-text-disabled mt-1.5 grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-0.5 text-[10px]">
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
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateTick(date: string, fullDate?: string): string {
  if (!fullDate) return date;
  const d = new Date(fullDate);
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${m}/${dd}(${day})`;
}

const CHART_H = 180;
const ITEM_W = 28;
const TOP = 25;
const BOTTOM = 20;

export function MobileSirStockChart({
  timeFrame = 'daily',
  data: chartInput = [],
}: {
  timeFrame?: TimeFrame;
  data?: SirStockPoint[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayData = useMemo(() => {
    const source = timeFrame === 'weekly' ? aggregateWeekly(chartInput) : chartInput.slice(-30);
    return source.map((d) => ({
      ...d,
      date: formatDateTick(d.date, d.fullDate),
      _candle: d.high_price,
    }));
  }, [timeFrame, chartInput]);

  // 일 기준 30일 domain 고정 (일/주 전환해도 tick px 동일)
  const allPrices = chartInput
    .slice(-30)
    .flatMap((d) => [d.low_price, d.high_price])
    .filter((v): v is number => v != null);
  // [임시 검증] margin 5% → 2% — y축이 데이터 범위에 더 fit
  const rawMin = allPrices.length ? Math.floor(Math.min(...allPrices) * 0.98) : 0;
  const rawMax = allPrices.length ? Math.ceil(Math.max(...allPrices) * 1.02) : 100;
  const bodyW = Math.max(displayData.length * ITEM_W, 300);

  // 좌(SIR) / 중(격자) / 우(주가) 3개 독립 차트 간 틱 Y 위치 정렬 + nice tick 라벨
  const TICK_COUNT = 5;
  const sirTicks = [0, 250, 500, 750, 1000];
  const priceTicks = niceTicks(rawMin, rawMax, TICK_COUNT);
  const minPrice = priceTicks[0];
  const maxPrice = priceTicks[priceTicks.length - 1];
  const priceStep = priceTicks[1] - priceTicks[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [displayData]);

  return (
    <div className="outline-none **:outline-none">
      <div className="flex" style={{ height: CHART_H }}>
        {/* 좌 Y축 (SIR) — 고정 */}
        <div style={{ flexShrink: 0, width: 25, overflow: 'hidden' }}>
          <ComposedChart
            width={120}
            height={CHART_H}
            data={displayData}
            margin={{ top: TOP, right: 0, bottom: BOTTOM, left: -10 }}
          >
            <YAxis
              yAxisId="sir"
              orientation="left"
              domain={[0, 1000]}
              ticks={sirTicks}
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={40}
              label={{
                value: 'SIR',
                position: 'insideTopLeft',
                dx: 10,
                dy: -25,
                style: { fontSize: 9, fill: 'var(--color-text-muted)' },
              }}
            />
            <Line
              yAxisId="sir"
              dataKey="sir"
              stroke="transparent"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </div>

        {/* 본문 — 스크롤. flex item 의 min-width 기본값(auto) 이 자식 width(bodyW) 에 끌려가 레이아웃이 깨지므로 0 으로 명시 */}
        <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
          <ComposedChart
            width={bodyW}
            height={190}
            data={displayData}
            margin={{ top: TOP, right: 5, bottom: 0, left: 5 }}
          >
            <CartesianGrid
              yAxisId="sir"
              strokeDasharray="3 3"
              stroke="#d8dee9"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              interval={2}
            />
            <YAxis yAxisId="sir" domain={[0, 1000]} ticks={sirTicks} hide />
            <YAxis yAxisId="price" domain={[minPrice, maxPrice]} ticks={priceTicks} hide />
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
              content={ChartTooltip}
            />
            <Line
              yAxisId="sir"
              type="monotone"
              dataKey="sir"
              stroke="#17d82d"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props as {
                  cx?: number;
                  cy?: number;
                  payload?: { isCarried?: boolean };
                  index?: number;
                };
                if (cx == null || cy == null || !payload?.isCarried) {
                  return <g key={`dot-${index}`} />;
                }
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#fff"
                    stroke="#17d82d"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 4, fill: '#17d82d', stroke: '#fff', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
            <Bar
              yAxisId="price"
              dataKey="_candle"
              fill="transparent"
              barSize={10}
              isAnimationActive={false}
              shape={(props: any) => (
                <CandleShape {...props} minPrice={minPrice} maxPrice={maxPrice} />
              )}
            />
          </ComposedChart>
        </div>

        {/* 우 Y축 (주가) — 고정 */}
        <div style={{ flexShrink: 0, width: 30, overflow: 'hidden' }}>
          <div style={{ width: 120, marginLeft: -75 }}>
            <ComposedChart
              width={120}
              height={CHART_H}
              data={displayData}
              margin={{ top: TOP, right: 0, bottom: BOTTOM, left: 0 }}
            >
              <YAxis
                yAxisId="price"
                orientation="right"
                domain={[minPrice, maxPrice]}
                ticks={priceTicks}
                tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => formatPriceTick(v, priceStep)}
                label={{
                  value: '주가',
                  position: 'insideTopRight',
                  dx: -20,
                  dy: -25,
                  style: { fontSize: 9, fill: 'var(--color-text-muted)' },
                }}
              />
              <Bar yAxisId="price" dataKey="_candle" fill="transparent" isAnimationActive={false} />
            </ComposedChart>
          </div>
        </div>
      </div>
    </div>
  );
}
