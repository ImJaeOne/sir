import { useState, useEffect } from 'react';

interface TrendPoint {
  date: string;
  ratio: number;
}

interface SearchTrendResult {
  keyword: string;
  trend: TrendPoint[];
}

export function useSearchTrend(workspaceId: string, days: number = 30, endDate?: string) {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    const params = new URLSearchParams({ days: String(days) });
    if (endDate) params.set('end_date', endDate);

    fetch(`http://localhost:8000/api/search-trend/${workspaceId}?${params}`)
      .then((res) => res.json())
      .then((result: SearchTrendResult) => {
        setData(result.trend ?? []);
      })
      .catch((err) => {
        console.error('검색 트렌드 조회 실패:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, days, endDate]);

  return { data, loading };
}
