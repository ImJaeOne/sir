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
