import { useQuery } from '@tanstack/react-query';
import { getStockPrices } from '@/lib/api/reportApi';

export function useStockPrices(workspaceId: string) {
  return useQuery({
    queryKey: ['stockPrices', workspaceId],
    queryFn: () => getStockPrices(workspaceId),
    enabled: !!workspaceId,
  });
}
