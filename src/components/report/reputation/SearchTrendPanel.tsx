'use client';

import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { SearchTrendChart } from '@/components/chart/SearchTrendChart';

interface TrendPoint {
  date: string;
  ratio: number;
}

interface SearchTrendPanelProps {
  naverTrend: TrendPoint[];
  googleTrend: TrendPoint[];
  pdfMode: boolean;
}

const LEGEND_ITEMS = [
  { color: 'bg-chart-sir', label: '네이버' },
  { color: 'bg-chart-stock-up', label: '구글' },
];

export function SearchTrendPanel({ naverTrend, googleTrend, pdfMode }: SearchTrendPanelProps) {
  const googleMap = new Map(googleTrend.map((t) => [t.date, t.ratio]));
  const chartData = naverTrend.map((t) => ({
    date: t.date,
    label: t.date.slice(5),
    네이버: t.ratio,
    구글: googleMap.get(t.date) ?? null,
  }));

  return (
    <ReportSubSection
      title="기업명 키워드 검색 관심도 추이"
      description="네이버·구글 기준 검색 관심도 추이를 확인하여 온라인 관심도 확대 여부를 파악합니다."
      tooltip={
        '검색어 트렌드는  요청된 기간 중 검색\n횟수가 가장 높은 시점을 100으로 두고\n 나머지는 상대적 값으로 제공하고 있습니다.'
      }
    >
      <ReportCard px={20} py={20}>
        <div className="flex justify-end mb-4">
          <ChartLegend items={LEGEND_ITEMS} />
        </div>
        <SearchTrendChart data={chartData} pdfMode={pdfMode} />
      </ReportCard>
    </ReportSubSection>
  );
}
