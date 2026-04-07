'use client';

import { useState } from 'react';
import { SirStockChart } from '@/components/chart/SirStockChart';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ChartLegend } from '@/components/ui/ChartLegend';
import type { SirStockPoint } from '@/lib/api/reportApi';

type TimeFrame = 'daily' | 'weekly';

const TIME_FRAMES = [
  { key: 'daily', label: '일' },
  { key: 'weekly', label: '주' },
] as const;

const LEGEND_ITEMS = [
  { color: 'bg-chart-sir', label: 'SIR 지수' },
  { color: 'bg-chart-stock-up', secondColor: 'bg-chart-stock-down', label: '주가 지수' },
];

interface SirStockPanelProps {
  pdfMode: boolean;
  sirStockData: SirStockPoint[];
}

export function SirStockPanel({ pdfMode, sirStockData }: SirStockPanelProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');

  return (
    <ReportSubSection
      title="SIR 지수 & 주가 지수"
      description="SIR 지수와 주가 흐름을 이중축으로 배치해 평판 변화와 시장 반응 간의 동행 구간을 직관적으로 확인할 수 있습니다."
      tooltip={
        'SIR 지수와 주가 흐름을 이중축으로 배치해 평판 변화와\n시장 반응 간의 동행 구간을 직관적으로 확인할 수 있습니다.'
      }
    >
      <ReportCard px={20} py={20}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {TIME_FRAMES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeFrame(key)}
                  className={`text-xs w-8 h-8 rounded-lg font-semibold transition-colors cursor-pointer ${
                    timeFrame === key
                      ? 'bg-bg-accent text-white'
                      : 'bg-bg-light text-text-muted hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ChartLegend items={LEGEND_ITEMS} />
          </div>
          <SirStockChart timeFrame={timeFrame} pdfMode={pdfMode} data={sirStockData} />
        </div>
      </ReportCard>
    </ReportSubSection>
  );
}
