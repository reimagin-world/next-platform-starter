import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ArrowRight, BarChart2, Shield, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white pb-16 pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Assess your</span>{' '}
                <span className="block text-blue-600 xl:inline">Career Risk</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Understand your market position, identify vulnerabilities, and get personalized recommendations to future-proof your career in the evolving tech landscape.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button size="lg" onClick={() => navigate('/assessment')}>
                  Start Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                   <div className="p-8">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <BarChart2 className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold">Risk Analysis</h3>
                           <p className="text-gray-500">Comprehensive score based on 50+ data points</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold">Market Trends</h3>
                           <p className="text-gray-500">Real-time insights from job market data</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Shield className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold">Actionable Plan</h3>
                           <p className="text-gray-500">Personalized mitigation strategies</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
