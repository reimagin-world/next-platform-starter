import React, { useState } from 'react';
import { Recommendation } from '../../types/assessment';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../common/Button';
import { ChevronDown, ChevronUp, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = () => {
    switch (recommendation.type) {
      case 'SKILL_DEVELOPMENT':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'CAREER_TRANSITION':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'RISK_MITIGATION':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
    }
  };

  const getRecommendationBadge = () => {
    switch (recommendation.recommendation) {
      case 'RECOMMENDED':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Recommended
          </span>
        );
      case 'CONDITIONAL':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Conditional
          </span>
        );
      case 'SKIP THIS PATH':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Skip This Path
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              {getTypeIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {recommendation.title}
                </h3>
                {getRecommendationBadge()}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center text-sm text-gray-600">
                  <Clock className="mr-1 h-4 w-4" />
                  {recommendation.timeline}
                </span>
                <span className="inline-flex items-center text-sm text-gray-600">
                  Success probability: {(recommendation.successProbability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="mt-4">
          <p className="text-gray-600">{recommendation.notes}</p>
        </div>

        {/* Salary Projection */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="text-sm font-medium text-gray-500">Current</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {formatCurrency(recommendation.salaryProjection.current)}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-sm font-medium text-green-700">Year 1</div>
            <div className="mt-1 text-lg font-semibold text-green-900">
              {formatCurrency(recommendation.salaryProjection.year1)}
              <span className="ml-1 text-sm font-normal text-green-700">
                (+
                {(
                  ((recommendation.salaryProjection.year1 -
                    recommendation.salaryProjection.current) /
                    recommendation.salaryProjection.current) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm font-medium text-blue-700">Year 3</div>
            <div className="mt-1 text-lg font-semibold text-blue-900">
              {formatCurrency(recommendation.salaryProjection.year3)}
            </div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-sm font-medium text-purple-700">Year 5</div>
            <div className="mt-1 text-lg font-semibold text-purple-900">
              {formatCurrency(recommendation.salaryProjection.year5)}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Steps */}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h4 className="mb-4 font-medium text-gray-900">Implementation Plan</h4>
            <div className="space-y-4">
              {recommendation.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {step.phase}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{step.action}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {step.effort}
                      </div>
                      {step.cost > 0 && (
                        <div className="text-sm text-gray-600">
                          Cost: ₹{step.cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Expected Outcome
                      </div>
                      <div className="mt-1 text-sm text-gray-900">
                        {step.expectedOutcome}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Market Value
                      </div>
                      <div className="mt-1 text-sm font-medium text-green-700">
                        {step.marketValue}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vulnerabilities */}
          {recommendation.vulnerabilities.length > 0 && (
            <div className="border-t border-gray-200 bg-red-50 p-6">
              <h4 className="mb-4 font-medium text-gray-900">Potential Risks</h4>
              <div className="space-y-3">
                {recommendation.vulnerabilities.map((vuln, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded-lg p-3',
                      vuln.severity === 'High'
                        ? 'bg-red-100'
                        : vuln.severity === 'Medium'
                        ? 'bg-yellow-100'
                        : 'bg-blue-100'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium text-gray-900">
                            {vuln.risk}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          Mitigation: {vuln.mitigation}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-medium',
                          vuln.severity === 'High'
                            ? 'bg-red-200 text-red-900'
                            : vuln.severity === 'Medium'
                            ? 'bg-yellow-200 text-yellow-900'
                            : 'bg-blue-200 text-blue-900'
                        )}
                      >
                        {vuln.severity} severity
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationCard;