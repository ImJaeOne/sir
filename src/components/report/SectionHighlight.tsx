'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { SirStockChart } from '@/components/report/SirStockChart';
import { ReportCard } from '@/components/report/ReportCard';
import { Md } from '@/components/ui/Markdown';
import type { SummarySection } from '@/lib/api/reportApi';
import { cn } from '@/lib/utils';
import { ReportSection, ReportSubSection } from '@/components/report/ReportSection';

function StatCard({
  title,
  description,
  value,
  change,
}: {
  title: string;
  description: string;
  value: string;
  change?: { label: string; type: 'up' | 'down' | 'neutral' } | null;
}) {
  return (
    <div className="bg-white rounded-xl px-[30px] py-[26px] flex flex-1 flex-col items-start shadow-card">
      <span className="text-base font-bold text-text-muted mb-8">{title}</span>
      <div className="flex flex-col mb-5">
        <span className="text-sm font-normal text-text-muted">{description}</span>
        <span className="text-[42px] font-extrabold text-text-dark">{value}</span>
      </div>
      <div
        className={cn(
          'w-full flex justify-center py-[10px] rounded-[10px]',
          change?.type === 'down' ? 'bg-bg-danger' : 'bg-bg-blue'
        )}
      >
        {change && (
          <span
            className={`text-sm font-bold ${change.type === 'up' ? 'text-text-accent' : change.type === 'down' ? 'text-text-danger' : 'text-text-muted'}`}
          >
            {change.label}
          </span>
        )}
      </div>
    </div>
  );
}

