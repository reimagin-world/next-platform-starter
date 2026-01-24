import { useQuery } from '@tanstack/react-query';
import { marketService } from '../api';

export const useMarketIntelligence = (technology: string) => {
  return useQuery({
    queryKey: ['market-intelligence', technology],
    queryFn: () => marketService.getMarketIntelligence(technology),
    enabled: !!technology,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBatchMarketIntelligence = (technologies: string[]) => {
  return useQuery({
    queryKey: ['batch-market-intelligence', technologies],
    queryFn: () => marketService.batchMarketIntelligence(technologies),
    enabled: technologies.length > 0,
  });
};