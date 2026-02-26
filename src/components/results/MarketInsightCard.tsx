import React from 'react';
import { MarketIntelligence } from '../../types/assessment';
import Card from '../common/Card';

interface MarketInsightCardProps {
  marketData: MarketIntelligence;
}

const MarketInsightCard: React.FC<MarketInsightCardProps> = ({ marketData }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Intelligence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-700">Summary</h4>
          <p className="text-gray-600">{marketData.summary}</p>
        </div>
        <div>
            <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Skill Obsolescence</span>
                <span className="font-medium">{marketData.skillObsolescence}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Market Saturation</span>
                <span className="font-medium">{marketData.marketSaturation}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Salary Trend</span>
                <span className="font-medium">{marketData.salaryTrend}</span>
            </div>
             <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Job Market Size</span>
                <span className="font-medium">{marketData.jobMarketSize}</span>
            </div>
             <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Market Growth</span>
                <span className="font-medium">{marketData.marketGrowth}%</span>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketInsightCard;
