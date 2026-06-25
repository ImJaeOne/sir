import { cn } from '@/lib/utils';
import { REPORT_CHANNELS, type ReportChannel } from './channelMeta';

interface CollectionSnapshotProps {
  channelToday: Record<ReportChannel, number>;
  /** Daily 일 때만 — 평균 막대 tick + 평균 비교 텍스트 활성화. */
  channelAvg?: Record<ReportChannel, number>;
  total: number;
  diff?: number;
  prefix: string;
  period: '일간' | '주간' | '월간';
  isNoData?: boolean;
  onChannelClick?: (channel: ReportChannel) => void;
}

export function CollectionSnapshot({
  channelToday,
  channelAvg,
  total,
  diff,
  prefix,
  period,
  isNoData,
  onChannelClick,
}: CollectionSnapshotProps) {
  const totalAvg = channelAvg
    ? Object.values(channelAvg).reduce((s, v) => s + v, 0)
    : 0;
  const pctVsAvg = channelAvg && totalAvg > 0
    ? Math.round(((total - totalAvg) / totalAvg) * 100)
    : 0;

  const maxVal = Math.max(
    1,
    ...REPORT_CHANNELS.flatMap((c) => [
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

      <div className="mt-auto space-y-3 pt-4 h-[172px] overflow-visible">
        {REPORT_CHANNELS.map((c) => {
          const todayVal = channelToday[c.key];
          const avgVal = channelAvg?.[c.key];
          const hasContent = todayVal > 0;
          const interactive = !!onChannelClick && hasContent;
          const content = (
            <>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span
                  className={cn(
                    'font-bold inline-block origin-left transition-all duration-150',
                    hasContent ? 'text-text-dark' : 'text-text-muted/60',
                    interactive && 'group-hover:scale-110',
                  )}
                >
                  {c.name}
                </span>
                {avgVal !== undefined && (
                  <span className="ml-auto tabular-nums text-text-muted text-[11px]">
                    평균 {avgVal}
                  </span>
                )}
                <span
                  className={cn(
                    'tabular-nums font-extrabold w-8 text-right',
                    hasContent ? 'text-text-dark' : 'text-text-muted/60',
                    avgVal === undefined && 'ml-auto',
                  )}
                >
                  {todayVal}
                </span>
              </div>
              <div className="relative h-2 bg-bg-light rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-200"
                  style={{ width: `${(todayVal / maxVal) * 100}%`, backgroundColor: c.color }}
                />
              </div>
            </>
          );
          return (
            <button
              key={c.key}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (hasContent) onChannelClick?.(c.key);
              }}
              aria-label={`${c.name} 수집 데이터 보기`}
              className={cn(
                'group relative z-0 block w-full rounded-md text-left transition-transform duration-150',
                interactive
                  ? 'cursor-pointer hover:z-10 hover:-translate-y-0.5 hover:drop-shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300'
                  : 'cursor-default',
              )}
            >
              {content}
            </button>
          );
        })}
      </div>
    </article>
  );
}
