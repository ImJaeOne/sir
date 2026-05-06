'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ComposedChart,
  AreaChart,
  BarChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import {
  useMonitoringDaily,
  useMonitoringStock,
  useMonitoringRisks,
  useMonitoringSearch,
} from '@/hooks/monitoring/useMonitoringQuery';
import {
  MONITORING_CHANNELS,
  CRITICAL_TYPES,
  type Channel,
  type CriticalType,
  type MonitoringDayPoint,
} from '@/lib/api/monitoringApi';
import { ChartCanvas } from '@/components/chart/ChartCanvas';

// ── color tokens ────────────────────────────────────────────────────────
const CHANNEL_COLOR: Record<Channel, string> = {
  news: '#2563eb',
  blog: '#10b981',
  youtube: '#ef4444',
  community: '#f59e0b',
};
const CRITICAL_COLOR: Record<CriticalType, string> = {
  defamation: '#7c3aed',
  insult: '#ec4899',
  rumor: '#f97316',
  spam: '#0ea5e9',
};
const SENTIMENT_COLOR = { pos: '#10b981', neu: '#94a3b8', neg: '#ef4444' };
const PRIMARY = '#2563eb';
const PRIMARY_SOFT = 'rgba(37, 99, 235, 0.08)';
const PRICE_LINE = '#0f172a';
// 한국 관습: 양봉(상승) red, 음봉(하락) blue
const CANDLE_UP = '#ef4444';
const CANDLE_DOWN = '#3b82f6';
const SEARCH_NAVER = '#03c75a';
const SEARCH_GOOGLE = '#4285f4';

function priceTickFormatter(v: number): string {
  if (v >= 10000) return `${Math.round(v / 1000)}k`;
  return v.toLocaleString();
}

// ── date utils (KST 기준) ──────────────────────────────────────────────

