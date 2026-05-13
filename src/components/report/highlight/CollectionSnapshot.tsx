type Channel = 'news' | 'blog' | 'youtube' | 'community';

const CHANNELS: { name: string; key: Channel; color: string }[] = [
  { name: '뉴스', key: 'news', color: '#362cff' },
  { name: '블로그', key: 'blog', color: '#9747ff' },
  { name: '유튜브', key: 'youtube', color: '#ff0000' },
  { name: '커뮤니티', key: 'community', color: '#17d82d' },
];

interface CollectionSnapshotProps {
  channelToday: Record<Channel, number>;
  /** Daily 일 때만 — 평균 막대 tick + 평균 비교 텍스트 활성화. */
  channelAvg?: Record<Channel, number>;
  total: number;
  diff?: number;
  prefix: string;
  period: '일간' | '주간' | '월간';
  isNoData?: boolean;
}

export function CollectionSnapshot({
  channelToday,
  channelAvg,
  total,
  diff,
  prefix,
  period,
  isNoData,
}: CollectionSnapshotProps) {
  const totalAvg = channelAvg
    ? Object.values(channelAvg).reduce((s, v) => s + v, 0)
    : 0;
  const pctVsAvg = channelAvg && totalAvg > 0
    ? Math.round(((total - totalAvg) / totalAvg) * 100)
    : 0;

  const maxVal = Math.max(
    1,
    ...CHANNELS.flatMap((c) => [
      channelToday[c.key],
      channelAvg ? channelAvg[c.key] : 0,
    ]),
  );

  const d = diff ?? 0;
  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '─';
  const deltaTone = d > 0 ? 'text-text-green' : d < 0 ? 'text-text-danger' : 'text-text-muted';
  const deltaLabel = d > 0 ? '증가' : d < 0 ? '감소' : '동일';
  const showAvgCompare = !isNoData && !!channelAvg && totalAvg > 0;
  const showDiff = !isNoData && diff !== undefined;

  return (
    <article className="rounded-xl bg-white px-4 py-4 lg:px-5 lg:py-5 shadow-card min-h-[260px] flex flex-col">
      <p className="text-sm font-bold text-text-muted">{period} 수집 평판 데이터</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[36px] leading-none font-extrabold text-text-dark tabular-nums">
          {total}
        </span>
        <span className="text-xs font-bold text-text-muted">건</span>
      </div>
      <div className="mt-1.5 text-xs">
        {isNoData ? (
          <span className="text-text-muted">수집된 데이터 없음</span>
        ) : showAvgCompare ? (
          <>
            <span
              className={`font-bold ${pctVsAvg > 0 ? 'text-text-green' : pctVsAvg < 0 ? 'text-text-danger' : 'text-text-muted'}`}
            >
              {pctVsAvg > 0 ? '▲' : pctVsAvg < 0 ? '▼' : '─'} {Math.abs(pctVsAvg)}%
            </span>
            <span className="text-text-muted ml-1.5">7일 평균({totalAvg}건) 대비</span>
          </>
        ) : showDiff ? (
          <>
            <span className={`font-bold ${deltaTone}`}>
              {arrow} {Math.abs(d)}건
            </span>
            <span className="text-text-muted ml-1.5">{prefix}{deltaLabel}</span>
          </>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 pt-4 h-[172px]">
        {CHANNELS.map((c) => {
          const todayVal = channelToday[c.key];
          const avgVal = channelAvg?.[c.key];
          return (
            <div key={c.key}>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span className="font-bold text-text-dark">{c.name}</span>
                {avgVal !== undefined && (
                  <span className="ml-auto tabular-nums text-text-muted text-[11px]">
                    평균 {avgVal}
                  </span>
                )}
                <span
                  className={`tabular-nums font-extrabold text-text-dark w-8 text-right ${avgVal === undefined ? 'ml-auto' : ''}`}
                >
                  {todayVal}
                </span>
              </div>
              <div className="relative h-2 bg-bg-light rounded-full">
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{ width: `${(todayVal / maxVal) * 100}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
