// src/frontend/src/components/results/PDFReportGenerator.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/api';
import { structuredLogger } from '../../utils/logger';
import './PDFReportGenerator.css';

interface PDFReportGeneratorProps {
  assessmentId: string;
  resumeData: any;
  assessmentData: any;
  onComplete?: (reportId: string) => void;
  onError?: (error: Error) => void;
}

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  assessmentId,
  resumeData,
  assessmentData,
  onComplete,
  onError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');

  const { user } = useAuth();
  const { showNotification, showErrorNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'success' && downloadUrl) {
      // Trigger download automatically
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `career-risk-report-${user?.userId || 'user'}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 100);
    }
  }, [status, downloadUrl, user]);

  const generateReport = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setStatus('generating');
    setProgress(10);
    setErrorMessage('');

    structuredLogger.logUserJourney({
      service: 'PDFReportGenerator',
      action: 'startReportGeneration',
      userId: user?.userId,
      assessmentId,
      metadata: {
        hasResumeData: !!resumeData,
        hasAssessmentData: !!assessmentData
      }
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.random() * 10;
          return next < 90 ? next : 90;
        });
      }, 500);

      // Generate PDF
      const response = await apiClient.post(
        '/api/pdf/generate-enhanced',
        {
          resumeData,
          assessmentData,
          options: {
            includeVisualizations: true,
            includeMarketAnalysis: true,
            includeActionableInsights: true
          }
        },
        {
          responseType: 'blob',
          headers: {
            'X-Session-ID': sessionStorage.getItem('sessionId') || 'unknown'
          },
          onUploadProgress: () => {
            setProgress(30);
          }
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Create blob and download URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Extract report ID from headers
      const reportId = response.headers['x-report-id'] || `report-${Date.now()}`;
      const generatedAt = response.headers['x-generated-at'] || new Date().toISOString();
      const isEnhanced = response.headers['x-enhanced-report'] === 'true';

      setDownloadUrl(url);
      setReportId(reportId);
      setStatus('success');

      structuredLogger.logUserJourney({
        service: 'PDFReportGenerator',
        action: 'completeReportGeneration',
        userId: user?.userId,
        assessmentId,
        metadata: {
          success: true,
          reportId,
          generatedAt,
          isEnhanced,
          fileSize: blob.size
        }
      });

      showNotification({
        type: 'success',
        title: 'Report Generated Successfully',
        message: 'Your career risk assessment report has been downloaded.',
        duration: 5000
      });

      if (onComplete) {
        onComplete(reportId);
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      setStatus('error');
      setProgress(0);

      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate report';
      setErrorMessage(errorMsg);

      structuredLogger.error('PDFReportGenerator', 'Report generation failed', {
        userId: user?.userId,
        assessmentId,
        error: errorMsg,
        responseStatus: error.response?.status
      });

      showErrorNotification({
        title: 'Report Generation Failed',
        message: errorMsg,
        duration: 8000
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'generating':
        return 'Generating your professional report...';
      case 'success':
        return 'Report generated successfully! Downloading...';
      case 'error':
        return 'Failed to generate report';
      default:
        return 'Ready to generate report';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📄';
    }
  };

  return (
    <div className="pdf-report-generator" role="region" aria-label="PDF Report Generator">
      <div className="generator-header">
        <h2 className="generator-title">Professional PDF Report</h2>
        <p className="generator-description">
          Generate an executive-grade PDF report with your complete career risk analysis,
          market insights, and personalized recommendations.
        </p>
      </div>

      <div className="generator-content">
        <div className="status-display" aria-live="polite">
          <div className="status-icon">{getStatusIcon()}</div>
          <div className="status-info">
            <h3 className="status-title">{getStatusMessage()}</h3>
            {status === 'generating' && (
              <p className="status-detail">
                Processing intelligence narratives and creating professional layout...
              </p>
            )}
            {status === 'error' && errorMessage && (
              <p className="error-detail">{errorMessage}</p>
            )}
          </div>
        </div>

        {status === 'generating' && (
          <div className="progress-container">
            <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
                aria-label={`Progress: ${Math.round(progress)}%`}
              />
            </div>
            <div className="progress-label">{Math.round(progress)}%</div>
          </div>
        )}

        <div className="report-features">
          <h4 className="features-title">This report includes:</h4>
          <ul className="features-list" aria-label="Report features">
            <li className="feature-item">✓ Executive Summary with key insights</li>
            <li className="feature-item">✓ Detailed Risk Analysis with visualizations</li>
            <li className="feature-item">✓ Indian IT Market Context Analysis</li>
            <li className="feature-item">✓ Skill Gap Analysis with priority areas</li>
            <li className="feature-item">✓ Personalized 12-Month Career Roadmap</li>
            <li className="feature-item">✓ Actionable Recommendations with timelines</li>
            <li className="feature-item">✓ Professional, executive-grade formatting</li>
          </ul>
        </div>

        <div className="generator-actions">
          <button
            className={`generate-button ${isGenerating ? 'generating' : ''}`}
            onClick={generateReport}
            disabled={isGenerating || status === 'generating'}
            aria-busy={isGenerating}
            aria-label={isGenerating ? 'Generating report...' : 'Generate PDF report'}
          >
            {isGenerating ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Generating...
              </>
            ) : (
              'Generate Professional Report'
            )}
          </button>

          {status === 'success' && (
            <div className="success-actions">
              <button
                className="secondary-button"
                onClick={() => navigate('/dashboard/reports')}
                aria-label="View all reports"
              >
                View All Reports
              </button>
              <button
                className="secondary-button"
                onClick={() => window.location.reload()}
                aria-label="Generate another report"
              >
                Generate Another
              </button>
            </div>
          )}

          {status === 'error' && (
            <button
              className="retry-button"
              onClick={generateReport}
              aria-label="Retry report generation"
            >
              Retry Generation
            </button>
          )}
        </div>

        <div className="disclaimer" role="contentinfo">
          <p className="disclaimer-text">
            <strong>Note:</strong> Report generation may take 30-60 seconds.
            Your report includes AI-powered insights based on current market data.
            For the most accurate analysis, ensure your profile information is up to date.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFReportGenerator;
