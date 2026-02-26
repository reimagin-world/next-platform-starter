import { MarketIntelligenceResponse } from '../types/assessment';
import { apiClient } from './client';

class MarketService {
  async getMarketIntelligence(technology: string): Promise<MarketIntelligenceResponse> {
    return apiClient.get<MarketIntelligenceResponse>(`/market-intelligence?technology=${encodeURIComponent(technology)}`);
  }

  async batchMarketIntelligence(technologies: string[]): Promise<MarketIntelligenceResponse[]> {
    const promises = technologies.map(tech => this.getMarketIntelligence(tech));
    return Promise.all(promises);
  }
}

export const marketService = new MarketService();
export default marketService;