type CriticalType = 'defamation' | 'insult' | 'rumor' | 'spam';

// 색은 CollectionSnapshot 의 4 채널 팔레트(#362cff/#9747ff/#ff0000/#17d82d) 를
// risk type 4종에 1:1 매핑. 의미 매칭은 명예훼손=빨강(심각), 욕설=보라(자극),
// 루머=진파랑(불확실), 스팸=초록(노이즈).
const RISK_TYPES: { key: CriticalType; label: string; color: string }[] = [
  { key: 'defamation', label: '명예훼손', color: '#ff0000' },
  { key: 'insult', label: '욕설/비방', color: '#9747ff' },
  { key: 'rumor', label: '루머', color: '#362cff' },
  { key: 'spam', label: '스팸', color: '#17d82d' },
];

// 4 분면 중심 — pill 이 가로로 길어 가로 분리 넓힘, 세로는 cluster 느낌으로 좁힘.
const QUADRANTS: { x: number; y: number }[] = [
  { x: 30, y: 32 },
  { x: 70, y: 32 },
  { x: 70, y: 68 },
  { x: 30, y: 68 },
];

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface RiskSnapshotProps {
  typeCounts: Record<CriticalType, number>;
  total: number;
  diff?: number;
  prefix: string;
  period: '일간' | '주간' | '월간';
  isNoData?: boolean;
}

export function RiskSnapshot({ typeCounts, total, diff, prefix, period, isNoData }: RiskSnapshotProps) {
  const maxCount = Math.max(1, ...Object.values(typeCounts));
  const d = diff ?? 0;
  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '─';
  const deltaTone = d > 0 ? 'text-text-danger' : d < 0 ? 'text-text-green' : 'text-text-muted';
  const deltaLabel = d > 0 ? '증가' : d < 0 ? '감소' : '동일';
  const showDiff = !isNoData && diff !== undefined;

  const seed =
    typeCounts.defamation * 1009 +
    typeCounts.insult * 2017 +
    typeCounts.rumor * 3041 +
    typeCounts.spam * 4093 +
    total;
  const rand = mulberry32(seed || 1);
  const quadrantOrder = shuffle([0, 1, 2, 3], rand);
  // pill 폭 ~25% 라 가로 jitter 작게 ±4%, 세로 ±8%.
  const positions = RISK_TYPES.map((_, i) => {
    const q = QUADRANTS[quadrantOrder[i]];
    const jx = (rand() - 0.5) * 8;
    const jy = (rand() - 0.5) * 16;
    return { x: q.x + jx, y: q.y + jy };
  });

  return (
    <article className="rounded-xl bg-white px-4 py-4 lg:px-5 lg:py-5 shadow-card min-h-[260px] flex flex-col">
      <p className="text-sm font-bold text-text-muted">{period} 리스크 콘텐츠</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[36px] leading-none font-extrabold text-text-dark tabular-nums">
          {total}
        </span>
        <span className="text-xs font-bold text-text-muted">건</span>
      </div>
      <p className="mt-1.5 text-xs">
        {isNoData ? (
          <span className="text-text-muted">분석할 데이터 없음</span>
        ) : showDiff ? (
          <>
            <span className={`font-bold ${deltaTone}`}>
              {arrow} {Math.abs(d)}건
            </span>
            <span className="text-text-muted ml-1.5">{prefix}{deltaLabel}</span>
          </>
        ) : null}
      </p>

      <div className="mt-auto pt-4 relative w-full h-[172px]">
        {RISK_TYPES.map((t, i) => {
          const count = typeCounts[t.key];
          const ratio = count / maxCount;
          return (
            <div
              key={t.key}
              className="absolute rounded-full text-white shadow-card whitespace-nowrap px-3.5 py-1.5 flex items-baseline gap-1.5"
              style={{
                backgroundColor: t.color,
                left: `${positions[i].x}%`,
                top: `${positions[i].y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${13 + ratio * 2}px`,
              }}
            >
              <span className="font-bold">{t.label}</span>
              <span className="font-extrabold tabular-nums">{count}건</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
