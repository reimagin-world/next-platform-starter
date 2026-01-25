import React from 'react';
import { useAssessmentStore } from '../store/assessmentStore';
import { Button } from '../components/common/Button';
import RiskMeter from '../components/results/RiskMeter';
import RecommendationCard from '../components/results/RecommendationCard';
import MarketInsightCard from '../components/results/MarketInsightCard';
import { Download, Share2, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPercentage } from '../utils/formatters';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentResult, clearForm } = useAssessmentStore();

  if (!currentResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">No Assessment Results Found</h2>
          <p className="mt-2 text-gray-600">Please complete an assessment to see results</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <Home className="mr-2 h-4 w-4" />
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  const {
    overallRiskScore,
    scores,
    riskBreakdown,
    recommendations,
    metadata,
    timestamp,
  } = currentResult;

  const handleNewAssessment = () => {
    clearForm();
    navigate('/');
  };

  const handleDownloadReport = () => {
    // Implement PDF generation
    console.log('Download report');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
            <p className="mt-2 text-gray-600">
              Calculated on {new Date(timestamp).toLocaleDateString()} •{' '}
              {metadata.processingTimeMs}ms processing time
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleNewAssessment}>
              <RefreshCw className="mr-2 h-4 w-4" />
              New Assessment
            </Button>
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button>
              <Share2 className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </div>

        {/* Risk Score Section */}
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">
                Overall Risk Score
              </h2>
              <div className="flex justify-center">
                <RiskMeter score={overallRiskScore} size="lg" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">
                Detailed Scores
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="text-sm font-medium text-blue-900">Core Skills</div>
                  <div className="mt-2 text-3xl font-bold text-blue-900">
                    {scores.categories.coreSkillScore}/100
                  </div>
                  <div className="mt-2 text-sm text-blue-700">
                    Proficiency in primary technologies
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-sm font-medium text-green-900">Specialization Risk</div>
                  <div className="mt-2 text-3xl font-bold text-green-900">
                    {scores.categories.specializationRisk}/100
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    Risk from narrow skill focus
                  </div>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="text-sm font-medium text-purple-900">Learning Potential</div>
                  <div className="mt-2 text-3xl font-bold text-purple-900">
                    {scores.categories.learningSkillPotential.potential}/100
                  </div>
                  <div className="mt-2 text-sm text-purple-700">
                    Readiness in {scores.categories.learningSkillPotential.readinessMonths} months
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="text-sm font-medium text-amber-900">Secondary Skills</div>
                  <div className="mt-2 text-3xl font-bold text-amber-900">
                    {scores.categories.secondarySkillScore}/30
                  </div>
                  <div className="mt-2 text-sm text-amber-700">
                    Competency in supporting skills
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Intelligence */}
        <div className="mb-8">
          <MarketInsightCard marketData={riskBreakdown} />
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Personalized Recommendations ({recommendations.length})
            </h2>
            <div className="text-sm text-gray-600">
              Confidence: {formatPercentage(metadata.confidence * 100)}
            </div>
          </div>
          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <RecommendationCard
                key={index}
                recommendation={rec}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-4 font-medium text-gray-900">Assessment Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 md:grid-cols-4">
            <div>
              <div className="font-medium">Algorithm Version</div>
              <div>{metadata.algorithmVersion}</div>
            </div>
            <div>
              <div className="font-medium">Data Sources</div>
              <div>{metadata.dataSourcesUsed.join(', ')}</div>
            </div>
            <div>
              <div className="font-medium">Processing Time</div>
              <div>{metadata.processingTimeMs}ms</div>
            </div>
            <div>
              <div className="font-medium">Timestamp</div>
              <div>{new Date(timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;