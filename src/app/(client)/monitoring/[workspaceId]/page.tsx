'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingDown, Activity, MessageSquare, Calendar } from 'lucide-react';
import { useWorkspace } from '@/hooks/workspace/useWorkspaceQuery';
import {
  useMonitoringDaily,
  useMonitoringStock,
  useMonitoringRisks,
  useMonitoringChannelMatrix,
  useMonitoringLifetimeTotals,
} from '@/hooks/monitoring/useMonitoringQuery';
import { useMonitoringSearchLive } from '@/hooks/monitoring/useMonitoringSearchLive';
import {
  MONITORING_CHANNELS,
  CRITICAL_TYPES,
  pickMatrixCount,
  type Channel,
  type CriticalType,
  type MonitoringDayPoint,
  type SentimentFilter,
} from '@/lib/api/monitoringApi';
import { ChartCanvas } from '@/components/chart/ChartCanvas';
import { AiAnalysisCard } from '@/components/client/monitoring/AiAnalysisCard';

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

const TABS = [
  { id: 'A', label: '수집량' },
  { id: 'E', label: '채널' },
  { id: 'B', label: '감정' },
  { id: 'D', label: '리스크' },
  { id: 'C', label: '검색' },
  { id: 'F', label: '수집 vs 검색' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const SENTIMENT_OPTIONS: { id: SentimentFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'positive', label: '긍정' },
  { id: 'neutral', label: '중립' },
  { id: 'negative', label: '부정' },
];

// ── PAGE ────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) ?? '';
  const { data: workspace } = useWorkspace(workspaceId);

  const today = useMemo(() => kstTodayStr(), []);
  const [presetDays, setPresetDays] = useState<number>(30);
  // 분석/차트 기준 — 오늘은 미완결 데이터 (KST 자정 cutoff). end = 어제, start = end - (N-1)
  const end = useMemo(() => shiftDays(today, -1), [today]);
  const start = useMemo(() => shiftDays(end, -(presetDays - 1)), [end, presetDays]);
  const [activeTab, setActiveTab] = useState<TabId>('A');
  // E 탭(채널별 수집량 + 주가) 감정 토글. 4채널 라인에 동시 적용.
  // is_relevant=true 인 항목만 매트릭스에 들어오므로 관련성 토글은 두지 않는다 (동명 노이즈 자동 차단).
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  // E 탭 채널 가시성. 기본 전체 ON.
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

  const range = presetDays;

  const { data: daily = [], isPending: dailyLoading } = useMonitoringDaily(workspaceId, start, end);
  const { data: stock = [], isPending: stockLoading } = useMonitoringStock(workspaceId, start, end);
  const { data: risks = [], isPending: risksLoading } = useMonitoringRisks(workspaceId, start, end);
  // 검색 관심도 — 네이버 데이터랩 365일치 1회 호출 후 클라가 슬라이스/재정규화 (탭 전환·기간 변경 시 추가 호출 X)
  const { data: search = [], isPending: searchLoading } = useMonitoringSearchLive(
    workspaceId,
    start,
    end
  );
  // E 탭(필터 토글) 전용 raw 매트릭스. E 탭 활성화 시에만 가져온다.
  const { data: matrix = [], isPending: matrixLoading } = useMonitoringChannelMatrix(
    activeTab === 'E' ? workspaceId : '',
    start,
    end
  );

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

  // ── KPI (기간 무관 — 누적 수집량 / 최신 종가 / 누적 리스크) ──────
  const { data: lifetime, isPending: lifetimeLoading } = useMonitoringLifetimeTotals(workspaceId);

  // ── 감정 비율 시계열 (스택 area 용) ────────────────────────────────
  // pos/neg 를 독립 반올림하면 합이 99~101 이 될 수 있어 Y축이 101% 까지 늘어나므로,
  // pos·neg 만 round 하고 neutral 은 차감으로 산정해 합 = 100 보장.
  const sentimentSeries = useMemo(
    () =>
      merged.map((d) => {
        const t = d.positive + d.neutral + d.negative;
        // dataKey 로 쓰는 positive/neutral/negative 는 % (Y축 0~100 용).
        // raw 건수는 tooltip 표시용으로 별도 키(rawPositive…) 에 보존.
        if (!t)
          return {
            date: d.date,
            positive: 0,
            neutral: 0,
            negative: 0,
            totalVolume: 0,
            rawPositive: 0,
            rawNeutral: 0,
            rawNegative: 0,
          };
        let pos = Math.round((d.positive / t) * 100);
        let neg = Math.round((d.negative / t) * 100);
        if (pos + neg > 100) {
          if (pos >= neg) pos = 100 - neg;
          else neg = 100 - pos;
        }
        const neu = 100 - pos - neg;
        return {
          date: d.date,
          positive: pos,
          neutral: neu,
          negative: neg,
          totalVolume: t,
          rawPositive: d.positive,
          rawNeutral: d.neutral,
          rawNegative: d.negative,
        };
      }),
    [merged]
  );

  // E 탭용: matrix 를 (relevant × sentiment) 토글에 따라 슬라이스해 채널 4선용 일자 시리즈로 변환.
  // merged 와 동일한 일자 축을 유지해 주가/캔들과 정렬되도록 한다.
  type ChannelFilteredPoint = MergedPoint & { filteredVolume: number };
  const channelFiltered: ChannelFilteredPoint[] = useMemo(() => {
    const matrixMap = new Map(matrix.map((m) => [m.date, m]));
    return merged.map((d) => {
      const m = matrixMap.get(d.date);
      const cv: Record<Channel, number> = { news: 0, blog: 0, youtube: 0, community: 0 };
      if (m) {
        for (const ch of ['news', 'blog', 'youtube', 'community'] as Channel[]) {
          cv[ch] = pickMatrixCount(m.byChannel[ch], sentimentFilter);
        }
      }
      return {
        ...d,
        channelVolume: cv,
        filteredVolume: cv.news + cv.blog + cv.youtube + cv.community,
      };
    });
  }, [merged, matrix, sentimentFilter]);

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="mx-auto w-full max-w-[1240px] px-4 lg:px-10 py-7 lg:py-10 flex flex-col gap-7">
        {/* 헤더 ─────────────────────────────────────────── */}
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Activity size={13} className="text-slate-300" />
            <span>SIR · Insight</span>
          </div>
          <h1 className="text-[26px] lg:text-[28px] font-bold tracking-[-0.02em] text-slate-900 leading-[1.2]">
            {workspace?.company_name ?? '워크스페이스'} 인사이트
          </h1>
          <p className="text-[13px] text-slate-500 leading-[1.6] max-w-[860px]">
            워크스페이스 전체 누적 수치와 최신 주가를 상단에 고정 표시합니다. 아래 프리셋으로 차트의
            기간 범위를 조정할 수 있습니다.
          </p>
        </header>

        {/* KPI (기간 무관) ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <KpiCard
            icon={<MessageSquare size={14} />}
            label="총 수집량"
            value={lifetime ? lifetime.totalVolume.toLocaleString() : '—'}
            unit="건"
            tone="default"
            loading={lifetimeLoading}
          />
          <KpiCard
            icon={<Activity size={14} />}
            label="현재 주가"
            value={lifetime?.lastClose != null ? lifetime.lastClose.toLocaleString() : '—'}
            unit="원"
            loading={lifetimeLoading}
          />
          <KpiCard
            icon={<TrendingDown size={14} />}
            label="총 리스크 건수"
            value={lifetime ? lifetime.totalRisk.toLocaleString() : '—'}
            unit="건"
            loading={lifetimeLoading}
          />
        </div>

        {/* 기간 프리셋 ───────────────────────────────── */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 px-4 lg:px-5 py-3.5 flex items-center gap-3 lg:gap-5 flex-wrap">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar size={15} />
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase">기간</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {PRESETS.map((p) => {
              const active = presetDays === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetDays(p.id)}
                  className={`text-[11.5px] font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer tracking-[-0.005em] ${
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
          <span className="text-[11px] text-slate-400 tabular-nums ml-auto">
            {start} ~ {end}
          </span>
        </div>

        {/* 탭 ───────────────────────────────────────────── */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* 차트 — 탭별 분기. 한 화면에 한 탭만 노출. */}
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
          const priceMin = Math.min(
            ...merged.filter((d) => d.low != null).map((d) => d.low as number),
            Infinity
          );
          const priceMax = Math.max(
            ...merged.filter((d) => d.high != null).map((d) => d.high as number),
            -Infinity
          );
          const priceDomain: [number | string, number | string] =
            isFinite(priceMin) && isFinite(priceMax)
              ? [Math.floor(priceMin * 0.98), Math.ceil(priceMax * 1.02)]
              : ['auto', 'auto'];
          const hasPrice = merged.some((d) => d.close != null);
          const hasSearch = merged.some((d) => d.searchNaver != null || d.searchGoogle != null);

          // ── 캔들 차트 막대 (각 탭에서 재사용) ──
          const candleBar = (
            <Bar
              yAxisId="price"
              dataKey="high"
              name="주가"
              fill="transparent"
              barSize={Math.max(barSize * 1.5, 4)}
              isAnimationActive={false}
              shape={(props) => (
                <CandleBar
                  {...props}
                  priceMin={priceDomain[0] as number}
                  priceMax={priceDomain[1] as number}
                />
              )}
            />
          );

          return (
            <div className="flex flex-col gap-4">
              {/* ── A. 주가 & 수집량 ─────────────────────── */}
              {activeTab === 'A' && (
                <ChartCard
                  title="주가 + 수집량 (캔들 · 라인)"
                  subtitle="OHLC 캔들 + 수집량 라인. 빨강=상승 / 파랑=하락"
                  loading={isLoading}
                  empty={!hasPrice}
                >
                  <div className="h-[300px]">
                    <ChartCanvas width="105%">
                      <ComposedChart
                        data={merged}
                        margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                          yAxisId="price"
                        />
                        {sharedXAxis}
                        <YAxis
                          yAxisId="vol"
                          orientation="left"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <YAxis
                          yAxisId="price"
                          orientation="right"
                          tickFormatter={priceTickFormatter}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                          domain={priceDomain}
                        />
                        <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<PriceVolumeTooltip />} />
                        <Line
                          yAxisId="vol"
                          type="monotone"
                          dataKey="totalVolume"
                          name="수집량"
                          stroke={PRIMARY}
                          strokeWidth={1.8}
                          dot={false}
                          isAnimationActive={false}
                        />
                        {candleBar}
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
              )}

              {/* ── B. 감정 ─────────────────────────────── */}
              {activeTab === 'B' && (
                <>
                  {/* 감정 분포 + 주가 (캔들) */}
                  <ChartCard
                    title="감정 분포 + 주가 (캔들)"
                    subtitle="OHLC 캔들로 주가 일중 변동까지 함께 본다"
                    loading={isLoading}
                    empty={sentimentSeries.every((d) => d.totalVolume === 0)}
                  >
                    <div className="h-[300px]">
                      <ChartCanvas width="105%">
                        <ComposedChart
                          data={merged.map((d, i) => ({ ...d, ...sentimentSeries[i] }))}
                          margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient id="gPos3" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={SENTIMENT_COLOR.pos} stopOpacity={0.4} />
                              <stop
                                offset="100%"
                                stopColor={SENTIMENT_COLOR.pos}
                                stopOpacity={0.08}
                              />
                            </linearGradient>
                            <linearGradient id="gNeu3" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor={SENTIMENT_COLOR.neu}
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor={SENTIMENT_COLOR.neu}
                                stopOpacity={0.06}
                              />
                            </linearGradient>
                            <linearGradient id="gNeg3" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={SENTIMENT_COLOR.neg} stopOpacity={0.4} />
                              <stop
                                offset="100%"
                                stopColor={SENTIMENT_COLOR.neg}
                                stopOpacity={0.08}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                            yAxisId="sent"
                          />
                          {sharedXAxis}
                          <YAxis
                            yAxisId="sent"
                            orientation="left"
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            allowDataOverflow
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                          />
                          <YAxis
                            yAxisId="price"
                            orientation="right"
                            tickFormatter={priceTickFormatter}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                            domain={priceDomain}
                          />
                          <Tooltip
                            cursor={{ fill: PRIMARY_SOFT }}
                            content={<SentimentPriceTooltip />}
                          />
                          <Area
                            yAxisId="sent"
                            type="monotone"
                            dataKey="positive"
                            name="긍정"
                            stackId="s"
                            stroke={SENTIMENT_COLOR.pos}
                            strokeWidth={1.2}
                            fill="url(#gPos3)"
                            isAnimationActive={false}
                          />
                          <Area
                            yAxisId="sent"
                            type="monotone"
                            dataKey="neutral"
                            name="중립"
                            stackId="s"
                            stroke={SENTIMENT_COLOR.neu}
                            strokeWidth={1.2}
                            fill="url(#gNeu3)"
                            isAnimationActive={false}
                          />
                          <Area
                            yAxisId="sent"
                            type="monotone"
                            dataKey="negative"
                            name="부정"
                            stackId="s"
                            stroke={SENTIMENT_COLOR.neg}
                            strokeWidth={1.2}
                            fill="url(#gNeg3)"
                            isAnimationActive={false}
                          />
                          {candleBar}
                        </ComposedChart>
                      </ChartCanvas>
                    </div>
                    <ChartLegend
                      items={[
                        { color: SENTIMENT_COLOR.pos, label: '긍정' },
                        { color: SENTIMENT_COLOR.neu, label: '중립' },
                        { color: SENTIMENT_COLOR.neg, label: '부정' },
                        { color: CANDLE_UP, label: '주가 상승 (우)' },
                        { color: CANDLE_DOWN, label: '주가 하락 (우)' },
                      ]}
                    />
                  </ChartCard>
                </>
              )}

              {/* ── C. 검색 ─────────────────────────────── */}
              {activeTab === 'C' && (
                <ChartCard
                  title="주가 + 검색 관심도 (캔들 · 라인)"
                  subtitle="OHLC 캔들 + 검색 관심도 라인 (0–100 상대지수)"
                  loading={isLoading}
                  empty={!hasPrice && !hasSearch}
                >
                  <div className="h-[300px]">
                    <ChartCanvas width="105%">
                      <ComposedChart
                        data={merged}
                        margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                          yAxisId="price"
                        />
                        {sharedXAxis}
                        <YAxis
                          yAxisId="srch"
                          orientation="left"
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={32}
                        />
                        <YAxis
                          yAxisId="price"
                          orientation="right"
                          tickFormatter={priceTickFormatter}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={48}
                          domain={priceDomain}
                        />
                        <Tooltip cursor={{ fill: PRIMARY_SOFT }} content={<SearchPriceTooltip />} />
                        <Line
                          yAxisId="srch"
                          type="monotone"
                          dataKey="searchNaver"
                          name="네이버"
                          stroke={SEARCH_NAVER}
                          strokeWidth={1.8}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                        <Line
                          yAxisId="srch"
                          type="monotone"
                          dataKey="searchGoogle"
                          name="구글"
                          stroke={SEARCH_GOOGLE}
                          strokeWidth={1.8}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                        {candleBar}
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
              )}

              {/* ── D. 리스크 ─────────────────────────── */}
              {activeTab === 'D' && (
                <>
                  {/* 리스크 발생(스택 라인) + 주가 (캔들) */}
                  <ChartCard
                    title="리스크 발생(스택 라인) + 주가 (캔들)"
                    subtitle="critical_type 별 누적 라인으로 리스크 추세 흐름을 본다"
                    loading={isLoading}
                    empty={merged.every((d) => d.riskTotal === 0)}
                  >
                    <div className="h-[300px]">
                      <ChartCanvas width="105%">
                        <ComposedChart
                          data={merged}
                          margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                            yAxisId="risk"
                          />
                          {sharedXAxis}
                          <YAxis
                            yAxisId="risk"
                            orientation="left"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="price"
                            orientation="right"
                            tickFormatter={priceTickFormatter}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                            domain={priceDomain}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(239, 68, 68, 0.06)' }}
                            content={<RiskPriceTooltip />}
                          />
                          {CRITICAL_TYPES.map((c) => (
                            <Area
                              key={c.id}
                              yAxisId="risk"
                              type="monotone"
                              dataKey={(d: MergedPoint) => d.risks[c.id] ?? 0}
                              name={c.label}
                              stackId="risk"
                              stroke={CRITICAL_COLOR[c.id]}
                              strokeWidth={1.8}
                              fill={CRITICAL_COLOR[c.id]}
                              fillOpacity={0.08}
                              isAnimationActive={false}
                            />
                          ))}
                          {candleBar}
                        </ComposedChart>
                      </ChartCanvas>
                    </div>
                    <ChartLegend
                      items={[
                        ...CRITICAL_TYPES.map((c) => ({
                          color: CRITICAL_COLOR[c.id],
                          label: c.label,
                        })),
                        { color: CANDLE_UP, label: '주가 상승 (우)' },
                        { color: CANDLE_DOWN, label: '주가 하락 (우)' },
                      ]}
                    />
                  </ChartCard>
                </>
              )}

              {/* ── E. 채널 (토글) ────────────────────── */}
              {activeTab === 'E' && (
                <>
                  {/* 공통 토글 패널 — 두 차트(E1/E2)에 동시 적용 */}
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-4 lg:p-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <FilterGroup
                      label="감정"
                      options={SENTIMENT_OPTIONS}
                      value={sentimentFilter}
                      onChange={setSentimentFilter}
                    />
                    {/* 채널 가시성 칩 */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 lg:pt-0 lg:border-t-0 lg:border-l lg:border-slate-100 lg:pl-6">
                      <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-400 mr-1">
                        채널
                      </span>
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
                              style={{
                                background: on ? '#fff' : CHANNEL_COLOR[c.id],
                                opacity: on ? 0.9 : 0.7,
                              }}
                            />
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 채널별 수집량(스택 라인) + 주가 (캔들) */}
                  <ChartCard
                    title="채널별 수집량(스택 라인) + 주가 (캔들)"
                    subtitle="채널별 누적 라인 + OHLC 캔들. 필터에 따라 라인이 갱신된다"
                    loading={isLoading || matrixLoading}
                    empty={channelFiltered.every((d) => d.filteredVolume === 0) && !hasPrice}
                  >
                    <div className="h-[300px]">
                      <ChartCanvas width="105%">
                        <ComposedChart
                          data={channelFiltered}
                          margin={{ top: 12, right: 24, bottom: 0, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                            yAxisId="vol"
                          />
                          {sharedXAxis}
                          <YAxis
                            yAxisId="vol"
                            orientation="left"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={36}
                            allowDecimals={false}
                          />
                          <YAxis
                            yAxisId="price"
                            orientation="right"
                            tickFormatter={priceTickFormatter}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                            domain={priceDomain}
                          />
                          <Tooltip
                            cursor={{ fill: PRIMARY_SOFT }}
                            content={
                              <ChannelPriceTooltip visibleChannels={visibleChannels} showOhlc />
                            }
                          />
                          {MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id)).map((c) => (
                            <Area
                              key={c.id}
                              yAxisId="vol"
                              type="monotone"
                              dataKey={(d: MergedPoint) => d.channelVolume[c.id]}
                              name={c.label}
                              stackId="vol"
                              stroke={CHANNEL_COLOR[c.id]}
                              strokeWidth={1.8}
                              fill={CHANNEL_COLOR[c.id]}
                              fillOpacity={0.08}
                              isAnimationActive={false}
                            />
                          ))}
                          {candleBar}
                        </ComposedChart>
                      </ChartCanvas>
                    </div>
                    <ChartLegend
                      items={[
                        ...MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id)).map(
                          (c) => ({
                            color: CHANNEL_COLOR[c.id],
                            label: c.label,
                          })
                        ),
                        { color: CANDLE_UP, label: '주가 상승 (우)' },
                        { color: CANDLE_DOWN, label: '주가 하락 (우)' },
                      ]}
                    />
                  </ChartCard>
                </>
              )}

              {/* ── F. 수집 vs 검색 (내·외부 신호 비교) ─────── */}
              {activeTab === 'F' && (
                <ChartCard
                  title="수집 vs 검색"
                  subtitle="외부 관심도(검색)와 실제 발생량(수집)의 동조·괴리. 이 탭은 유일하게 주가 없이 두 신호를 직접 비교한다."
                  loading={isLoading}
                  empty={!hasSearch && merged.every((d) => d.totalVolume === 0)}
                >
                  <div className="h-[280px]">
                    <ChartCanvas>
                      <ComposedChart
                        data={merged}
                        margin={{ top: 12, right: 18, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient id="volBar2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        {sharedXAxis}
                        <YAxis
                          yAxisId="vol"
                          orientation="left"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <YAxis
                          yAxisId="srch"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <Tooltip
                          cursor={{ fill: PRIMARY_SOFT }}
                          content={<VolumeSearchTooltip />}
                        />
                        <Bar
                          yAxisId="vol"
                          dataKey="totalVolume"
                          name="수집량"
                          fill="url(#volBar2)"
                          isAnimationActive={false}
                          barSize={barSize}
                        />
                        <Line
                          yAxisId="srch"
                          type="monotone"
                          dataKey="searchNaver"
                          name="네이버"
                          stroke={SEARCH_NAVER}
                          strokeWidth={1.8}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
                        <Line
                          yAxisId="srch"
                          type="monotone"
                          dataKey="searchGoogle"
                          name="구글"
                          stroke={SEARCH_GOOGLE}
                          strokeWidth={1.8}
                          dot={false}
                          isAnimationActive={false}
                          connectNulls
                        />
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
              )}
            </div>
          );
        })()}

        {/* AI 분석 ─────────────────────────────────────── */}
        <AiAnalysisCard workspaceId={workspaceId} start={start} end={end} presetDays={presetDays} />
      </div>
    </div>
  );
}

// ── shared subcomponents ────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  unit,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone?: 'default' | 'warn' | 'danger';
  loading?: boolean;
}) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white'
      : tone === 'danger'
        ? 'border-red-200/80 bg-gradient-to-br from-red-50/50 to-white'
        : 'border-slate-200/80 bg-white';

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-2.5 ${toneClass} shadow-[0_1px_2px_rgba(15,23,42,0.04)]`}
    >
      <div className="flex items-center gap-2 text-slate-400">
        <span>{icon}</span>
        <span className="text-[11px] font-bold tracking-[0.06em] uppercase">{label}</span>
      </div>
      {loading ? (
        <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold tracking-[-0.025em] leading-[1] tabular-nums text-slate-900">
            {value}
          </span>
          {unit && <span className="text-xs sm:text-sm font-semibold text-slate-400">{unit}</span>}
        </div>
      )}
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

function TabBar<T extends string>({
  activeTab,
  onChange,
}: {
  activeTab: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin">
      {TABS.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id as unknown as T)}
            className={`text-[12.5px] font-bold px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer tracking-[-0.005em] ${
              active
                ? 'bg-slate-900 text-white shadow-[0_2px_6px_rgba(15,23,42,0.18)]'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** 라디오 대신 사용하는 세그먼트 컨트롤. 1택, 4채널 라인 동시 필터에 사용. */
function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-bold tracking-[0.06em] uppercase text-slate-400">
        {label}
      </span>
      <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
        {options.map((opt) => {
          const on = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={on}
              className={`text-[11.5px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer tracking-[-0.005em] ${
                on
                  ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CandleBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    open?: number | null;
    close?: number | null;
    high?: number | null;
    low?: number | null;
  };
  priceMin: number;
  priceMax: number;
}

/** 캔들 shape — recharts Bar 의 shape prop. recharts 가 high(=dataKey) 를 기준으로
 *  바 좌표를 계산해 주므로, 그 좌표 + 바 높이에서 priceMin/priceMax 로 OHLC 위치 역산. */
function CandleBar(props: CandleBarProps) {
  const { x, y, width, height, payload, priceMin, priceMax } = props;
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    !payload?.open ||
    !payload.close ||
    !payload.high ||
    !payload.low
  )
    return null;

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
      <rect
        x={x + width * 0.15}
        y={bodyTop}
        width={width * 0.7}
        height={bodyH}
        fill={color}
        rx={1}
      />
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
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: color }}
        />
      )}
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
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  const fmt = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()}원` : '—');
  return (
    <TooltipShell label={label}>
      <TooltipRow label="시가" value={fmt(d.open)} />
      <TooltipRow label="고가" value={fmt(d.high)} />
      <TooltipRow label="저가" value={fmt(d.low)} />
      <TooltipRow label="종가" value={fmt(d.close)} />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-[12px] text-slate-500">등락률</span>
          <span
            className={`ml-auto text-[12px] tabular-nums font-semibold ${
              hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
            }`}
          >
            {hasOhlc
              ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
              : '—'}
          </span>
        </div>
      </div>
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow
          color={PRIMARY}
          label="수집량"
          value={`${(d.totalVolume ?? 0).toLocaleString()}건`}
        />
      </div>
      {d.isCarried && (
        <p className="text-[10px] text-amber-600 mt-1.5 font-semibold">⚠ 직전 일자 자동 보정</p>
      )}
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
  const d = payload[0]?.payload as TipPayload['payload'] & {
    positive?: number;
    neutral?: number;
    negative?: number;
    rawPositive?: number;
    rawNeutral?: number;
    rawNegative?: number;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
  };
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');
  const sentParts = [
    { color: SENTIMENT_COLOR.pos, label: '긍정', pct: d.positive ?? 0, count: d.rawPositive ?? 0 },
    { color: SENTIMENT_COLOR.neu, label: '중립', pct: d.neutral ?? 0, count: d.rawNeutral ?? 0 },
    { color: SENTIMENT_COLOR.neg, label: '부정', pct: d.negative ?? 0, count: d.rawNegative ?? 0 },
  ];
  return (
    <TooltipShell label={label}>
      <div className="grid grid-cols-[minmax(140px,auto)_1px_minmax(170px,auto)] gap-3.5 items-start">
        {/* 좌: 감정 비율 (% + n건) */}
        <div>
          {sentParts.map((p, i) => (
            <TooltipRow
              key={i}
              color={p.color}
              label={p.label}
              value={`${p.pct}% (${p.count.toLocaleString()}건)`}
            />
          ))}
        </div>
        <div className="bg-slate-100 self-stretch" />
        {/* 우: 3행 — 1행 시가/종가, 2행 저가/고가, 3행 등락률 */}
        <div className="flex flex-col gap-0.5">
          <PricePairRow
            leftLabel="시가"
            leftValue={fmt(d.open)}
            rightLabel="종가"
            rightValue={fmt(d.close)}
          />
          <PricePairRow
            leftLabel="저가"
            leftValue={fmt(d.low)}
            rightLabel="고가"
            rightValue={fmt(d.high)}
          />
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="text-[11.5px] text-slate-500">등락률</span>
            <span
              className={`ml-auto text-[12px] tabular-nums font-semibold ${
                hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
              }`}
            >
              {hasOhlc
                ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </TooltipShell>
  );
}

/** 한 행에 두 가격(시·종 또는 저·고) 을 좌우로 배치 */
function PricePairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 py-0.5">
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-slate-500">{leftLabel}</span>
        <span className="ml-auto text-[12px] tabular-nums font-semibold text-slate-700">
          {leftValue}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-slate-500">{rightLabel}</span>
        <span className="ml-auto text-[12px] tabular-nums font-semibold text-slate-700">
          {rightValue}
        </span>
      </div>
    </div>
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
  const d = payload[0]?.payload as TipPayload['payload'] & {
    searchNaver?: number | null;
    searchGoogle?: number | null;
    open?: number | null;
    close?: number | null;
    high?: number | null;
    low?: number | null;
  };
  if (!d) return null;
  const hasOhlc = d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);
  return (
    <TooltipShell label={label}>
      <TooltipRow
        color={SEARCH_NAVER}
        label="네이버"
        value={d.searchNaver != null ? d.searchNaver.toString() : '—'}
      />
      <TooltipRow
        color={SEARCH_GOOGLE}
        label="구글"
        value={d.searchGoogle != null ? d.searchGoogle.toString() : '—'}
      />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        {hasOhlc ? (
          <>
            <TooltipRow
              color={PRICE_LINE}
              label="주가 종가"
              value={`${d.close!.toLocaleString()}원`}
              bold
            />
            <div className="grid grid-cols-2 gap-x-3 mt-1 text-[11px] text-slate-400">
              <span>
                시{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.open!.toLocaleString()}
                </span>
              </span>
              <span>
                고{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.high!.toLocaleString()}
                </span>
              </span>
              <span>
                저{' '}
                <span className="text-slate-700 font-semibold tabular-nums ml-1">
                  {d.low!.toLocaleString()}
                </span>
              </span>
              <span className={upDay ? 'text-red-500' : 'text-blue-500'}>
                {upDay ? '▲' : '▼'}{' '}
                {Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%
              </span>
            </div>
          </>
        ) : d.close != null ? (
          <TooltipRow
            color={PRICE_LINE}
            label="주가 종가"
            value={`${d.close.toLocaleString()}원`}
            bold
          />
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
  const d = payload[0]?.payload as TipPayload['payload'] & { close?: number | null };
  // payload 는 Bar/Area 들 + 주가 series. 리스크 부분만 남기기 위해 종가 라인(name="종가")
  // 과 캔들 막대(name="주가") 를 둘 다 제외.
  const riskParts = payload.filter(
    (p) => (p.value ?? 0) > 0 && p.name !== '종가' && p.name !== '주가'
  );
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
          <TooltipRow
            color={PRICE_LINE}
            label="주가 종가"
            value={`${d.close.toLocaleString()}원`}
            bold
          />
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
  showOhlc,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
  visibleChannels: Set<Channel>;
  showOhlc?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TipPayload['payload'] & {
    channelVolume?: Record<Channel, number>;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
  };
  if (!d) return null;
  const visible = MONITORING_CHANNELS.filter((c) => visibleChannels.has(c.id));
  const total = visible.reduce((s, c) => s + (d.channelVolume?.[c.id] ?? 0), 0);
  const hasOhlc =
    !!showOhlc && d.open != null && d.close != null && d.high != null && d.low != null;
  const upDay = hasOhlc && (d.close ?? 0) >= (d.open ?? 0);

  const channelBlock =
    visible.length === 0 ? (
      <div className="text-[12px] text-slate-400">선택된 채널 없음</div>
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
    );

  // showOhlc 모드: 휴장일/데이터 누락도 5행 그대로 유지하고 값만 '—' 로 표시 → 좌우 행 수 안정.
  const fmt = (v: number | null | undefined) => (v != null ? `${v.toLocaleString()}원` : '—');
  const priceBlock = showOhlc ? (
    <>
      <TooltipRow label="시가" value={fmt(d.open)} />
      <TooltipRow label="고가" value={fmt(d.high)} />
      <TooltipRow label="저가" value={fmt(d.low)} />
      <TooltipRow label="종가" value={fmt(d.close)} />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-[12px] text-slate-500">등락률</span>
          <span
            className={`ml-auto text-[12px] tabular-nums font-semibold ${
              hasOhlc ? (upDay ? 'text-red-500' : 'text-blue-500') : 'text-slate-400'
            }`}
          >
            {hasOhlc
              ? `${upDay ? '▲' : '▼'} ${Math.abs((((d.close ?? 0) - (d.open ?? 0)) / (d.open ?? 1)) * 100).toFixed(2)}%`
              : '—'}
          </span>
        </div>
      </div>
    </>
  ) : d.close != null ? (
    <TooltipRow color={PRICE_LINE} label="주가 종가" value={`${d.close.toLocaleString()}원`} bold />
  ) : (
    <TooltipRow label="주가" value="—" />
  );

  // showOhlc 가 true 면 채널 ↔ 주가 좌우 2 column. 아니면 기존 위·아래 스택.
  if (showOhlc) {
    return (
      <TooltipShell label={label}>
        <div className="grid grid-cols-[minmax(140px,auto)_1px_minmax(150px,auto)] gap-3.5 items-start">
          <div>{channelBlock}</div>
          <div className="bg-slate-100 self-stretch" />
          <div>{priceBlock}</div>
        </div>
      </TooltipShell>
    );
  }

  return (
    <TooltipShell label={label}>
      {channelBlock}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">{priceBlock}</div>
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
  const d = payload[0]?.payload as TipPayload['payload'] & {
    totalVolume?: number;
    searchNaver?: number | null;
    searchGoogle?: number | null;
  };
  if (!d) return null;
  return (
    <TooltipShell label={label}>
      <TooltipRow
        color={PRIMARY}
        label="수집량"
        value={`${(d.totalVolume ?? 0).toLocaleString()}건`}
        bold
      />
      <div className="border-t border-slate-100 mt-1.5 pt-1.5">
        <TooltipRow
          color={SEARCH_NAVER}
          label="네이버"
          value={d.searchNaver != null ? d.searchNaver.toString() : '—'}
        />
        <TooltipRow
          color={SEARCH_GOOGLE}
          label="구글"
          value={d.searchGoogle != null ? d.searchGoogle.toString() : '—'}
        />
      </div>
    </TooltipShell>
  );
}
