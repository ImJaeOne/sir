'use client';

import { Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCanvas } from '@/components/chart/ChartCanvas';
import {
  buildPinLine,
  ChartCard,
  ChartLegend,
  F_VOLUME,
  F_VOLUME_SOFT,
  type MergedPoint,
  makeChartClickHandler,
  SEARCH_NAVER,
  SHARED_X_AXIS_PROPS,
} from './shared';
import { VolumeSearchTooltip } from './tooltips';

interface Props {
  merged: MergedPoint[];
  selectedDate: string | null;
  setSelectedDate: (fn: (prev: string | null) => string | null) => void;
  loading: boolean;
  barSize: number;
}

/** 탭 F — 내부 수집량(막대) vs 외부 검색 관심도(라인). */
export function VolumeSearchChart({ merged, selectedDate, setSelectedDate, loading, barSize }: Props) {
  const hasSearch = merged.some((d) => d.searchNaver != null);
  const empty = !hasSearch && merged.every((d) => d.totalVolume === 0);
  return (
    <ChartCard
      title="수집량과 검색 관심도"
      subtitle="외부 관심(검색)과 실제 언급량(수집)이 함께 움직이는지 비교합니다."
      loading={loading}
      empty={empty}
    >
      <div className="h-[280px]">
        <ChartCanvas>
          <ComposedChart
            data={merged}
            margin={{ top: 12, right: 18, bottom: 0, left: 0 }}
            onClick={makeChartClickHandler(setSelectedDate)}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="volBar2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={F_VOLUME} stopOpacity={0.5} />
                <stop offset="100%" stopColor={F_VOLUME} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis {...SHARED_X_AXIS_PROPS} />
            <YAxis
              yAxisId="vol"
              orientation="left"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <YAxis
              yAxisId="srch"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip cursor={{ fill: F_VOLUME_SOFT }} content={<VolumeSearchTooltip />} />
            <Bar
              yAxisId="vol"
              dataKey="totalVolume"
              name="수집량"
              fill="url(#volBar2)"
              isAnimationActive={false}
              barSize={barSize}
            />
            <Line
              yAxisId="srch"
              type="monotone"
              dataKey="searchNaver"
              name="네이버"
              stroke={SEARCH_NAVER}
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            {buildPinLine(selectedDate, 'vol')}
          </ComposedChart>
        </ChartCanvas>
      </div>
      <ChartLegend
        items={[
          { color: F_VOLUME, label: '수집량 (좌, 건)', soft: true },
          { color: SEARCH_NAVER, label: '네이버 (우)' },
        ]}
      />
    </ChartCard>
  );
}
