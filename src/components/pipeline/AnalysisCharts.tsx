'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PLATFORMS, PLATFORM_CATEGORIES, CATEGORY_LABELS } from '@/constants/platforms';
import type { PlatformAnalysis } from '@/types/pipeline';

const COLORS = {
  positive: '#4ade80',
  neutral: '#94a3b8',
  negative: '#f87171',
};

interface AnalysisChartsProps {
  analysisData: PlatformAnalysis[];
}

function SentimentDonut({ data }: { data: PlatformAnalysis[] }) {
  const len = data.length;
  if (len === 0) return null;

  const sentiment = {
    positive: data.reduce((s, p) => s + p.positive, 0) / len,
    neutral: data.reduce((s, p) => s + p.neutral, 0) / len,
    negative: data.reduce((s, p) => s + p.negative, 0) / len,
  };

  const pieData = [
    { name: '긍정', value: sentiment.positive },
    { name: '중립', value: sentiment.neutral },
    { name: '부정', value: sentiment.negative },
  ];
  const colors = [COLORS.positive, COLORS.neutral, COLORS.negative];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-slate-500">종합 감성 분포</span>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            cursor="default"
            isAnimationActive={true}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${(value as number).toFixed(1)}%`}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 text-xs">
        {pieData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
            <span className="text-slate-500">
              {d.name} {d.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryScoreBar({ data }: { data: PlatformAnalysis[] }) {
  const barData = PLATFORM_CATEGORIES.map((category) => {
    const items = data.filter((p) => p.category === category);
    const score =
      items.length > 0
        ? parseFloat((items.reduce((sum, p) => sum + p.sirScore, 0) / items.length).toFixed(1))
        : 0;
    return { name: CATEGORY_LABELS[category] ?? category, score };
  });

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500">카테고리별 SIR 지수</span>
      <ResponsiveContainer width="100%" height={barData.length * 44 + 20}>
        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={60}
            tick={{ fontSize: 12, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#e0f2fe' }}
            formatter={(value) => [`${(value as number).toFixed(1)}점`, 'SIR 지수']}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20} cursor="default">
            {barData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.score >= 70 ? '#4ade80' : entry.score >= 50 ? '#facc15' : entry.score > 0 ? '#f87171' : '#e2e8f0'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlatformSentimentStack({ data }: { data: PlatformAnalysis[] }) {
  // 모든 플랫폼 표시 (데이터 없는 플랫폼은 0으로)
  const stackData = PLATFORMS.map((platform) => {
    const match = data.find((p) => p.platformId === platform.id || p.platformLabel === platform.label);
    return {
      name: platform.label.length > 6 ? platform.label.slice(0, 6) + '…' : platform.label,
      fullName: platform.label,
      긍정: match?.positive ?? 0,
      중립: match?.neutral ?? 0,
      부정: match?.negative ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-slate-500">플랫폼별 감성 분포</span>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={stackData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            width={30}
          />
          <Tooltip
            cursor={{ fill: '#e0f2fe' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const item = stackData.find((d) => d.name === label);
              const fullName = item?.fullName ?? label;
              return (
                <div
                  style={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    backgroundColor: '#fff',
                    padding: '8px 12px',
                  }}
                >
                  <p style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>{fullName}</p>
                  {payload.map((entry) => (
                    <div
                      key={entry.dataKey as string}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: entry.color,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ color: '#64748b' }}>{entry.dataKey as string}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{(entry.value as number).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
          />
          <Bar dataKey="긍정" stackId="sentiment" fill={COLORS.positive} barSize={24} cursor="default" />
          <Bar dataKey="중립" stackId="sentiment" fill={COLORS.neutral} barSize={24} cursor="default" />
          <Bar dataKey="부정" stackId="sentiment" fill={COLORS.negative} radius={[4, 4, 0, 0]} barSize={24} cursor="default" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalysisCharts({ analysisData }: AnalysisChartsProps) {
  return (
    <div className="flex flex-col gap-6 border border-slate-100 rounded-xl p-4 bg-white [&_svg]:outline-none [&_svg]:focus:outline-none">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SentimentDonut data={analysisData} />
        <CategoryScoreBar data={analysisData} />
      </div>
      <PlatformSentimentStack data={analysisData} />
    </div>
  );
}
