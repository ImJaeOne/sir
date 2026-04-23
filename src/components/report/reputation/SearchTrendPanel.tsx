'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ReportCard } from '@/components/report/ReportCard';
import { ReportSubSection } from '@/components/report/ReportSection';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { SearchTrendChart } from '@/components/chart/SearchTrendChart';
import { MobileSearchTrendChart } from '@/components/chart/MobileSearchTrendChart';
import { useMyRole } from '@/hooks/user/useUserQuery';
import { reportKeys } from '@/hooks/report/useReportQuery';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatLabel(date: string): string {
  const d = new Date(date);
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${m}/${dd}(${day})`;
}

interface TrendPoint {
  date: string;
  ratio: number;
}

interface SearchTrendPanelProps {
  naverTrend: TrendPoint[];
  googleTrend: TrendPoint[];
  pdfMode: boolean;
  workspaceId: string;
  reportId: string;
}

const LEGEND_ITEMS = [
  { color: 'bg-chart-sir', label: '네이버' },
  { color: 'bg-chart-stock-up', label: '구글' },
];

/**
 * Google Trends 다운로드 CSV 포맷:
 *   "Time","<기업명>"
 *   "2026-03-20",0
 *   ...
 * 첫 줄(헤더) 스킵 후 각 행을 {date, ratio} 로 변환.
 */
function parseGoogleTrendCsv(text: string): TrendPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const points: TrendPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [datePart, ratioPart] = lines[i].split(',');
    if (!datePart || ratioPart === undefined) continue;
    const date = datePart.replace(/^"|"$/g, '').trim();
    const ratio = Number(ratioPart.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(ratio)) continue;
    points.push({ date, ratio });
  }
  return points;
}

export function SearchTrendPanel({
  naverTrend,
  googleTrend,
  pdfMode,
  workspaceId,
  reportId,
}: SearchTrendPanelProps) {
  const { data: myRole = 'user' } = useMyRole();
  const canUpload = myRole === 'super_admin' || myRole === 'admin';
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const googleMap = new Map(googleTrend.map((t) => [t.date, t.ratio]));
  const chartData = naverTrend.map((t) => ({
    date: t.date,
    label: formatLabel(t.date),
    네이버: t.ratio,
    구글: googleMap.get(t.date) ?? null,
  }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재업로드 허용
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const trendData = parseGoogleTrendCsv(text);
      if (trendData.length === 0) {
        toast.error('CSV 에서 유효한 행을 찾지 못했습니다.');
        return;
      }

      const res = await fetch('/api/admin/upload-search-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          workspace_id: workspaceId,
          provider: 'google',
          trend_data: trendData,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? '업로드 실패');
      }

      toast.success(`구글 트렌드 ${trendData.length}건 업로드 완료`);
      queryClient.invalidateQueries({
        queryKey: reportKeys.searchTrend(workspaceId, reportId),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ReportSubSection
      title="기업명 키워드 검색 관심도 추이"
      description="네이버·구글 기준 검색 관심도 추이를 확인하여 온라인 관심도 확대 여부를 파악합니다."
      tooltip={
        '검색어 트렌드는  요청된 기간 중 검색\n횟수가 가장 높은 시점을 100으로 두고\n 나머지는 상대적 값으로 제공하고 있습니다.'
      }
      action={
        canUpload ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
              title="Google Trends 에서 다운로드한 CSV 업로드"
            >
              <Upload size={13} strokeWidth={1.8} />
              {uploading ? '업로드 중...' : '구글 트렌드 CSV 업로드'}
            </button>
          </>
        ) : undefined
      }
    >
      <ReportCard px={20} py={20}>
        <div className="flex justify-end mb-1 lg:mb-4">
          <ChartLegend items={LEGEND_ITEMS} />
        </div>
        <div className="hidden lg:block">
          <SearchTrendChart data={chartData} pdfMode={pdfMode} />
        </div>
        <div className="lg:hidden">
          <MobileSearchTrendChart data={chartData} />
        </div>
      </ReportCard>
    </ReportSubSection>
  );
}
