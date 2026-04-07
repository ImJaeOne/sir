'use client';

import { PieChart, Pie, Cell } from 'recharts';

export function SirScoreDonut({
  score,
  icon,
  size = 60,
}: {
  score: number;
  icon: React.ReactNode;
  size?: number;
}) {
  const filled = Math.min(score, 1000);
  const data = [{ value: filled }, { value: 1000 - filled }];
  const center = size / 2;
  const outerRadius = center - 1;
  const innerRadius = outerRadius - Math.round(size * 0.07);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <defs>
          <linearGradient id={`sir-donut-gradient-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#66B6FF" />
            <stop offset="100%" stopColor="#362CFF" />
          </linearGradient>
        </defs>
        <Pie
          data={data}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
        >
          <Cell fill={`url(#sir-donut-gradient-${size})`} />
          <Cell fill="#e8f4ff" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
    </div>
  );
}
