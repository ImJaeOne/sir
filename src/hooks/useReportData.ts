import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface ReportHighlight {
  sirScore: number | null;
  totalItems: number;
  riskCount: number;
}

export function useReportHighlight(workspaceId: string) {
  const [data, setData] = useState<ReportHighlight>({ sirScore: null, totalItems: 0, riskCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetch() {
      const [wsRes, newsCount, communityCount, snsCount, newsRisk, communityRisk, snsRisk] = await Promise.all([
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
      ]);

      setData({
        sirScore: wsRes.data?.sir_score ?? null,
        totalItems: (newsCount.count ?? 0) + (communityCount.count ?? 0) + (snsCount.count ?? 0),
        riskCount: (newsRisk.count ?? 0) + (communityRisk.count ?? 0) + (snsRisk.count ?? 0),
      });
      setLoading(false);
    }

    fetch();
  }, [workspaceId]);

  return { data, loading };
}
