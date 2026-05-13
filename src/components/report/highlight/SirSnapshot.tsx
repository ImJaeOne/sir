interface SirSnapshotProps {
  score: number;
  diff?: number;
  prefix: string;
  period: '일간' | '주간' | '월간';
  isNoData?: boolean;
}

export function SirSnapshot({ score, diff, prefix, period, isNoData }: SirSnapshotProps) {
  const maxScore = 1000;

  const cx = 140;
  const cy = 130;
  const r = 100;

  const phi = Math.PI * (Math.min(Math.max(score, 0), maxScore) / maxScore);
  const ex = cx - r * Math.cos(phi);
  const ey = cy - r * Math.sin(phi);

  const needleR = r - 18;
  const nx = cx - needleR * Math.cos(phi);
  const ny = cy - needleR * Math.sin(phi);

  const ticks = [0, 250, 500, 750, 1000];

  const showDiff = !isNoData && diff !== undefined;
  const d = diff ?? 0;
  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '─';
  const deltaTone = d > 0 ? 'text-text-green' : d < 0 ? 'text-text-danger' : 'text-text-muted';
  const deltaLabel = d > 0 ? '상승' : d < 0 ? '하락' : '유지';

  return (
    <article className="rounded-xl bg-white px-4 py-4 lg:px-5 lg:py-5 shadow-card min-h-[260px] flex flex-col">
      <p className="text-sm font-bold text-text-muted">{period} SIR 지수</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[36px] leading-none font-extrabold text-text-dark tabular-nums">
          {Math.round(score)}
        </span>
        <span className="text-xs font-bold text-text-muted">/ 1,000점</span>
      </div>
      <p className="mt-1.5 text-xs">
        {isNoData ? (
          <span className="text-text-muted">변동 없음</span>
        ) : showDiff ? (
          <>
            <span className={`font-bold ${deltaTone}`}>
              {arrow} {Math.abs(d)}점
            </span>
            <span className="text-text-muted ml-1.5">{prefix}{deltaLabel}</span>
          </>
        ) : null}
      </p>

      <div className="mt-auto pt-3 flex justify-center">
        <svg viewBox="0 0 280 160" className="w-full max-w-[280px]">
          {/* 그라데이션을 사용자 공간(viewBox) 기준으로 — progress path 가
              score 위치까지만 그려져도 색이 그 위치의 grad 색으로 자연 컷. */}
          <defs>
            <linearGradient
              id="sir-gauge-gradient"
              gradientUnits="userSpaceOnUse"
              x1={cx - r}
              y1={cy}
              x2={cx + r}
              y2={cy}
            >
              <stop offset="0%" style={{ stopColor: 'var(--color-bg-blue)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--color-text-accent)' }} />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="#eaeef5"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`}
            fill="none"
            stroke="url(#sir-gauge-gradient)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {ticks.map((t) => {
            const tphi = Math.PI * (t / maxScore);
            const tx = cx - (r + 20) * Math.cos(tphi);
            const ty = cy - (r + 20) * Math.sin(tphi);
            return (
              <text
                key={t}
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#828ea6"
                fontWeight="600"
              >
                {t === 1000 ? '1k' : t}
              </text>
            );
          })}

          <line
            x1={cx}
            y1={cy}
            x2={nx.toFixed(2)}
            y2={ny.toFixed(2)}
            stroke="#1f2838"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={7} fill="white" stroke="#1f2838" strokeWidth={2.5} />
        </svg>
      </div>
    </article>
  );
}
