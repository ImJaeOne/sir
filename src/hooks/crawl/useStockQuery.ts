import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface StockPrice {
  date: string;
  close_price: number;
}

async function fetchStockPrices(workspaceId: string): Promise<StockPrice[]> {
  const { data, error } = await supabase
    .from('stock_prices')
    .select('date, close_price')
    .eq('workspace_id', workspaceId)
    .order('date');

  if (error) throw error;
  return data as StockPrice[];
}

export function useStockPrices(workspaceId: string) {
  return useQuery({
    queryKey: ['stockPrices', workspaceId],
    queryFn: () => fetchStockPrices(workspaceId),
    enabled: !!workspaceId,
  });
}
