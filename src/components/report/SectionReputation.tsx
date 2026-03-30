'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ResponsivePie } from '@nivo/pie';
import { ReportCard } from '@/components/report/ReportCard';

interface TrendPoint {
  date: string;
  ratio: number;
}

const channelPieData = [
  { id: '뉴스', label: '뉴스', value: 119, color: '#6366f1' },
  { id: '블로그', label: '블로그', value: 850, color: '#38bdf8' },
  { id: '유튜브', label: '유튜브', value: 64, color: '#f43f5e' },
  { id: '종목토론방', label: '종목토론방', value: 792, color: '#22c55e' },
  { id: '디시인사이드', label: '디시인사이드', value: 13, color: '#f59e0b' },
];

const channelSirData = [
  {
    id: 'naver_news',
    label: '뉴스',
    sir: 21.0,
    positive: 67,
    negative: 33,
    neutral: 19,
    color: '#6366f1',
    change: -8,
  },
  {
    id: 'naver_blog',
    label: '블로그',
    sir: 50.0,
    positive: 281,
    negative: 10,
    neutral: 31,
    color: '#38bdf8',
    change: 12,
  },
  {
    id: 'youtube',
    label: '유튜브',
    sir: 50.0,
    positive: 31,
    negative: 5,
    neutral: 0,
    color: '#f43f5e',
    change: 5,
  },
  {
    id: 'naver_stock',
    label: '종토방',
    sir: 31.3,
    positive: 308,
    negative: 234,
    neutral: 249,
    color: '#22c55e',
    change: -3,
  },
  {
    id: 'dcinside',
    label: '디시인사이드',
    sir: 51.3,
    positive: 8,
    negative: 3,
    neutral: 2,
    color: '#f59e0b',
    change: 7,
  },
];

function sirDescription(sir: number): string {
  if (sir >= 81) return '긍정적 평판이 지배적입니다.';
  if (sir >= 61) return '긍정적 평판이 더 많습니다.';
  if (sir >= 41) return '긍정적/부정적 평판이 비슷한 수준입니다.';
  if (sir >= 21) return '부정적 평판이 더 많습니다.';
  return '부정적 평판이 지배적입니다.';
}

function SirCard({
  label,
  sir,
  change,
}: {
  label: string;
  sir: number;
  positive: number;
  negative: number;
  neutral: number;
  color: string;
  change: number;
}) {
  const sirColor = sir >= 61 ? 'text-emerald-600' : sir >= 41 ? 'text-amber-500' : 'text-red-500';
  const isUp = change >= 0;

  return (
    <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${sirColor}`}>{sir}점</span>
      <span className="text-[10px] text-slate-400 text-center">{sirDescription(sir)}</span>
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isUp ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
        }`}
      >
        전주 대비 {isUp ? '▲' : '▼'} {Math.abs(change)}점 {isUp ? '상승' : '하락'}
      </span>
    </div>
  );
}

export function SectionReputation({
  pdfMode = false,
  naverTrend = [],
}: {
  pdfMode?: boolean;
  naverTrend?: TrendPoint[];
}) {
  const chartData = naverTrend.map((t) => ({
    date: t.date,
    label: t.date.slice(5),
    네이버: t.ratio,
  }));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 shrink-0">온라인 평판 종합</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* 검색량 추이 */}
      <ReportCard
        title="최근 30일 기업명 키워드 검색 관심도 추이"
        description="네이버 기준 검색 관심도 추이를 확인하여 온라인 관심도 확대 여부를 파악합니다."
      >
        <div className={pdfMode ? 'h-48' : 'h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const [y, m, dd] = d.date.split('-');
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-md text-xs min-w-[160px]">
                      <p className="font-semibold text-slate-700 mb-1.5">{y}.{Number(m)}.{Number(dd)}</p>
                      {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                          <span className="text-slate-600">{entry.name}</span>
                          <span className="font-semibold text-slate-700 ml-auto">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="네이버"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#fff', stroke: '#22c55e', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      {/* 채널별 수집량 비중 */}
      <ReportCard
        title="채널별 데이터 수집량 비중"
        description="전체 수집 데이터 중 어떤 채널이 큰 비중을 차지하는지 파악할 수 있습니다."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className={pdfMode ? 'h-48' : 'h-64'}>
            <ResponsivePie
              data={channelPieData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.55}
              padAngle={1.5}
              cornerRadius={4}
              colors={{ datum: 'data.color' }}
              borderWidth={0}
              enableArcLinkLabels={false}
              arcLabel={(d) => `${d.id}`}
              arcLabelsSkipAngle={15}
              arcLabelsTextColor="#ffffff"
              theme={{
                labels: { text: { fontSize: 11, fontWeight: 600 } },
              }}
            />
          </div>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-400">채널명</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-400">수집량</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-400">비중</th>
                </tr>
              </thead>
              <tbody>
                {channelPieData.map((ch) => {
                  const total = channelPieData.reduce((s, c) => s + c.value, 0);
                  return (
                    <tr key={ch.id} className="border-b border-slate-50">
                      <td className="py-2.5 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className="text-slate-700">{ch.label}</span>
                      </td>
                      <td className="text-right text-slate-600">{ch.value.toLocaleString()}건</td>
                      <td className="text-right text-slate-400">
                        {((ch.value / total) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ReportCard>

      {/* 채널별 SIR 감정 지수 */}
      <ReportCard
        title="데이터 수집 채널별 SIR 감정 지수"
        description="각 채널에서 수집된 콘텐츠의 감성 분석 결과를 SIR 점수로 확인합니다."
      >
        <div className="grid grid-cols-3 gap-3 mb-3">
          {channelSirData.slice(0, 3).map((ch) => (
            <SirCard
              key={ch.id}
              label={ch.label}
              sir={ch.sir}
              positive={ch.positive}
              negative={ch.negative}
              neutral={ch.neutral}
              color={ch.color}
              change={ch.change}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {channelSirData.slice(3).map((ch) => (
            <SirCard
              key={ch.id}
              label={ch.label}
              sir={ch.sir}
              positive={ch.positive}
              negative={ch.negative}
              neutral={ch.neutral}
              color={ch.color}
              change={ch.change}
            />
          ))}
          <div />
        </div>
      </ReportCard>
    </section>
  );
}
