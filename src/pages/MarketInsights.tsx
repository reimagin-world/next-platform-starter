import React, { useState } from 'react';
import { useMarketIntelligence } from '../hooks/useMarketData';
import { Button } from '../components/common/Button';
import { Search, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { TECHNOLOGY_SUGGESTIONS } from '../utils/constants';

const MarketInsights: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('TypeScript');

  const { data, isLoading, error } = useMarketIntelligence(selectedTech);

  const filteredSuggestions = TECHNOLOGY_SUGGESTIONS.filter(tech =>
    tech.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-crc py-8">
        <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
        <p className="mt-2 text-gray-600">
          Explore real-time market data for different technologies
        </p>

        {/* Search Bar */}
        <div className="mt-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search technologies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Suggestions */}
          {searchTerm && filteredSuggestions.length > 0 && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2">
              {filteredSuggestions.slice(0, 5).map((tech) => (
                <button
                  key={tech}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => {
                    setSelectedTech(tech);
                    setSearchTerm('');
                  }}
                >
                  {tech}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Market Data */}
        {isLoading && (
          <div className="mt-8 rounded-lg bg-white p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading market data...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-50 p-6">
            <p className="text-red-800">Error loading market data: {error.message}</p>
          </div>
        )}

        {data && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Market Overview */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {data.technology} Market Overview
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="ml-2 text-sm font-medium text-blue-900">Market Size</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-blue-900">
                    {data.marketData.marketSize.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-blue-700">Available Jobs</div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="ml-2 text-sm font-medium text-green-900">Growth Rate</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-900">
                    {data.marketData.growthRate}%
                  </div>
                  <div className="mt-1 text-sm text-green-700">YoY Growth</div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span className="ml-2 text-sm font-medium text-purple-900">Average Salary</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-purple-900">
                    ₹{(data.marketData.salaryRange.average / 100000).toFixed(1)}L
                  </div>
                  <div className="mt-1 text-sm text-purple-700">Per Annum</div>
                </div>

                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <span className="ml-2 text-sm font-medium text-amber-900">Demand</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-amber-900">
                    {data.marketData.demandOutlook.replace('_', ' ')}
                  </div>
                  <div className="mt-1 text-sm text-amber-700">Market Outlook</div>
                </div>
              </div>
            </div>

            {/* Industry Breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-medium text-gray-900">Top Industries</h3>
              <div className="mt-4 space-y-3">
                {data.marketData.topIndustries.map((industry, index) => (
                  <div key={industry} className="flex items-center justify-between">
                    <span className="text-gray-700">{industry}</span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                      {Math.round(data.marketData.marketSize / data.marketData.topIndustries.length).toLocaleString()} jobs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketInsights;