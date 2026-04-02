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

import type { ChannelStat } from '@/lib/api/reportApi';

interface TrendPoint {
  date: string;
  ratio: number;
}

function sirDescription(sir: number): string {
  if (sir >= 801) return '매우 우호적인 여론 환경이에요';
  if (sir >= 601) return '우호적 여론이 우세한 상태예요';
  if (sir >= 401) return '여론이 혼재된 중립 구간이에요';
  if (sir >= 201) return '부정 여론에 대한 주의가 필요해요';
  return '여론 위기 관리가 시급한 상태예요';
}

function SirCard({
  label,
  sir,
  isInitial,
}: {
  label: string;
  sir: number;
  positive: number;
  negative: number;
  neutral: number;
  color: string;
  isInitial?: boolean;
}) {
  const sirColor = sir >= 610 ? 'text-emerald-600' : sir >= 410 ? 'text-amber-500' : 'text-red-500';
  const change = isInitial ? sir - 500 : 0;
  const changeLabel = isInitial ? '기준점 대비' : '전주 대비';
  const isUp = change >= 0;

  return (
    <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-1.5 shadow-[0_0_0_1px_rgba(241,245,249,1)]">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${sirColor}`}>{sir}점</span>
      <span className="text-[10px] text-slate-400 text-center">{sirDescription(sir)}</span>
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          change === 0 ? 'bg-slate-100 text-slate-500' : isUp ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
        }`}
      >
        {change === 0
          ? `${changeLabel} — 유지`
          : `${changeLabel} ${isUp ? '▲' : '▼'} ${Math.abs(change)}점 ${isUp ? '상승' : '하락'}`
        }
      </span>
    </div>
  );
}

export function SectionReputation({
  pdfMode = false,
  naverTrend = [],
  googleTrend = [],
  channelStats = [],
  isInitial = false,
}: {
  pdfMode?: boolean;
  naverTrend?: TrendPoint[];
  googleTrend?: TrendPoint[];
  channelStats?: ChannelStat[];
  isInitial?: boolean;
}) {
  const googleMap = new Map(googleTrend.map((t) => [t.date, t.ratio]));
  const chartData = naverTrend.map((t) => ({
    date: t.date,
    label: t.date.slice(5),
    네이버: t.ratio,
    구글: googleMap.get(t.date) ?? null,
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
        description="네이버·구글 기준 검색 관심도 추이를 확인하여 온라인 관심도 확대 여부를 파악합니다."
        tooltip="검색어 트렌드는 요청된 기간 중 검색 횟수가 가장 높은 시점을 100으로 두고 나머지는 상대적 값으로 제공하고 있습니다."
      >
        <div className={pdfMode ? 'h-48' : 'h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const [y, m, dd] = d.date.split('-');
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-md text-xs min-w-[160px]">
                      <p className="font-semibold text-slate-700 mb-1.5">
                        {y}.{Number(m)}.{Number(dd)}
                      </p>
                      {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-slate-600">{entry.name}</span>
                          <span className="font-semibold text-slate-700 ml-auto">
                            {entry.value}
                          </span>
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
              <Line
                type="monotone"
                dataKey="구글"
                stroke="#4285f4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#fff', stroke: '#4285f4', strokeWidth: 2 }}
                connectNulls
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
              data={channelStats}
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
                {channelStats.map((ch) => {
                  const total = channelStats.reduce((s, c) => s + c.value, 0);
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
        <div className="grid grid-cols-2 gap-3">
          {channelStats.map((ch) => (
            <SirCard
              key={ch.id}
              label={ch.label}
              sir={ch.sir}
              positive={ch.positive}
              negative={ch.negative}
              neutral={ch.neutral}
              color={ch.color}
              isInitial={isInitial}
            />
          ))}
        </div>
      </ReportCard>
    </section>
  );
}