function kstTodayStr(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function shiftDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function diffDays(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00+09:00`).getTime();
  const e = new Date(`${end}T00:00:00+09:00`).getTime();
  return Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

function shortDate(s: string): string {
  if (!s || s.length < 10) return s;
  return `${parseInt(s.slice(5, 7), 10)}/${parseInt(s.slice(8, 10), 10)}`;
}

const PRESETS = [
  { id: 7, label: '7일' },
  { id: 30, label: '30일' },
  { id: 90, label: '90일' },
  { id: 180, label: '180일' },
  { id: 365, label: '1년' },
] as const;

// ── PAGE ────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) ?? '';
  const { data: workspace } = useWorkspace(workspaceId);

  const today = useMemo(() => kstTodayStr(), []);
  const [start, setStart] = useState(() => shiftDays(today, -89));
  const [end, setEnd] = useState(today);
  // 채널별 수집량+주가 콤보(D4)에서 켜고 끌 수 있는 채널 집합. 기본 전체 ON.
  const [visibleChannels, setVisibleChannels] = useState<Set<Channel>>(
    () => new Set(['news', 'blog', 'youtube', 'community'])
  );
  const toggleChannel = (id: Channel) => {
    setVisibleChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 직전 동기간 — KPI 비교용
  const range = diffDays(start, end);
  const prevEnd = shiftDays(start, -1);
  const prevStart = shiftDays(prevEnd, -(range - 1));

  const { data: daily = [], isPending: dailyLoading } = useMonitoringDaily(workspaceId, start, end);
  const { data: stock = [], isPending: stockLoading } = useMonitoringStock(workspaceId, start, end);
  const { data: risks = [], isPending: risksLoading } = useMonitoringRisks(workspaceId, start, end);
  const { data: search = [], isPending: searchLoading } = useMonitoringSearch(workspaceId, start, end);

  const { data: prevDaily = [] } = useMonitoringDaily(workspaceId, prevStart, prevEnd);
  const { data: prevRisks = [] } = useMonitoringRisks(workspaceId, prevStart, prevEnd);

  const isLoading = dailyLoading || stockLoading || risksLoading || searchLoading;

  // ── 머지: 전체 일자 축 (수집/주가/리스크/검색 모두 한 series 안에 두면 차트 정렬 안정) ──
  type MergedPoint = MonitoringDayPoint & {
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    risks: Record<CriticalType, number>;
    riskTotal: number;
    searchNaver: number | null;
    searchGoogle: number | null;
  };

  const merged: MergedPoint[] = useMemo(() => {
    const dailyMap = new Map(daily.map((d) => [d.date, d]));
    const stockMap = new Map(stock.map((d) => [d.date, d]));
    const riskMap = new Map(risks.map((d) => [d.date, d]));
    const searchMap = new Map(search.map((d) => [d.date, d]));
    const allDates = new Set<string>([
      ...daily.map((d) => d.date),
      ...stock.map((d) => d.date),
      ...risks.map((d) => d.date),
      ...search.map((d) => d.date),
    ]);
    return Array.from(allDates)
      .sort()
      .map((date) => {
        const d = dailyMap.get(date);
        const s = stockMap.get(date);
        const r = riskMap.get(date);
        const sr = searchMap.get(date);
        return {
          date,
          isCarried: d?.isCarried ?? false,
          channelVolume: d?.channelVolume ?? { news: 0, blog: 0, youtube: 0, community: 0 },
          totalVolume: d?.totalVolume ?? 0,
          positive: d?.positive ?? 0,
          neutral: d?.neutral ?? 0,
          negative: d?.negative ?? 0,
          open: s?.open ?? null,
          high: s?.high ?? null,
          low: s?.low ?? null,
          close: s?.close ?? null,
          risks: r?.byType ?? { defamation: 0, insult: 0, rumor: 0, spam: 0 },
          riskTotal: r?.total ?? 0,
          searchNaver: sr?.naver ?? null,
          searchGoogle: sr?.google ?? null,
        };
      });
  }, [daily, stock, risks, search]);

  // ── KPI ─────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalVol = daily.reduce((s, d) => s + d.totalVolume, 0);
    const prevVol = prevDaily.reduce((s, d) => s + d.totalVolume, 0);
    const volDelta = totalVol - prevVol;

    const totalNeg = daily.reduce((s, d) => s + d.negative, 0);
    const totalAll = daily.reduce((s, d) => s + d.positive + d.neutral + d.negative, 0);
    const negPct = totalAll > 0 ? Math.round((totalNeg / totalAll) * 100) : 0;
    const prevNeg = prevDaily.reduce((s, d) => s + d.negative, 0);
    const prevAll = prevDaily.reduce((s, d) => s + d.positive + d.neutral + d.negative, 0);
    const prevNegPct = prevAll > 0 ? Math.round((prevNeg / prevAll) * 100) : 0;
    const negDelta = negPct - prevNegPct;

    const totalRisks = risks.reduce((s, d) => s + d.total, 0);
    const prevTotalRisks = prevRisks.reduce((s, d) => s + d.total, 0);
    const riskDelta = totalRisks - prevTotalRisks;

    const stockSorted = stock.filter((s) => s.close != null);
    const lastClose = stockSorted[stockSorted.length - 1]?.close ?? null;
    const firstClose = stockSorted[0]?.close ?? null;
    const priceDeltaPct =
      firstClose && lastClose ? ((lastClose - firstClose) / firstClose) * 100 : null;

    return {
      totalVol,
      volDelta,
      negPct,
      negDelta,
      totalRisks,
      riskDelta,
      lastClose,
      priceDeltaPct,
    };
  }, [daily, prevDaily, risks, prevRisks, stock]);

  // ── 감정 비율 시계열 (스택 area 용) ────────────────────────────────
  // pos/neg 를 독립 반올림하면 합이 99~101 이 될 수 있어 Y축이 101% 까지 늘어나므로,
  // pos·neg 만 round 하고 neutral 은 차감으로 산정해 합 = 100 보장.
  const sentimentSeries = useMemo(
    () =>
      merged.map((d) => {
        const t = d.positive + d.neutral + d.negative;
        if (!t) return { date: d.date, positive: 0, neutral: 0, negative: 0, totalVolume: 0 };
        let pos = Math.round((d.positive / t) * 100);
        let neg = Math.round((d.negative / t) * 100);
        if (pos + neg > 100) {
          if (pos >= neg) pos = 100 - neg;
          else neg = 100 - pos;
        }
        const neu = 100 - pos - neg;
        return { date: d.date, positive: pos, neutral: neu, negative: neg, totalVolume: t };
      }),
    [merged],
  );

  const handlePreset = (days: number) => {
    setEnd(today);
    setStart(shiftDays(today, -(days - 1)));
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="mx-auto w-full max-w-[1240px] px-4 lg:px-10 py-7 lg:py-10 flex flex-col gap-7">

        {/* 헤더 ─────────────────────────────────────────── */}
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Activity size={13} className="text-slate-300" />
            <span>SIR · Monitoring</span>
          </div>
          <h1 className="text-[26px] lg:text-[28px] font-bold tracking-[-0.02em] text-slate-900 leading-[1.2]">
            {workspace?.company_name ?? '워크스페이스'} 모니터링
          </h1>
          <p className="text-[13px] text-slate-500 leading-[1.6] max-w-[860px]">
            일자별 누적 데이터 기반 시계열 추이입니다. 좌측 날짜를 직접 선택하거나 우측 프리셋을 눌러 기간을 바꿀 수 있고,
            모든 KPI 는 같은 길이의 직전 기간과 비교해 보여줍니다.
          </p>
        </header>

        {/* 날짜 선택 + 프리셋 ───────────────────────────── */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 px-4 lg:px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={15} />
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase">기간</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <DateInput value={start} max={end} onChange={setStart} aria-label="시작일" />
            <span className="text-slate-300">—</span>
            <DateInput value={end} min={start} max={today} onChange={setEnd} aria-label="종료일" />
            <span className="text-[11px] text-slate-400 tabular-nums ml-1">{range}일</span>
          </div>
          <div className="flex items-center gap-1 lg:ml-auto flex-wrap">
            {PRESETS.map((p) => {
              const active = range === p.id && end === today;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePreset(p.id)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer tracking-[-0.005em] ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard
            icon={<MessageSquare size={14} />}
            label="총 수집량"
            value={kpi.totalVol.toLocaleString()}
            unit="건"
            delta={kpi.volDelta}
            tone="default"
            sub={`직전 ${range}일 대비`}
            loading={isLoading}
          />
          <KpiCard
            icon={<Activity size={14} />}
            label="현재 주가"
            value={kpi.lastClose != null ? kpi.lastClose.toLocaleString() : '—'}
            unit="원"
            deltaText={
              kpi.priceDeltaPct == null
                ? null
                : `${kpi.priceDeltaPct >= 0 ? '+' : ''}${kpi.priceDeltaPct.toFixed(2)}%`
            }
            deltaTone={kpi.priceDeltaPct == null ? 'neutral' : kpi.priceDeltaPct >= 0 ? 'up' : 'down'}
            sub={`기간 시작 대비`}
            loading={isLoading}
          />
          <KpiCard
            icon={<TrendingDown size={14} />}
            label="부정 여론"
            value={kpi.negPct.toString()}
            unit="%"
            delta={kpi.negDelta}
            deltaSuffix="%p"
            invertDeltaTone
            tone={kpi.negPct >= 30 ? 'danger' : 'default'}
            sub={`직전 ${range}일 대비`}
            loading={isLoading}
          />
          <KpiCard
            icon={<AlertTriangle size={14} />}
            label="리스크 콘텐츠"
            value={kpi.totalRisks.toString()}
            unit="건"
            delta={kpi.riskDelta}
            invertDeltaTone
            tone={kpi.totalRisks > 0 ? 'warn' : 'default'}
            sub={`직전 ${range}일 대비`}
            loading={isLoading}
          />
        </div>

        {/* 차트 — 모두 full-width 로 쌓아서 시계열 흐름 비교를 쉽게 */}
        {(() => {
          const barSize = range >= 180 ? 2 : range >= 90 ? 4 : 8;
          const sharedXAxis = (
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={32}
            />
          );
          const priceMin = Math.min(...merged.filter((d) => d.low != null).map((d) => d.low as number), Infinity);
          const priceMax = Math.max(...merged.filter((d) => d.high != null).map((d) => d.high as number), -Infinity);
          const priceDomain: [number | string, number | string] =
            isFinite(priceMin) && isFinite(priceMax)
              ? [Math.floor(priceMin * 0.98), Math.ceil(priceMax * 1.02)]
              : ['auto', 'auto'];
          const hasPrice = merged.some((d) => d.close != null);
          const hasSearch = merged.some((d) => d.searchNaver != null || d.searchGoogle != null);

          return (
            <div className="flex flex-col gap-4">

              {/* ── A. 주가 동조성 ─────────────────────────────────────── */}
              <SectionLabel>A · 주가와 수집량</SectionLabel>

              {/* A1. 주가-라인 + 수집량-막대 (현재) */}
              <ChartCard
                title="주가 + 수집량 (라인 · 막대)"
                subtitle="좌축 막대 = 일자별 수집량, 우축 라인 = 주가 종가"
                loading={isLoading}
                empty={merged.length === 0}
              >
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="volBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<PriceVolumeTooltip />} />
                      <Bar yAxisId="vol" dataKey="totalVolume" name="수집량" fill="url(#volBar)" isAnimationActive={false} barSize={barSize} />
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: PRIMARY, label: '수집량 (좌, 건)', soft: true },
                    { color: PRICE_LINE, label: '주가 종가 (우, 원)' },
                  ]}
                />
              </ChartCard>

              {/* A2. 주가-라인 + 수집량-라인 */}
              <ChartCard
                title="주가 + 수집량 (라인 · 라인)"
                subtitle="둘 다 라인으로 표시 — 등락 흐름 비교"
                loading={isLoading}
                empty={merged.length === 0}
              >
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<PriceVolumeTooltip />} />
                      <Line yAxisId="vol" type="monotone" dataKey="totalVolume" name="수집량" stroke={PRIMARY} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: PRIMARY, label: '수집량 (좌, 건)' },
                    { color: PRICE_LINE, label: '주가 종가 (우, 원)' },
                  ]}
                />
              </ChartCard>

              {/* A3. 주가-캔들 + 수집량-라인 */}
              <ChartCard
                title="주가 + 수집량 (캔들 · 라인)"
                subtitle="OHLC 캔들 + 수집량 라인. 빨강=상승 / 파랑=하락"
                loading={isLoading}
                empty={!hasPrice}
              >
                <div className="h-[300px]">
                  <ChartCanvas width="105%">
                    <ComposedChart data={merged} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} yAxisId="price" />
                      {sharedXAxis}
                      <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<PriceVolumeTooltip />} />
                      <Line yAxisId="vol" type="monotone" dataKey="totalVolume" name="수집량" stroke={PRIMARY} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                      <Bar
                        yAxisId="price"
                        dataKey="high"
                        name="주가"
                        fill="transparent"
                        barSize={Math.max(barSize * 1.5, 4)}
                        isAnimationActive={false}
                        shape={(props) => <CandleBar {...props} priceMin={priceDomain[0] as number} priceMax={priceDomain[1] as number} />}
                      />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: PRIMARY, label: '수집량 (좌, 건)' },
                    { color: CANDLE_UP, label: '주가 상승 (우)' },
                    { color: CANDLE_DOWN, label: '주가 하락 (우)' },
                  ]}
                />
              </ChartCard>

              {/* ── B. 감정 추세 ─────────────────────────────────────── */}
              <SectionLabel>B · 감정 추세</SectionLabel>

              {/* B1. 감정 분포 stacked area */}
              <ChartCard
                title="감정 분포 추이"
                subtitle="긍정 · 중립 · 부정 비중 (%)"
                loading={isLoading}
                empty={sentimentSeries.every((d) => d.totalVolume === 0)}
              >
                <div className="h-[280px]">
                  <ChartCanvas>
                    <AreaChart data={sentimentSeries} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.pos} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.pos} stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.neu} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.neu} stopOpacity={0.08} />
                        </linearGradient>
                        <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.neg} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.neg} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<PercentTooltip />} />
                      <Area type="monotone" dataKey="positive" name="긍정" stackId="s" stroke={SENTIMENT_COLOR.pos} strokeWidth={1.4} fill="url(#gPos)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="neutral" name="중립" stackId="s" stroke={SENTIMENT_COLOR.neu} strokeWidth={1.4} fill="url(#gNeu)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="negative" name="부정" stackId="s" stroke={SENTIMENT_COLOR.neg} strokeWidth={1.4} fill="url(#gNeg)" isAnimationActive={false} />
                    </AreaChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: SENTIMENT_COLOR.pos, label: '긍정' },
                    { color: SENTIMENT_COLOR.neu, label: '중립' },
                    { color: SENTIMENT_COLOR.neg, label: '부정' },
                  ]}
                />
              </ChartCard>

              {/* B2. 감정 분포(면) + 주가-라인 — tooltip 종가 */}
              <ChartCard
                title="감정 분포 + 주가"
                subtitle="여론 비중 변화와 주가 추세를 겹쳐 본다"
                loading={isLoading}
                empty={sentimentSeries.every((d) => d.totalVolume === 0)}
              >
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged.map((d, i) => ({ ...d, ...sentimentSeries[i] }))} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gPos2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.pos} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.pos} stopOpacity={0.08} />
                        </linearGradient>
                        <linearGradient id="gNeu2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.neu} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.neu} stopOpacity={0.06} />
                        </linearGradient>
                        <linearGradient id="gNeg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SENTIMENT_COLOR.neg} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={SENTIMENT_COLOR.neg} stopOpacity={0.08} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="sent" orientation="left" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<SentimentPriceTooltip />} />
                      <Area yAxisId="sent" type="monotone" dataKey="positive" name="긍정" stackId="s" stroke={SENTIMENT_COLOR.pos} strokeWidth={1.2} fill="url(#gPos2)" isAnimationActive={false} />
                      <Area yAxisId="sent" type="monotone" dataKey="neutral" name="중립" stackId="s" stroke={SENTIMENT_COLOR.neu} strokeWidth={1.2} fill="url(#gNeu2)" isAnimationActive={false} />
                      <Area yAxisId="sent" type="monotone" dataKey="negative" name="부정" stackId="s" stroke={SENTIMENT_COLOR.neg} strokeWidth={1.2} fill="url(#gNeg2)" isAnimationActive={false} />
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: SENTIMENT_COLOR.pos, label: '긍정' },
                    { color: SENTIMENT_COLOR.neu, label: '중립' },
                    { color: SENTIMENT_COLOR.neg, label: '부정' },
                    { color: PRICE_LINE, label: '주가 종가 (우)' },
                  ]}
                />
              </ChartCard>

              {/* ── C. 검색 관심도 ─────────────────────────────────────── */}
              <SectionLabel>C · 검색 관심도</SectionLabel>

              {/* C1. 주가-라인 + 검색 관심도-라인 */}
              <ChartCard
                title="주가 + 검색 관심도 (라인 · 라인)"
                subtitle="네이버 / 구글 검색 트렌드(0–100 상대지수)와 주가 추세 비교"
                loading={isLoading}
                empty={!hasSearch}
              >
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="srch" orientation="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<SearchPriceTooltip />} />
                      <Line yAxisId="srch" type="monotone" dataKey="searchNaver" name="네이버" stroke={SEARCH_NAVER} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                      <Line yAxisId="srch" type="monotone" dataKey="searchGoogle" name="구글" stroke={SEARCH_GOOGLE} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: SEARCH_NAVER, label: '네이버 (좌)' },
                    { color: SEARCH_GOOGLE, label: '구글 (좌)' },
                    { color: PRICE_LINE, label: '주가 종가 (우)' },
                  ]}
                />
              </ChartCard>

              {/* C2. 주가-캔들 + 검색 관심도-라인 */}
              <ChartCard
                title="주가 + 검색 관심도 (캔들 · 라인)"
                subtitle="OHLC 캔들 + 검색 관심도 라인"
                loading={isLoading}
                empty={!hasPrice && !hasSearch}
              >
                <div className="h-[300px]">
                  <ChartCanvas width="105%">
                    <ComposedChart data={merged} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} yAxisId="price" />
                      {sharedXAxis}
                      <YAxis yAxisId="srch" orientation="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<SearchPriceTooltip />} />
                      <Line yAxisId="srch" type="monotone" dataKey="searchNaver" name="네이버" stroke={SEARCH_NAVER} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                      <Line yAxisId="srch" type="monotone" dataKey="searchGoogle" name="구글" stroke={SEARCH_GOOGLE} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                      <Bar
                        yAxisId="price"
                        dataKey="high"
                        name="주가"
                        fill="transparent"
                        barSize={Math.max(barSize * 1.5, 4)}
                        isAnimationActive={false}
                        shape={(props) => <CandleBar {...props} priceMin={priceDomain[0] as number} priceMax={priceDomain[1] as number} />}
                      />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: SEARCH_NAVER, label: '네이버 (좌)' },
                    { color: SEARCH_GOOGLE, label: '구글 (좌)' },
                    { color: CANDLE_UP, label: '주가 상승 (우)' },
                    { color: CANDLE_DOWN, label: '주가 하락 (우)' },
                  ]}
                />
              </ChartCard>

              {/* ── D. 리스크 & 채널 ─────────────────────────────────────── */}
              <SectionLabel>D · 리스크 & 채널</SectionLabel>

              {/* D1. 리스크 + 주가-라인 (NEW 추가 제안) */}
              <ChartCard
                title="리스크 발생 + 주가"
                subtitle="critical_type 별 리스크가 주가를 흔드는지 동조성 확인"
                loading={isLoading}
                empty={merged.every((d) => d.riskTotal === 0)}
              >
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="risk" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.06)' }} content={<RiskPriceTooltip />} />
                      {CRITICAL_TYPES.map((c) => (
                        <Bar
                          key={c.id}
                          yAxisId="risk"
                          dataKey={(d: MergedPoint) => d.risks[c.id] ?? 0}
                          name={c.label}
                          stackId="risk"
                          fill={CRITICAL_COLOR[c.id]}
                          isAnimationActive={false}
                          barSize={barSize}
                        />
                      ))}
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    ...CRITICAL_TYPES.map((c) => ({ color: CRITICAL_COLOR[c.id], label: c.label })),
                    { color: PRICE_LINE, label: '주가 종가 (우)' },
                  ]}
                />
              </ChartCard>

              {/* D2. 리스크 발생 단독 (현재 유지) */}
              <ChartCard
                title="리스크 발생 (단독)"
                subtitle="critical_type 별 일자 건수"
                loading={isLoading}
                empty={merged.every((d) => d.riskTotal === 0)}
              >
                <div className="h-[260px]">
                  <ChartCanvas>
                    <BarChart data={merged} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(239, 68, 68, 0.06)' }} content={<RiskTooltip />} />
                      {CRITICAL_TYPES.map((c) => (
                        <Bar
                          key={c.id}
                          dataKey={(d: MergedPoint) => d.risks[c.id] ?? 0}
                          name={c.label}
                          stackId="risk"
                          fill={CRITICAL_COLOR[c.id]}
                          isAnimationActive={false}
                          barSize={barSize}
                        />
                      ))}
                    </BarChart>
                  </ChartCanvas>
                </div>
                <ChartLegend items={CRITICAL_TYPES.map((c) => ({ color: CRITICAL_COLOR[c.id], label: c.label }))} />
              </ChartCard>

              {/* D3. 채널별 수집량 단독 */}
              <ChartCard
                title="채널별 수집량 (단독)"
                subtitle="뉴스 · 블로그 · 유튜브 · 커뮤니티 일자 누적"
                loading={isLoading}
                empty={merged.every((d) => d.totalVolume === 0)}
              >
                <div className="h-[260px]">
                  <ChartCanvas>
                    <BarChart data={merged} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<VolumeTooltip />} />
                      {MONITORING_CHANNELS.map((c) => (
                        <Bar
                          key={c.id}
                          dataKey={(d: MergedPoint) => d.channelVolume[c.id]}
                          name={c.label}
                          stackId="vol"
                          fill={CHANNEL_COLOR[c.id]}
                          isAnimationActive={false}
                          barSize={barSize}
                        />
                      ))}
                    </BarChart>
                  </ChartCanvas>
                </div>
                <ChartLegend items={MONITORING_CHANNELS.map((c) => ({ color: CHANNEL_COLOR[c.id], label: c.label }))} />
              </ChartCard>

              {/* D3.5 채널별 수집량 + 주가 (채널 토글) */}
              <ChartCard
                title="채널별 수집량 + 주가"
                subtitle="채널을 켜고 끄며 어느 채널이 주가와 동조하는지 본다"
                loading={isLoading}
                empty={merged.every((d) => d.totalVolume === 0)}
              >
                {/* 채널 토글 칩 */}
                <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                  {MONITORING_CHANNELS.map((c) => {
                    const on = visibleChannels.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChannel(c.id)}
                        aria-pressed={on}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          on
                            ? 'border-transparent text-white'
                            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
                        }`}
                        style={on ? { backgroundColor: CHANNEL_COLOR[c.id] } : undefined}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: on ? '#fff' : CHANNEL_COLOR[c.id], opacity: on ? 0.9 : 0.7 }}
                        />
                        {c.label}
                      </button>
                    );
                  })}
                  {visibleChannels.size === 0 && (
                    <span className="text-[11px] text-slate-400 ml-1">표시할 채널을 선택하세요</span>
                  )}
                </div>
                <div className="h-[300px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="price" orientation="right" tickFormatter={priceTickFormatter} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} domain={priceDomain} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<ChannelPriceTooltip visibleChannels={visibleChannels} />} />
                      {MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id)).map((c) => (
                        <Bar
                          key={c.id}
                          yAxisId="vol"
                          dataKey={(d: MergedPoint) => d.channelVolume[c.id]}
                          name={c.label}
                          stackId="vol"
                          fill={CHANNEL_COLOR[c.id]}
                          isAnimationActive={false}
                          barSize={barSize}
                        />
                      ))}
                      <Line yAxisId="price" type="monotone" dataKey="close" name="종가" stroke={PRICE_LINE} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    ...MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id)).map((c) => ({
                      color: CHANNEL_COLOR[c.id],
                      label: c.label,
                    })),
                    { color: PRICE_LINE, label: '주가 종가 (우)' },
                  ]}
                />
              </ChartCard>

              {/* D4. 수집량 + 검색 관심도 (NEW 추가 제안) */}
              <ChartCard
                title="수집량 + 검색 관심도"
                subtitle="외부 신호(검색)와 내부 신호(수집)의 동조·괴리"
                loading={isLoading}
                empty={!hasSearch && merged.every((d) => d.totalVolume === 0)}
              >
                <div className="h-[280px]">
                  <ChartCanvas>
                    <ComposedChart data={merged} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="volBar2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      {sharedXAxis}
                      <YAxis yAxisId="vol" orientation="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="srch" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<VolumeSearchTooltip />} />
                      <Bar yAxisId="vol" dataKey="totalVolume" name="수집량" fill="url(#volBar2)" isAnimationActive={false} barSize={barSize} />
                      <Line yAxisId="srch" type="monotone" dataKey="searchNaver" name="네이버" stroke={SEARCH_NAVER} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                      <Line yAxisId="srch" type="monotone" dataKey="searchGoogle" name="구글" stroke={SEARCH_GOOGLE} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ChartCanvas>
                </div>
                <ChartLegend
                  items={[
                    { color: PRIMARY, label: '수집량 (좌, 건)', soft: true },
                    { color: SEARCH_NAVER, label: '네이버 (우)' },
                    { color: SEARCH_GOOGLE, label: '구글 (우)' },
                  ]}
                />
              </ChartCard>

            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ── shared subcomponents ────────────────────────────────────────────────

