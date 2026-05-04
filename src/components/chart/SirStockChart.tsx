'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
} from 'recharts';
import { ChartCanvas } from '@/components/chart/ChartCanvas';

import type { SirStockPoint } from '@/lib/api/reportApi';

type TimeFrame = 'daily' | 'weekly';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateTick(date: string, fullDate?: string): string {
  if (!fullDate) return date;
  const d = new Date(fullDate);
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${m}/${dd}(${day})`;
}

function getWeekKey(fullDate: string): string {
  // YYYY-MM-DD → 해당 주 월요일 기준 키
  const date = new Date(fullDate);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().slice(0, 10);
}

/** [min, max] 을 tickCount 개의 균등·"nice" 틱으로 스냅. 반환 배열 길이는 tickCount 고정. */
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
  // hi < max 이면 step 을 다음 nice 값으로 승격해 전 구간 포함 보장
  while (hi < max) {
    step = pickStep(step * 1.01);
    lo = Math.floor(min / step) * step;
    hi = lo + step * intervals;
  }
  return Array.from({ length: tickCount }, (_, i) => lo + step * i);
}

/** 주가 틱 라벨 포맷 — step 크기에 따라 만 단위·소수점 자릿수 조정. */
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
        // weekly 는 7일 평균 — carry 시각화 의미 없음
        isCarried: false,
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
    const source = timeFrame === 'weekly'
      ? aggregateWeekly(chartInput)
      : chartInput.slice(-30);
    return source.map((d) => ({
      ...d,
      date: formatDateTick(d.date, d.fullDate),
      _candle: d.high_price,
    }));
  }, [timeFrame, chartInput]);

  const allPrices = chartInput.slice(-30)
    .flatMap((d) => [d.low_price, d.high_price])
    .filter((v): v is number => v != null);
  // [임시 검증] margin 5% → 2% — y축이 데이터 범위에 더 fit
  const rawMin = allPrices.length ? Math.floor(Math.min(...allPrices) * 0.98) : 0;
  const rawMax = allPrices.length ? Math.ceil(Math.max(...allPrices) * 1.02) : 100;

  // 두 Y축을 동일 개수·동일 비율 위치에 고정 + nice tick 으로 주가 틱 라벨을 범위에 맞춰 스냅
  const TICK_COUNT = 5;
  const sirTicks = [0, 250, 500, 750, 1000];
  const priceTicks = niceTicks(rawMin, rawMax, TICK_COUNT);
  const minPrice = priceTicks[0];
  const maxPrice = priceTicks[priceTicks.length - 1];
  const priceStep = priceTicks[1] - priceTicks[0];

  return (
    <div className="outline-none **:outline-none">
      <div className={pdfMode ? 'h-60' : 'h-80'}>
        <ChartCanvas width="105%">
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
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              interval={2}
            />
            {/* 왼쪽: SIR 지수 */}
            <YAxis
              yAxisId="sir"
              orientation="left"
              domain={[0, 1000]}
              ticks={sirTicks}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              width={35}
              label={{
                value: 'SIR',
                angle: -90,
                position: 'outside',
                dx: -20,
                style: { fontSize: 10, fill: 'var(--color-text-muted)', textAnchor: 'middle' },
              }}
            />
            {/* 오른쪽: 주가 */}
            <YAxis
              yAxisId="price"
              orientation="right"
              domain={[minPrice, maxPrice]}
              ticks={priceTicks}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={{ stroke: '#d8dee9' }}
              tickLine={false}
              width={50}
              tickFormatter={(v) => formatPriceTick(v, priceStep)}
              label={{
                value: '주가',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 10, fill: 'var(--color-text-muted)', textAnchor: 'middle' },
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
                  <div className="bg-bg-dark-95 border border-white rounded-lg px-4 py-4 shadow-card">
                    <p className="font-normal text-text-green mb-1 text-sm">
                      {d.fullDate ? d.fullDate.replace(/-/g, '.') : label}
                    </p>
                    <p className="text-white font-bold text-xl">SIR {d.sir}점</p>
                    {d.isCarried && (
                      <p className="text-amber-300 text-[11px] mt-1">직전 일자 자동 보정</p>
                    )}
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
            {/* SIR 라인 — carry 일자만 hollow ○ 마커로 표시 (real 일자는 라인만) */}
            <Line
              yAxisId="sir"
              type="monotone"
              dataKey="sir"
              name="SIR 지수"
              stroke="#17d82d"
              strokeWidth={3}
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
                    r={4}
                    fill="#fff"
                    stroke="#17d82d"
                    strokeWidth={2}
                  />
                );
              }}
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
              shape={(props) => {
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
        </ChartCanvas>
      </div>
    </div>
  );
}
