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

const tierData = [
  { tier: '하위 4구간 (0~9)', count: 2, isCurrent: 0 },
  { tier: '하위 3구간 (10~19)', count: 5, isCurrent: 0 },
  { tier: '하위 2구간 (20~29)', count: 10, isCurrent: 0 },
  { tier: '하위 1구간 (30~39)', count: 15, isCurrent: 0 },
  { tier: '중위 3구간 (40~49)', count: 20, isCurrent: 0 },
  { tier: '중위 2구간 (50~59)', count: 25, isCurrent: 0 },
  { tier: '중위 1구간 (60~69)', count: 18, isCurrent: 0 },
  { tier: '상위 3구간 (70~79)', count: 12, isCurrent: 1 },
  { tier: '상위 2구간 (80~89)', count: 8, isCurrent: 0 },
  { tier: '상위 1구간 (90~100)', count: 3, isCurrent: 0 },
];

type TimeFrame = 'daily' | 'weekly';

function getSirTier(score: number): string {
  if (score >= 90) return '상위 1구간';
  if (score >= 80) return '상위 2구간';
  if (score >= 70) return '상위 3구간';
  if (score >= 60) return '중위 1구간';
  if (score >= 50) return '중위 2구간';
  if (score >= 40) return '중위 3구간';
  if (score >= 30) return '하위 1구간';
  if (score >= 20) return '하위 2구간';
  if (score >= 10) return '하위 3구간';
  return '하위 4구간';
}

function getSirColor(score: number): string {
  if (score >= 61) return 'text-emerald-500';
  if (score >= 41) return 'text-amber-500';
  return 'text-red-500';
}

interface HighlightProps {
  pdfMode?: boolean;
  sirScore?: number | null;
  totalItems?: number;
  riskCount?: number;
}

export function SectionHighlight({ pdfMode = false, sirScore, totalItems = 0, riskCount = 0 }: HighlightProps) {
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
        <ul className="text-sm text-slate-600 space-y-1.5 leading-relaxed">
          <li>
            • 뉴스·블로그·영상 등 긍정 비율이 유지되고 있으나, 종목토론방 및 커뮤니티 채널에서 부정
            의견도 꾸준히 게시되고 있습니다.
          </li>
          <li>• 리스크 콘텐츠 5건 중 3건은 허위사실 유포 가능성이 높아 조기 검토가 권장됩니다.</li>
          <li>
            • 강력한 상승세와 SIR 지수 상승이 동반되며 관심도가 지속적으로 확대되고 있어, 선제적
            콘텐츠 배포 시 회복 판돈을 얻을 수 있는 구간입니다.
          </li>
        </ul>
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
        <SirStockChart timeFrame={timeFrame} pdfMode={pdfMode} />
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
              <span className="text-xs text-slate-400">DN오토모티브 SIR 점수</span>
              <span className="text-2xl font-bold text-blue-600">78점</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-400">DN오토모티브 순위</span>
              <span className="text-2xl font-bold text-slate-800">상위 3구간</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
              <span className="text-xs text-slate-400">SIR 전체 평균 점수</span>
              <span className="text-2xl font-bold text-slate-500">58점</span>
            </div>
          </div>

          {/* 오른쪽: 구간별 기업 분포 차트 */}
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 text-right mb-1">(단위: 기업 수)</p>
            <div className={pdfMode ? 'h-56' : 'h-72'}>
              <ResponsiveBar
                data={tierData}
                keys={['count']}
                indexBy="tier"
                layout="horizontal"
                margin={{ top: 0, right: 40, bottom: 25, left: 140 }}
                padding={0.3}
                colors={({ data }) => (data.isCurrent ? '#3b82f6' : '#e2e8f0')}
                borderRadius={4}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 8,
                }}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 5,
                  tickValues: [0, 5, 10, 15, 20, 25, 30],
                }}
                enableGridY={false}
                enableGridX={true}
                gridXValues={5}
                label={(d) => `${d.value}`}
                labelSkipWidth={20}
                labelTextColor={({ data }) => ((data as any).isCurrent ? '#ffffff' : '#64748b')}
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
