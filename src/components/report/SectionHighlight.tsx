'use client';

import { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { TrendingUp, BarChart3, Database, AlertTriangle } from 'lucide-react';
import { SirStockChart } from '@/components/report/SirStockChart';
import { ReportCard } from '@/components/report/ReportCard';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex-1 flex flex-col items-center gap-2 shadow-sm">
      <Icon size={20} className={color} />
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-[10px] text-slate-400">{sub}</span>
    </div>
  );
}

type TimeFrame = 'daily' | 'weekly';

function getSirTier(score: number): string {
  if (score >= 900) return '상위 1구간';
  if (score >= 800) return '상위 2구간';
  if (score >= 700) return '상위 3구간';
  if (score >= 600) return '중위 1구간';
  if (score >= 500) return '중위 2구간';
  if (score >= 400) return '중위 3구간';
  if (score >= 300) return '하위 1구간';
  if (score >= 200) return '하위 2구간';
  if (score >= 100) return '하위 3구간';
  return '하위 4구간';
}

function getSirColor(score: number): string {
  if (score >= 610) return 'text-emerald-500';
  if (score >= 410) return 'text-amber-500';
  return 'text-red-500';
}

import type { SirStockPoint, SirRanking, TierItem } from '@/lib/api/reportApi';

interface HighlightProps {
  pdfMode?: boolean;
  sirScore?: number | null;
  totalItems?: number;
  riskCount?: number;
  summary?: string;
  sirStockData?: SirStockPoint[];
  sirRanking?: SirRanking;
  companyName?: string;
}

const defaultRanking: SirRanking = { tiers: [], rank: 0, total: 0, average: 0 };

export function SectionHighlight({ pdfMode = false, sirScore, totalItems = 0, riskCount = 0, summary = [], sirStockData = [], sirRanking = defaultRanking, companyName = '' }: HighlightProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const score = sirScore ?? 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">주간 하이라이트</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Snapshot 카드 */}
      <div className="flex gap-3">
        <StatCard
          icon={TrendingUp}
          label="SIR 지수"
          value={`${Math.round(score)}점`}
          sub=""
          color={getSirColor(score)}
        />
        <StatCard
          icon={BarChart3}
          label="SIR 순위"
          value={getSirTier(score)}
          sub=""
          color="text-blue-500"
        />
        <StatCard
          icon={Database}
          label="수집 데이터"
          value={`${totalItems.toLocaleString()}개`}
          sub=""
          color="text-violet-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="리스크 콘텐츠"
          value={`${riskCount}개`}
          sub={riskCount > 0 ? '즉시 검토 필요' : ''}
          color="text-amber-500"
        />
      </div>

      {/* 이번 주 총평 */}
      <ReportCard title="이번 주 총평">
        {summary ? (
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {summary}
          </div>
        ) : (
          <p className="text-sm text-slate-400">총평 데이터가 없습니다. 총평 생성을 실행해주세요.</p>
        )}
      </ReportCard>

      {/* SIR 지수 & 주가 차트 */}
      <ReportCard
        title="SIR 지수 & 주가 지수"
        description="SIR 지수와 주가 흐름을 이중축으로 배치해 평판 변화와 시장 반응 간의 동행 구간을 직관적으로 확인할 수 있습니다."
        headerRight={
          <div className="flex items-center gap-1">
            {(
              [
                { key: 'daily', label: '일' },
                { key: 'weekly', label: '주' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFrame(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  timeFrame === key
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <SirStockChart timeFrame={timeFrame} pdfMode={pdfMode} data={sirStockData} />
      </ReportCard>

      {/* SIR 주간 순위 */}
      <ReportCard
        title="SIR 주간 순위"
        description="SIR을 사용중인 전체 기업 중 우리 회사의 순위를 확인할 수 있습니다."
      >
        <div className="flex gap-3">
          {/* 왼쪽: 요약 지표 */}
          <div className="shrink-0 flex flex-col justify-evenly pr-6 border-r border-slate-100 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-400">{companyName} SIR 점수</span>
              <span className="text-2xl font-bold text-blue-600">{Math.round(score)}점</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-400">{companyName} 순위</span>
              <span className="text-2xl font-bold text-slate-800">{getSirTier(score)}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-400">SIR 전체 평균 점수</span>
              <span className="text-2xl font-bold text-slate-500">{sirRanking.average}점</span>
            </div>
          </div>

          {/* 오른쪽: 구간별 기업 분포 차트 */}
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 text-right mb-1">(단위: 기업 수)</p>
            <div className={pdfMode ? 'h-56' : 'h-72'}>
              <ResponsiveBar
                data={sirRanking.tiers}
                keys={['count']}
                indexBy="tier"
                layout="horizontal"
                margin={{ top: 0, right: 40, bottom: 25, left: 140 }}
                padding={0.3}
                colors={({ data }) => (Number(data.isCurrent) === 1 ? '#3b82f6' : '#e2e8f0')}
                borderRadius={4}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 8,
                }}
                axisBottom={(() => {
                  const max = Math.ceil(Math.max(...sirRanking.tiers.map(t => t.count), 1) / 5) * 5 || 5;
                  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => i * 5);
                  return { tickSize: 0, tickPadding: 5, tickValues: ticks };
                })()}
                valueScale={{ type: 'linear', min: 0, max: Math.ceil(Math.max(...sirRanking.tiers.map(t => t.count), 1) / 5) * 5 || 5 }}
                enableGridY={false}
                enableGridX={true}
                gridXValues={(() => {
                  const max = Math.ceil(Math.max(...sirRanking.tiers.map(t => t.count), 1) / 5) * 5 || 5;
                  return Array.from({ length: max / 5 + 1 }, (_, i) => i * 5);
                })()}
                label={(d) => `${d.value}`}
                labelSkipWidth={10}
                labelTextColor={({ color }) => (color === '#3b82f6' ? '#ffffff' : '#64748b')}
                theme={{
                  axis: {
                    ticks: { text: { fontSize: 11, fill: '#334155' } },
                  },
                  labels: { text: { fontSize: 10, fontWeight: 600 } },
                  grid: { line: { stroke: '#f1f5f9' } },
                }}
                animate={true}
                isInteractive={false}
              />
            </div>
          </div>
        </div>
      </ReportCard>
    </section>
  );
}