function formatChange(
  diff: number,
  unit: string,
  upLabel: string,
  downLabel: string,
  prefix: string,
  invertColor?: boolean
): { label: string; type: 'up' | 'down' | 'neutral' } {
  if (diff === 0) return { label: `${prefix}유지`, type: 'neutral' };
  const isUp = diff > 0;
  const arrow = isUp ? '▲' : '▼';
  const colorType = invertColor ? (isUp ? 'down' : 'up') : isUp ? 'up' : 'down';
  return {
    label: `${prefix}${arrow} ${Math.abs(diff)}${unit} ${isUp ? upLabel : downLabel}`,
    type: colorType,
  };
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

const SUMMARY_SECTIONS = [
  { label: 'SIR 지수 및\n시장 지위 평가', icon: ReputationIcon, bg: 'bg-bg-blue' },
  { label: '채널별 여론\n다이내믹스', icon: DynamicsIcon, bg: 'bg-bg-pupple' },
  { label: '긍정 모멘텀 분석', icon: MomentumIcon, bg: 'bg-bg-green' },
  { label: '리스크 분석', icon: LiskIcon, bg: 'bg-bg-danger' },
];

function SummaryAccordion({ sections }: { sections: SummarySection[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg overflow-hidden',
            i < sections.length - 1 && 'border-b border-border-light'
          )}
        >
          <div className="flex items-start gap-20 px-4 py-8">
            <div className="flex gap-5 shrink-0">
              {SUMMARY_SECTIONS[i]?.icon &&
                (() => {
                  const Icon = SUMMARY_SECTIONS[i].icon;
                  return (
                    <div className={cn('p-[15px] rounded-lg', SUMMARY_SECTIONS[i].bg)}>
                      <Icon size={30} />
                    </div>
                  );
                })()}
              <div className="w-[162px] whitespace-pre-line text-xl text-text-muted font-bold">
                {SUMMARY_SECTIONS[i]?.label ?? `섹션 ${i + 1}`}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex justify-between items-center text-left cursor-pointer hover:opacity-80 transition-opacity"
              >
                <p className="text-xl font-semibold text-text-dark">{section.summary}</p>
                {openIdx === i ? (
                  <ChevronUp size={30} className="text-slate-400 shrink-0 ml-4" />
                ) : (
                  <ChevronDown size={30} className="text-slate-400 shrink-0 ml-4" />
                )}
              </button>
              {openIdx === i && (
                <div className="mt-4">
                  <Md type="reputation">{section.detail}</Md>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import type { SirStockPoint, SirRanking } from '@/lib/api/reportApi';
import { ReputationIcon } from '@/components/icons/ReputationIcon';
import { DynamicsIcon } from '@/components/icons/DynamicsIcon';
import { MomentumIcon } from '@/components/icons/MomentumIcon';
import { LiskIcon } from '@/components/icons/LiskIcon';
import { WeeklyHighlightIcon } from '@/components/icons/WeeklyHighlightIcon';

export interface SnapshotDiff {
  scoreDiff: number;
  tierDiff: number;
  itemsDiff: number;
  riskDiff: number;
}

interface HighlightProps {
  pdfMode?: boolean;
  sirScore?: number | null;
  totalItems?: number;
  riskCount?: number;
  summary?: SummarySection[];
  sirStockData?: SirStockPoint[];
  sirRanking?: SirRanking;
  companyName?: string;
  isInitial?: boolean;
  snapshotDiff?: SnapshotDiff;
}

const defaultRanking: SirRanking = { tiers: [], rank: 0, total: 0, average: 0 };

export function SectionHighlight({
  pdfMode = false,
  sirScore,
  totalItems = 0,
  riskCount = 0,
  summary = [],
  sirStockData = [],
  sirRanking = defaultRanking,
  companyName = '',
  isInitial = false,
  snapshotDiff,
}: HighlightProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const score = sirScore ?? 0;
  const prefix = isInitial ? '' : '전주 대비 ';

  return (
    <ReportSection icon={<WeeklyHighlightIcon />} title="주간 하이라이트">
      {/* Snapshot 카드 */}
      <ReportSubSection title="Snapshot">
        <div className="flex gap-7">
          <StatCard
            title="오늘의 SIR 지수"
            description="1,000점 만점 기준"
            value={`${Math.round(score)}점`}
            change={
              snapshotDiff
                ? formatChange(snapshotDiff.scoreDiff, '점', '상승', '하락', prefix)
                : undefined
            }
          />
          <StatCard
            title="SIR 순위"
            description={`총 참여 기업 ${sirRanking.total}개`}
            value={getSirTier(score)}
            change={
              snapshotDiff
                ? formatChange(snapshotDiff.tierDiff, '구간', '상승', '하락', prefix)
                : undefined
            }
          />
          <StatCard
            title="이번 주 스집된 평판 데이터 수"
            description="6개 채널 통합 수집"
            value={`${totalItems.toLocaleString()}개`}
            change={
              snapshotDiff
                ? formatChange(snapshotDiff.itemsDiff, '개', '증가', '감소', prefix)
                : undefined
            }
          />
          <StatCard
            title="이번 주 리스크 높은 콘텐츠 수"
            description="즉시 검토 권장"
            value={`${riskCount}개`}
            change={
              snapshotDiff
                ? formatChange(snapshotDiff.riskDiff, '개', '증가', '감소', prefix, true)
                : undefined
            }
          />
        </div>
      </ReportSubSection>

      {/* 이번 주 총평 */}
      <ReportSubSection title="이번 주 총평">
        <ReportCard px={70} py={50}>
          {summary && summary.length > 0 ? (
            <SummaryAccordion sections={summary} />
          ) : (
            <p className="text-sm text-slate-400">
              총평 데이터가 없습니다. 총평 생성을 실행해주세요.
            </p>
          )}
        </ReportCard>
      </ReportSubSection>

      {/* SIR 지수 & 주가 차트 */}
      <ReportSubSection title="SIR 지수 & 주가 지수">
        <ReportCard
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
      </ReportSubSection>

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
                  const max =
                    Math.ceil(Math.max(...sirRanking.tiers.map((t) => t.count), 1) / 5) * 5 || 5;
                  const ticks = Array.from({ length: max / 5 + 1 }, (_, i) => i * 5);
                  return { tickSize: 0, tickPadding: 5, tickValues: ticks };
                })()}
                valueScale={{
                  type: 'linear',
                  min: 0,
                  max: Math.ceil(Math.max(...sirRanking.tiers.map((t) => t.count), 1) / 5) * 5 || 5,
                }}
                enableGridY={false}
                enableGridX={true}
                gridXValues={(() => {
                  const max =
                    Math.ceil(Math.max(...sirRanking.tiers.map((t) => t.count), 1) / 5) * 5 || 5;
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
    </ReportSection>
  );
}
