'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { calculateDailySir } from '@/utils/sir';

interface SirChartItem {
  platform_id: string;
  sentiment: string | null;
  published_at: string | null;
}

interface StockPrice {
  date: string;
  close: number;
}

interface StockSirChartProps {
  stockPrices: StockPrice[];
  crawlItems: SirChartItem[];
}

export function StockSirChart({ stockPrices, crawlItems }: StockSirChartProps) {
  const chartData = useMemo(() => {
    const dailySir = calculateDailySir(crawlItems);

    // 최소~최대 날짜 사이 모든 날짜 생성
    const dateSources = [...stockPrices.map(p => p.date), ...Object.keys(dailySir)];
    if (dateSources.length === 0) return [];
    const minDate = dateSources.sort()[0];
    const maxDate = dateSources.sort().reverse()[0];

    const sorted: string[] = [];
    const d = new Date(minDate);
    const end = new Date(maxDate);
    while (d <= end) {
      sorted.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }

    const priceMap = new Map(stockPrices.map((p) => [p.date, p.close_price]));

    let lastSir: number | null = null;
    return sorted.map((date) => {
      if (dailySir[date] !== undefined) {
        lastSir = dailySir[date];
      }
      return {
        date,
        label: date.slice(5), // MM-DD
        price: priceMap.get(date) ?? null,
        sir: lastSir,
      };
    });
  }, [stockPrices, crawlItems]);

  if (chartData.length === 0) return null;

  const prices = chartData.filter((d) => d.price !== null).map((d) => d.price as number);
  const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices) * 0.97) : 0;
  const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices) * 1.03) : 10000;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-slate-700">주가 & SIR 지수 추이</h3>
      <div className="border border-slate-100 rounded-xl p-4 bg-white [&_svg]:outline-none">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              orientation="left"
              domain={[minPrice, maxPrice]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <YAxis
              yAxisId="sir"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
              formatter={(value: number | null, name: string) => {
                if (value == null) return ['—', name];
                if (name === '주가') return [`${value.toLocaleString()}원`, name];
                return [`${value}점`, name];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="주가"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Bar
              yAxisId="sir"
              dataKey="sir"
              name="SIR 지수"
              fill="#4ade80"
              opacity={0.5}
              barSize={12}
              radius={[3, 3, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
