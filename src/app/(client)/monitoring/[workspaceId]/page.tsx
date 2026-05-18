'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
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
  pickMatrixCount,
  type Channel,
  type SentimentFilter,
} from '@/lib/api/monitoringApi';
import { AiAnalysisCard } from '@/components/client/monitoring/AiAnalysisCard';
import { DayDetailDrawer } from '@/components/client/monitoring/DayDetailDrawer';
import { ReportDisclaimer } from '@/components/report/ReportDisclaimer';
import {
  niceTicks,
  type MergedPoint,
  type SentimentSeriesPoint,
  type ChannelFilteredPoint,
} from '@/components/chart/monitoring/shared';
import { PriceVolumeChart } from '@/components/chart/monitoring/PriceVolumeChart';
import { SentimentPriceChart } from '@/components/chart/monitoring/SentimentPriceChart';
import { SearchPriceChart } from '@/components/chart/monitoring/SearchPriceChart';
import { RiskPriceChart } from '@/components/chart/monitoring/RiskPriceChart';
import { ChannelVolumePriceChart } from '@/components/chart/monitoring/ChannelVolumePriceChart';
import { VolumeSearchChart } from '@/components/chart/monitoring/VolumeSearchChart';

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
  { id: 'F', label: '수집·검색' },
] as const;
type TabId = (typeof TABS)[number]['id'];

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
  // 차트 데이터 포인트 클릭 → 우측 drawer 에 노출할 KST 일자. null = drawer 닫힘.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // E 탭(채널별 수집량 + 주가) 감정 토글. 4채널 라인에 동시 적용.
  // is_relevant=true 인 항목만 매트릭스에 들어오므로 관련성 토글은 두지 않는다 (동명 노이즈 자동 차단).
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  // E 탭 채널 가시성. 기본 전체 ON.
  const [visibleChannels, setVisibleChannels] = useState<Set<Channel>>(
    () => new Set(['news', 'blog', 'youtube', 'community']),
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
    end,
  );
  // E 탭(필터 토글) 전용 raw 매트릭스. E 탭 활성화 시에만 가져온다.
  const { data: matrix = [], isPending: matrixLoading } = useMonitoringChannelMatrix(
    activeTab === 'E' ? workspaceId : '',
    start,
    end,
  );

  const isLoading = dailyLoading || stockLoading || risksLoading || searchLoading;

  // ── 머지: 전체 일자 축 (수집/주가/리스크/검색 모두 한 series 안에 두면 차트 정렬 안정) ──
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
  const sentimentSeries: SentimentSeriesPoint[] = useMemo(
    () =>
      merged.map((d) => {
        const t = d.positive + d.neutral + d.negative;
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
    [merged],
  );

  // E 탭용: matrix 를 (relevant × sentiment) 토글에 따라 슬라이스해 채널 4선용 일자 시리즈로 변환.
  // merged 와 동일한 일자 축을 유지해 주가/캔들과 정렬되도록 한다.
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

  // ── 가격 Y축 nice ticks 계산 (모든 차트 공통) ──
  const priceMin = Math.min(
    ...merged.filter((d) => d.low != null).map((d) => d.low as number),
    Infinity,
  );
  const priceMax = Math.max(
    ...merged.filter((d) => d.high != null).map((d) => d.high as number),
    -Infinity,
  );
  const priceNice = isFinite(priceMin) && isFinite(priceMax)
    ? niceTicks(priceMin * 0.98, priceMax * 1.02, 5)
    : null;
  const priceDomain: [number | string, number | string] = priceNice
    ? priceNice.domain
    : ['auto', 'auto'];
  const priceTicks: number[] | undefined = priceNice?.ticks;
  const hasPrice = merged.some((d) => d.close != null);
  // 데이터 점 폭에 따라 캔들/막대 두께. 60일 이상이면 좀게, 90일 이상이면 더 좁게.
  const barSize = range >= 180 ? 2 : range >= 90 ? 4 : 8;

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
        {/* 모바일: 2줄 (1줄=라벨+날짜, 2줄=프리셋) / 데스크톱: 1줄 */}
        <div className="rounded-2xl bg-slate-50/70 border border-slate-200/80 px-4 lg:px-5 py-3.5 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-5">
          <div className="flex items-center gap-2 text-slate-400 lg:shrink-0">
            <Calendar size={15} />
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase">기간</span>
            <span className="text-[11px] text-slate-400 tabular-nums ml-auto lg:hidden">
              {start} ~ {end}
            </span>
          </div>
          <div className="flex items-center gap-1 w-full lg:w-auto lg:flex-wrap">
            {PRESETS.map((p) => {
              const active = presetDays === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetDays(p.id)}
                  className={`text-[11.5px] font-bold px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer tracking-[-0.005em] flex-1 lg:flex-none ${
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
          <span className="hidden lg:inline text-[11px] text-slate-400 tabular-nums ml-auto">
            {start} ~ {end}
          </span>
        </div>

        {/* 탭 ───────────────────────────────────────────── */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* 차트 — 탭별 분기. 한 화면에 한 탭만 노출. */}
        <div className="flex flex-col gap-4">
          {activeTab === 'A' && (
            <PriceVolumeChart
              merged={merged}
              priceDomain={priceDomain}
              priceTicks={priceTicks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading}
              barSize={barSize}
            />
          )}
          {activeTab === 'B' && (
            <SentimentPriceChart
              merged={merged}
              sentimentSeries={sentimentSeries}
              priceDomain={priceDomain}
              priceTicks={priceTicks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading}
              barSize={barSize}
            />
          )}
          {activeTab === 'C' && (
            <SearchPriceChart
              merged={merged}
              priceDomain={priceDomain}
              priceTicks={priceTicks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading}
              barSize={barSize}
            />
          )}
          {activeTab === 'D' && (
            <RiskPriceChart
              merged={merged}
              priceDomain={priceDomain}
              priceTicks={priceTicks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading}
              barSize={barSize}
            />
          )}
          {activeTab === 'E' && (
            <ChannelVolumePriceChart
              channelFiltered={channelFiltered}
              priceDomain={priceDomain}
              priceTicks={priceTicks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading || matrixLoading}
              barSize={barSize}
              sentimentFilter={sentimentFilter}
              setSentimentFilter={setSentimentFilter}
              visibleChannels={visibleChannels}
              toggleChannel={toggleChannel}
              hasPrice={hasPrice}
            />
          )}
          {activeTab === 'F' && (
            <VolumeSearchChart
              merged={merged}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              loading={isLoading}
              barSize={barSize}
            />
          )}
        </div>

        {/* AI 분석 ─────────────────────────────────────── */}
        {/* 페이지 기간 프리셋(차트용) 과 완전 분리 — 카드 자체가 모달 트리거 + 토큰 차감 흐름 관리. */}
        <AiAnalysisCard workspaceId={workspaceId} />

        <ReportDisclaimer />
      </div>

      {/* 차트 데이터 포인트 클릭 → 그 날(KST) 수집 데이터 상세 drawer */}
      <DayDetailDrawer
        workspaceId={workspaceId}
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}

// ── page-local subcomponents ────────────────────────────────────────────

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
          <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold tracking-[-0.025em] leading-none tabular-nums text-slate-900">
            {value}
          </span>
          {unit && <span className="text-xs sm:text-sm font-semibold text-slate-400">{unit}</span>}
        </div>
      )}
    </div>
  );
}

function TabBar({ activeTab, onChange }: { activeTab: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin">
      {TABS.map((t) => {
        const active = t.id === activeTab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
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
