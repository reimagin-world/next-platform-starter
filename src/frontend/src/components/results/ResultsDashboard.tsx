// src/frontend/src/components/results/ResultsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/api';
import { structuredLogger } from '../../utils/logger';
import PDFReportGenerator from './PDFReportGenerator';
import RiskVisualization from './RiskVisualization';
import MarketInsights from './MarketInsights';
import SkillGapAnalysis from './SkillGapAnalysis';
import CareerRoadmap from './CareerRoadmap';
import './ResultsDashboard.css';

interface AssessmentResult {
  id: string;
  userId: string;
  resumeData: any;
  assessmentData: any;
  riskScore: number;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  intelligenceNarratives?: any;
}

const ResultsDashboard: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'market' | 'skills' | 'roadmap'>('overview');
  const { user } = useAuth();
  const { showErrorNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentResult();
    }
  }, [assessmentId]);

  const fetchAssessmentResult = async () => {
    try {
      setLoading(true);
      structuredLogger.logUserJourney({
        service: 'ResultsDashboard',
        action: 'fetchAssessmentResult',
        userId: user?.userId,
        assessmentId,
        metadata: { timestamp: new Date().toISOString() }
      });

      const response = await apiClient.get(`/api/assessments/${assessmentId}/result`);
      setResult(response.data);

      structuredLogger.logUserJourney({
        service: 'ResultsDashboard',
        action: 'receiveAssessmentResult',
        userId: user?.userId,
        assessmentId,
        metadata: {
          success: true,
          riskScore: response.data.riskScore,
          hasNarratives: !!response.data.intelligenceNarratives
        }
      });
    } catch (error: any) {
      structuredLogger.error('ResultsDashboard', 'Failed to fetch assessment result', {
        userId: user?.userId,
        assessmentId,
        error: error.message,
        responseStatus: error.response?.status
      });

      showErrorNotification({
        title: 'Failed to Load Results',
        message: 'Unable to fetch your assessment results. Please try again.',
        duration: 5000
      });

      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReportGenerated = (reportId: string) => {
    structuredLogger.logUserJourney({
      service: 'ResultsDashboard',
      action: 'reportGeneratedFromDashboard',
      userId: user?.userId,
      assessmentId,
      metadata: { reportId }
    });

    // Refresh to show new report in list
    fetchAssessmentResult();
  };

  if (loading) {
    return (
      <div className="results-loading" role="status" aria-label="Loading results">
        <div className="loading-spinner"></div>
        <p className="loading-text">Processing your career risk assessment...</p>
        <p className="loading-subtext">This may take a few moments</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-error" role="alert">
        <h2>Assessment Not Found</h2>
        <p>Unable to find the requested assessment results.</p>
        <button
          className="primary-button"
          onClick={() => navigate('/dashboard')}
          aria-label="Go back to dashboard"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="results-dashboard" role="main" aria-label="Career Risk Assessment Results">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Your Career Risk Assessment</h1>
          <p className="dashboard-subtitle">
            Generated on {new Date(result.generatedAt).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="risk-score-banner">
        <div className="score-container">
          <div className="score-value" aria-label={`Overall risk score: ${result.riskScore} out of 100`}>
            {result.riskScore}
            <span className="score-label">/100</span>
          </div>
          <div className="score-description">
            <h3 className="score-title">Overall Career Risk Score</h3>
            <p className="score-interpretation">
              {result.riskScore <= 30 ? 'Low Risk' :
               result.riskScore <= 60 ? 'Moderate Risk' : 'High Risk'}
            </p>
          </div>
        </div>
        <div className="score-actions">
          <button
            className="share-button"
            onClick={() => {/* Implement sharing */}}
            aria-label="Share results"
          >
            Share Results
          </button>
          <button
            className="save-button"
            onClick={() => {/* Implement saving */}}
            aria-label="Save to profile"
          >
            Save to Profile
          </button>
        </div>
      </div>

      <div className="dashboard-tabs" role="tablist" aria-label="Assessment sections">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          role="tab"
          aria-selected={activeTab === 'overview'}
          aria-controls="overview-panel"
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
          role="tab"
          aria-selected={activeTab === 'risk'}
          aria-controls="risk-panel"
        >
          Risk Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
          role="tab"
          aria-selected={activeTab === 'market'}
          aria-controls="market-panel"
        >
          Market Insights
        </button>
        <button
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
          role="tab"
          aria-selected={activeTab === 'skills'}
          aria-controls="skills-panel"
        >
          Skills Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
          role="tab"
          aria-selected={activeTab === 'roadmap'}
          aria-controls="roadmap-panel"
        >
          Career Roadmap
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div id="overview-panel" role="tabpanel" aria-labelledby="overview-tab">
            <div className="overview-grid">
              <div className="overview-card">
                <h3 className="card-title">Executive Summary</h3>
                <div className="card-content">
                  {result.intelligenceNarratives?.executiveSummary ? (
                    <p>{result.intelligenceNarratives.executiveSummary.overview}</p>
                  ) : (
                    <p>Your career risk assessment is complete. Review the detailed analysis in each section below.</p>
                  )}
                </div>
              </div>

              <div className="overview-card">
                <h3 className="card-title">Key Recommendations</h3>
                <div className="card-content">
                  <ul className="recommendations-list">
                    <li>Review your skill gaps in the Skills Analysis section</li>
                    <li>Explore market opportunities in Market Insights</li>
                    <li>Follow the personalized roadmap for career growth</li>
                    <li>Generate a detailed PDF report for offline review</li>
                  </ul>
                </div>
              </div>
            </div>

            <PDFReportGenerator
              assessmentId={assessmentId!}
              resumeData={result.resumeData}
              assessmentData={result.assessmentData}
              onComplete={handleReportGenerated}
            />
          </div>
        )}

        {activeTab === 'risk' && (
          <div id="risk-panel" role="tabpanel" aria-labelledby="risk-tab">
            <RiskVisualization
              riskScore={result.riskScore}
              riskData={result.intelligenceNarratives?.riskAnalysis}
            />
          </div>
        )}

        {activeTab === 'market' && (
          <div id="market-panel" role="tabpanel" aria-labelledby="market-tab">
            <MarketInsights
              marketData={result.intelligenceNarratives?.marketContext}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <div id="skills-panel" role="tabpanel" aria-labelledby="skills-tab">
            <SkillGapAnalysis
              resumeData={result.resumeData}
              skillData={result.intelligenceNarratives?.skillGapAnalysis}
            />
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div id="roadmap-panel" role="tabpanel" aria-labelledby="roadmap-tab">
            <CareerRoadmap
              roadmapData={result.intelligenceNarratives?.personalizedRoadmap}
            />
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <div className="footer-actions">
          <button
            className="primary-button"
            onClick={() => navigate('/assessments/new')}
            aria-label="Start new assessment"
          >
            Start New Assessment
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate('/dashboard/reports')}
            aria-label="View all reports"
          >
            View All Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