function DateInput({
  value,
  onChange,
  min,
  max,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'type'>) {
  return (
    <input
      type="date"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        if (!e.target.value) return;
        onChange(e.target.value);
      }}
      className="text-[12px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all tabular-nums cursor-pointer"
      {...rest}
    />
  );
}

function KpiCard({
  icon,
  label,
  value,
  unit,
  delta,
  deltaText,
  deltaSuffix,
  deltaTone,
  invertDeltaTone,
  tone,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaText?: string | null;
  deltaSuffix?: string;
  deltaTone?: 'up' | 'down' | 'neutral';
  invertDeltaTone?: boolean;
  tone?: 'default' | 'warn' | 'danger';
  sub?: string;
  loading?: boolean;
}) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white'
      : tone === 'danger'
        ? 'border-red-200/80 bg-gradient-to-br from-red-50/50 to-white'
        : 'border-slate-200/80 bg-white';

  // deltaTone 자동 결정 (delta 가 number 일 때)
  let resolvedTone: 'up' | 'down' | 'neutral' = deltaTone ?? 'neutral';
  if (delta !== undefined && deltaTone === undefined) {
    if (delta > 0) resolvedTone = invertDeltaTone ? 'down' : 'up';
    else if (delta < 0) resolvedTone = invertDeltaTone ? 'up' : 'down';
  }

  const deltaColor =
    resolvedTone === 'up'
      ? 'text-emerald-600'
      : resolvedTone === 'down'
        ? 'text-red-500'
        : 'text-slate-400';

  const renderedDelta =
    deltaText !== undefined
      ? deltaText
      : delta !== undefined
        ? delta === 0
          ? '변동 없음'
          : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}${deltaSuffix ?? ''}`
        : null;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-2.5 min-h-[140px] ${toneClass} shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
    >
      <div className="flex items-center gap-2 text-slate-400">
        <span>{icon}</span>
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase">{label}</span>
      </div>
      {loading ? (
        <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-[34px] font-bold tracking-[-0.025em] leading-[1] tabular-nums text-slate-900">
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
        </div>
      )}
      <div className="mt-auto flex flex-col gap-0.5">
        {renderedDelta != null && !loading && (
          <div className={`text-[12px] font-bold flex items-center gap-1 ${deltaColor}`}>
            {resolvedTone === 'up' ? (
              <TrendingUp size={11} />
            ) : resolvedTone === 'down' ? (
              <TrendingDown size={11} />
            ) : (
              <Minus size={11} />
            )}
            <span className="tabular-nums">{renderedDelta}</span>
          </div>
        )}
        {sub && <div className="text-[11px] text-slate-400 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  loading,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 lg:p-6 flex flex-col gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[14px] font-bold text-slate-900 tracking-[-0.005em] m-0">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 m-0 leading-[1.55]">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="h-[260px] rounded-xl bg-slate-50 animate-pulse" />
      ) : empty ? (
        <div className="h-[260px] flex items-center justify-center text-[12px] text-slate-400">
          이 기간에 표시할 데이터가 없습니다
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-2 first:mt-0">
      <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500">
        {children}
      </span>
      <div className="flex-1 h-px bg-slate-200/70" />
    </div>
  );
}

interface CandleBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { open?: number | null; close?: number | null; high?: number | null; low?: number | null };
  priceMin: number;
  priceMax: number;
}

/** 캔들 shape — recharts Bar 의 shape prop. recharts 가 high(=dataKey) 를 기준으로
 *  바 좌표를 계산해 주므로, 그 좌표 + 바 높이에서 priceMin/priceMax 로 OHLC 위치 역산. */
function CandleBar(props: CandleBarProps) {
  const { x, y, width, height, payload, priceMin, priceMax } = props;
  if (
    x == null || y == null || width == null || height == null ||
    !payload?.open || !payload.close || !payload.high || !payload.low
  ) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? CANDLE_UP : CANDLE_DOWN;

  const barTop = y;
  const barBottom = y + height;
  const fullRange = priceMax - priceMin;
  const priceRange = high - priceMin;
  const priceToY = (val: number) => {
    if (fullRange <= 0 || priceRange <= 0) return barBottom;
    const ratio = (val - priceMin) / fullRange;
    return barBottom - ratio * (barBottom - barTop) * (fullRange / priceRange);
  };

  const bodyTop = priceToY(Math.max(open, close));
  const bodyBottom = priceToY(Math.min(open, close));
  const bodyH = Math.max(bodyBottom - bodyTop, 1.5);
  const wickTop = priceToY(high);
  const wickBottom = priceToY(low);
  const cx = x + width / 2;

  return (
    <g>
      <line x1={cx} y1={wickTop} x2={cx} y2={wickBottom} stroke={color} strokeWidth={1} />
      <rect x={x + width * 0.15} y={bodyTop} width={width * 0.7} height={bodyH} fill={color} rx={1} />
    </g>
  );
}

function ChartLegend({ items }: { items: { color: string; label: string; soft?: boolean }[] }) {
  return (
    <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 flex-wrap">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: it.color, opacity: it.soft ? 0.55 : 1 }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── tooltips ────────────────────────────────────────────────────────────

interface TipPayload {
  name?: string;
  value?: number;
  color?: string;
  payload?: {
    isCarried?: boolean;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    totalVolume?: number;
    [k: string]: unknown;
  };
}

function TooltipShell({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-3.5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.10)] min-w-[180px]">
      <p className="text-[11px] font-bold tracking-[0.04em] text-slate-400 m-0 mb-2 tabular-nums">
        {label?.replace(/-/g, '.')}
      </p>
      {children}
    </div>
  );
}

function TooltipRow({
  color,
  label,
  value,
  bold,
}: {
  color?: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-0.5">
      {color && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
      <span className="text-[12px] text-slate-500">{label}</span>
      <span
        className={`ml-auto text-[12px] tabular-nums ${bold ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}
      >
        {value}
      </span>
    </div>
  );
}

function PriceVolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const hasPrice = d.close != null && d.open != null;
  const upDay = hasPrice && (d.close ?? 0) >= (d.open ?? 0);
  return (
    <TooltipShell label={label}>
      {hasPrice ? (
        <>
          <TooltipRow color="#0f172a" label="종가" value={`${d.close!.toLocaleString()}원`} bold />
          <div className="grid grid-cols-2 gap-x-3 mt-1 mb-1.5 text-[11px] text-slate-400">
            <span>시 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.open!.toLocaleString()}</span></span>
            {d.high != null && (
              <span>고 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.high.toLocaleString()}</span></span>
            )}
            {d.low != null && (
              <span>저 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.low.toLocaleString()}</span></span>
            )}
            <span className={upDay ? 'text-red-500' : 'text-blue-500'}>
              {upDay ? '▲' : '▼'} {Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%
            </span>
          </div>
        </>
      ) : (
        <div className="text-[12px] text-slate-400 mb-2">주가 데이터 없음</div>
      )}
      <div className="border-t border-slate-100 pt-2">
        <TooltipRow color={PRIMARY} label="수집량" value={`${(d.totalVolume ?? 0).toLocaleString()}건`} />
      </div>
      {d.isCarried && (
        <p className="text-[10px] text-amber-600 mt-1.5 font-semibold">⚠ 직전 일자 자동 보정</p>
      )}
    </TooltipShell>
  );
}

function PercentTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || (d.totalVolume ?? 0) === 0) {
    return (
      <TooltipShell label={label}>
        <div className="text-[12px] text-slate-400">분석 데이터 없음</div>
      </TooltipShell>
    );
  }
  return (
    <TooltipShell label={label}>
      {payload.map((p, i) => (
        <TooltipRow key={i} color={p.color} label={p.name ?? ''} value={`${p.value}%`} />
      ))}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow label="전체" value={`${(d.totalVolume ?? 0).toLocaleString()}건`} bold />
      </div>
    </TooltipShell>
  );
}

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <TooltipShell label={label}>
      {payload.map((p, i) => (
        <TooltipRow key={i} color={p.color} label={p.name ?? ''} value={`${(p.value ?? 0).toLocaleString()}건`} />
      ))}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow label="합계" value={`${total.toLocaleString()}건`} bold />
      </div>
    </TooltipShell>
  );
}

function RiskTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter((p) => (p.value ?? 0) > 0);
  if (!filtered.length) {
    return (
      <TooltipShell label={label}>
        <div className="text-[12px] text-slate-400">발생 없음</div>
      </TooltipShell>
    );
  }
  const total = filtered.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <TooltipShell label={label}>
      {filtered.map((p, i) => (
        <TooltipRow key={i} color={p.color} label={p.name ?? ''} value={`${p.value}건`} />
      ))}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow label="합계" value={`${total}건`} bold />
      </div>
    </TooltipShell>
  );
}

function SentimentPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (TipPayload['payload'] & { positive?: number; neutral?: number; negative?: number; close?: number | null });
  if (!d) return null;
  const sentParts = [
    { color: SENTIMENT_COLOR.pos, label: '긍정', value: d.positive ?? 0 },
    { color: SENTIMENT_COLOR.neu, label: '중립', value: d.neutral ?? 0 },
    { color: SENTIMENT_COLOR.neg, label: '부정', value: d.negative ?? 0 },
  ];
  return (
    <TooltipShell label={label}>
      {sentParts.map((p, i) => (
        <TooltipRow key={i} color={p.color} label={p.label} value={`${p.value}%`} />
      ))}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {d.close != null ? (
          <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

function SearchPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (TipPayload['payload'] & {
    searchNaver?: number | null;
    searchGoogle?: number | null;
    open?: number | null;
    close?: number | null;
    high?: number | null;
    low?: number | null;
  });
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  return (
    <TooltipShell label={label}>
      <TooltipRow color={SEARCH_NAVER} label="네이버" value={d.searchNaver != null ? d.searchNaver.toString() : '—'} />
      <TooltipRow color={SEARCH_GOOGLE} label="구글" value={d.searchGoogle != null ? d.searchGoogle.toString() : '—'} />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {hasOhlc ? (
          <>
            <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close!.toLocaleString()}원`} bold />
            <div className="grid grid-cols-2 gap-x-3 mt-1 text-[11px] text-slate-400">
              <span>시 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.open!.toLocaleString()}</span></span>
              <span>고 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.high!.toLocaleString()}</span></span>
              <span>저 <span className="text-slate-700 font-semibold tabular-nums ml-1">{d.low!.toLocaleString()}</span></span>
              <span className={upDay ? 'text-red-500' : 'text-blue-500'}>
                {upDay ? '▲' : '▼'} {Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%
              </span>
            </div>
          </>
        ) : d.close != null ? (
          <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

function RiskPriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (TipPayload['payload'] & { close?: number | null });
  // payload 는 Bar 들 + Line 1개. 리스크 막대만 필터.
  const riskParts = payload.filter((p) => (p.value ?? 0) > 0 && p.name !== '종가');
  return (
    <TooltipShell label={label}>
      {riskParts.length === 0 ? (
        <div className="text-[12px] text-slate-400 mb-2">리스크 발생 없음</div>
      ) : (
        riskParts.map((p, i) => (
          <TooltipRow key={i} color={p.color} label={p.name ?? ''} value={`${p.value}건`} />
        ))
      )}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {d?.close != null ? (
          <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

function ChannelPriceTooltip({
  active,
  payload,
  label,
  visibleChannels,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
  visibleChannels: Set<Channel>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (TipPayload['payload'] & {
    channelVolume?: Record<Channel, number>;
    close?: number | null;
  });
  if (!d) return null;
  const visible = MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id));
  const total = visible.reduce((s, c) => s + (d.channelVolume?.[c.id] ?? 0), 0);
  return (
    <TooltipShell label={label}>
      {visible.length === 0 ? (
        <div className="text-[12px] text-slate-400 mb-2">선택된 채널 없음</div>
      ) : (
        <>
          {visible.map((c) => (
            <TooltipRow
              key={c.id}
              color={CHANNEL_COLOR[c.id]}
              label={c.label}
              value={`${(d.channelVolume?.[c.id] ?? 0).toLocaleString()}건`}
            />
          ))}
          <div className="border-t border-slate-100 mt-1.5 pt-1.5">
            <TooltipRow label="합계" value={`${total.toLocaleString()}건`} bold />
          </div>
        </>
      )}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {d.close != null ? (
          <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
        ) : (
          <TooltipRow label="주가" value="—" />
        )}
      </div>
    </TooltipShell>
  );
}

function VolumeSearchTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as (TipPayload['payload'] & {
    totalVolume?: number;
    searchNaver?: number | null;
    searchGoogle?: number | null;
  });
  if (!d) return null;
  return (
    <TooltipShell label={label}>
      <TooltipRow color={PRIMARY} label="수집량" value={`${(d.totalVolume ?? 0).toLocaleString()}건`} bold />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow color={SEARCH_NAVER} label="네이버" value={d.searchNaver != null ? d.searchNaver.toString() : '—'} />
        <TooltipRow color={SEARCH_GOOGLE} label="구글" value={d.searchGoogle != null ? d.searchGoogle.toString() : '—'} />
      </div>
    </TooltipShell>
  );
}

