import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface ReportHighlight {
  sirScore: number | null;
  totalItems: number;
  riskCount: number;
  summary: string[];
}

export function useReportHighlight(workspaceId: string) {
  const [data, setData] = useState<ReportHighlight>({ sirScore: null, totalItems: 0, riskCount: 0, summary: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const [wsRes, newsCount, communityCount, snsCount, newsRisk, communityRisk, snsRisk, summaryRes] = await Promise.all([
        // SIR 점수
        supabase.from('workspaces').select('sir_score').eq('id', workspaceId).single(),
        // 총 수집량
        supabase.from('news_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('community_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('sns_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        // 리스크 콘텐츠
        supabase.from('news_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null),
        supabase.from('community_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null),
        supabase.from('sns_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).not('critical_type', 'is', null),
        // 총평 (platform_id = null)
        supabase.from('session_strategies').select('summary').eq('workspace_id', workspaceId).is('platform_id', null).order('created_at', { ascending: false }).limit(1),
      ]);

      setData({
        sirScore: wsRes.data?.sir_score ?? null,
        totalItems: (newsCount.count ?? 0) + (communityCount.count ?? 0) + (snsCount.count ?? 0),
        riskCount: (newsRisk.count ?? 0) + (communityRisk.count ?? 0) + (snsRisk.count ?? 0),
        summary: summaryRes.data?.[0]?.summary ?? [],
      });
      setLoading(false);
    }

    fetch();
  }, [workspaceId]);

  return { data, loading };
}

export type TierItem = {
  [key: string]: string | number;
  tier: string;
  count: number;
  isCurrent: number;
};

export interface SirRanking {
  tiers: TierItem[];
  rank: number;
  total: number;
  average: number;
}

export function useSirRanking(workspaceId: string) {
  const [data, setData] = useState<SirRanking>({ tiers: [], rank: 0, total: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const { data: resData } = await supabase.from('workspaces').select('id, sir_score');
      const res = { data: resData };
      const all = (res.data ?? []).filter((w: any) => w.sir_score != null);
      const myScore = all.find((w: any) => w.id === workspaceId)?.sir_score ?? 0;

      // 구간별 분포 계산
      const tierRanges = [
        { label: '하위 4구간 (0~9)', min: 0, max: 10 },
        { label: '하위 3구간 (10~19)', min: 10, max: 20 },
        { label: '하위 2구간 (20~29)', min: 20, max: 30 },
        { label: '하위 1구간 (30~39)', min: 30, max: 40 },
        { label: '중위 3구간 (40~49)', min: 40, max: 50 },
        { label: '중위 2구간 (50~59)', min: 50, max: 60 },
        { label: '중위 1구간 (60~69)', min: 60, max: 70 },
        { label: '상위 3구간 (70~79)', min: 70, max: 80 },
        { label: '상위 2구간 (80~89)', min: 80, max: 90 },
        { label: '상위 1구간 (90~100)', min: 90, max: 101 },
      ];

      const myTierIdx = tierRanges.findIndex(t => myScore >= t.min && myScore < t.max);
      const tiers = tierRanges.map((t, i) => ({
        tier: t.label,
        count: all.filter((w: any) => w.sir_score >= t.min && w.sir_score < t.max).length,
        isCurrent: i === myTierIdx ? 1 : 0,
      }));

      // 순위 (높을수록 좋음)
      const sorted = all.map((w: any) => w.sir_score as number).sort((a: number, b: number) => b - a);
      const rank = sorted.indexOf(myScore) + 1;
      const average = all.length ? Math.round(all.reduce((s: number, w: any) => s + (w.sir_score as number), 0) / all.length) : 0;

      setData({ tiers, rank, total: all.length, average });
      setLoading(false);
    }

    fetch();
  }, [workspaceId]);

  return { data, loading };
}

export interface SirStockPoint {
  date: string;
  fullDate: string;
  sir: number | null;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  close_price: number | null;
}

export function useSirStockData(workspaceId: string) {
  const [data, setData] = useState<SirStockPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const [snapshotsRes, stockRes] = await Promise.all([
        supabase.from('daily_snapshots').select('date, sir_score').eq('workspace_id', workspaceId).order('date'),
        supabase.from('stock_prices').select('date, open_price, high_price, low_price, close_price').eq('workspace_id', workspaceId).order('date'),
      ]);

      const sirMap = new Map<string, number>();
      for (const s of snapshotsRes.data ?? []) {
        if (s.sir_score != null) sirMap.set(s.date, s.sir_score);
      }

      const stockMap = new Map<string, { open_price: number; high_price: number; low_price: number; close_price: number }>();
      for (const s of stockRes.data ?? []) {
        stockMap.set(s.date, { open_price: s.open_price, high_price: s.high_price, low_price: s.low_price, close_price: s.close_price });
      }

      // 두 데이터의 날짜 합집합
      const allDates = new Set([...sirMap.keys(), ...stockMap.keys()]);
      const sorted = Array.from(allDates).sort();
      const sirValues = sorted.map((date) => sirMap.get(date) ?? null);

      // 3일 이동평균
      const sirMA = sirValues.map((_, i) => {
        const window = sirValues.slice(Math.max(0, i - 2), i + 1).filter((v): v is number => v != null);
        return window.length ? Math.round(window.reduce((a, b) => a + b, 0) / window.length * 10) / 10 : null;
      });

      const merged = sorted.map((date, i) => ({
        date: date.slice(5),
        fullDate: date,
        sir: sirMA[i],
        open_price: stockMap.get(date)?.open_price ?? null,
        high_price: stockMap.get(date)?.high_price ?? null,
        low_price: stockMap.get(date)?.low_price ?? null,
        close_price: stockMap.get(date)?.close_price ?? null,
      }));

      setData(merged);
      setLoading(false);
    }

    fetch();
  }, [workspaceId]);

  return { data, loading };
}
