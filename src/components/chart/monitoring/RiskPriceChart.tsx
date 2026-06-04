'use client';

import { Area, Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCanvas } from '@/components/chart/ChartCanvas';
import { CRITICAL_TYPES } from '@/lib/api/monitoringApi';
import {
  buildPinLine,
  CandleBar,
  CANDLE_DOWN,
  CANDLE_UP,
  ChartCard,
  ChartLegend,
  CRITICAL_COLOR,
  type MergedPoint,
  makeChartClickHandler,
  priceTickFormatter,
  SHARED_X_AXIS_PROPS,
} from './shared';
import { RiskPriceTooltip } from './tooltips';

interface Props {
  merged: MergedPoint[];
  priceDomain: [number | string, number | string];
  priceTicks?: number[];
  selectedDate: string | null;
  setSelectedDate: (fn: (prev: string | null) => string | null) => void;
  loading: boolean;
  barSize: number;
}

/** 탭 D — 리스크 유형별 발생량(스택 area) + 주가(캔들). */
export function RiskPriceChart({
  merged,
  priceDomain,
  priceTicks,
  selectedDate,
  setSelectedDate,
  loading,
  barSize,
}: Props) {
  const empty = merged.every((d) => d.riskTotal === 0);
  return (
    <ChartCard
      kind="risk"
      subtitle="명예훼손·욕설·루머·스팸 등 유형별 발생량이 주가와 어떻게 맞물리는지 봅니다."
      loading={loading}
      empty={empty}
    >
      <div className="h-[300px]">
        <ChartCanvas width="100%">
          <ComposedChart
            data={merged}
            margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
            onClick={makeChartClickHandler(setSelectedDate)}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} yAxisId="risk" />
            <XAxis {...SHARED_X_AXIS_PROPS} />
            <YAxis
              yAxisId="risk"
              orientation="left"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={28}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={priceTickFormatter}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={48}
              domain={priceDomain}
              ticks={priceTicks}
            />
            <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.06)' }} content={<RiskPriceTooltip />} />
            {CRITICAL_TYPES.map((c) => (
              <Area
                key={c.id}
                yAxisId="risk"
                type="monotone"
                dataKey={(d: MergedPoint) => d.risks[c.id] ?? 0}
                name={c.label}
                stackId="risk"
                stroke={CRITICAL_COLOR[c.id]}
                strokeWidth={1.8}
                fill={CRITICAL_COLOR[c.id]}
                fillOpacity={0.08}
                isAnimationActive={false}
              />
            ))}
            <Bar
              yAxisId="price"
              dataKey="high"
              name="주가"
              fill="transparent"
              barSize={Math.max(barSize * 1.5, 4)}
              isAnimationActive={false}
              shape={(props) => (
                <CandleBar
                  {...props}
                  priceMin={priceDomain[0] as number}
                  priceMax={priceDomain[1] as number}
                />
              )}
            />
            {buildPinLine(selectedDate, 'price')}
          </ComposedChart>
        </ChartCanvas>
      </div>
      <ChartLegend
        items={[
          ...CRITICAL_TYPES.map((c) => ({ color: CRITICAL_COLOR[c.id], label: c.label })),
          { color: CANDLE_UP, label: '주가 상승 (우)' },
          { color: CANDLE_DOWN, label: '주가 하락 (우)' },
        ]}
      />
    </ChartCard>
  );
}
