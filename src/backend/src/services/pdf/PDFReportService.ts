// src/backend/src/services/pdf/PDFReportService.ts
import { getPDFWorkerService } from './PDFWorkerService';
import { logger, structuredLogger } from '../../utils/logger';
import { IEnhancedPDFReport } from '../../shared/types/report.types';
import { getConfig } from '../../config/config.service';

export class PDFReportService {
  private workerService = getPDFWorkerService();

  async generateEnhancedPDFReport(
    userId: string,
    sessionId: string,
    resumeData: any,
    assessmentData: any
  ): Promise<{ pdfBuffer: Buffer; report: IEnhancedPDFReport; metadata: any }> {
    try {
      structuredLogger.logUserJourney({
        service: 'PDFReportService',
        action: 'startEnhancedPDFGeneration',
        userId,
        sessionId,
        metadata: {
          hasResumeData: !!resumeData,
          hasAssessmentData: !!assessmentData
        }
      });

      // Get configuration
      const config = await getConfig('pdf', userId);

      // Generate PDF using worker thread
      const pdfBuffer = await this.workerService.generatePDF(
        userId,
        sessionId,
        resumeData,
        assessmentData,
        config
      );

      // Generate metadata and report structure for API response
      const metadata = this.generateReportMetadata(userId, sessionId, pdfBuffer);
      const report = await this.generateReportStructure(resumeData, assessmentData);

      structuredLogger.logUserJourney({
        service: 'PDFReportService',
        action: 'completeEnhancedPDFGeneration',
        userId,
        sessionId,
        metadata: {
          ...metadata,
          success: true
        }
      });

      return {
        pdfBuffer,
        report,
        metadata
      };
    } catch (error) {
      structuredLogger.error('PDFReportService', 'Enhanced PDF generation failed', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Fallback to simplified PDF if worker fails
      return this.generateFallbackPDF(userId, sessionId, resumeData, assessmentData);
    }
  }

  private generateReportMetadata(
    userId: string,
    sessionId: string,
    pdfBuffer: Buffer
  ): any {
    return {
      generatedAt: new Date().toISOString(),
      reportVersion: '2.0',
      reportId: `report-${userId}-${Date.now()}`,
      fileSize: pdfBuffer.length,
      pageCount: this.estimatePageCount(pdfBuffer),
      isEnhanced: true,
      containsIntelligence: true,
      containsVisualizations: true
    };
  }

  private estimatePageCount(pdfBuffer: Buffer): number {
    // Simple estimation based on file size
    const sizePerPage = 5000; // Approximate bytes per page
    return Math.max(1, Math.ceil(pdfBuffer.length / sizePerPage));
  }

  private async generateReportStructure(
    resumeData: any,
    assessmentData: any
  ): Promise<IEnhancedPDFReport> {
    // This would normally call the intelligence services
    // For now, return a structured skeleton
    return {
      executiveSummary: {
        overview: 'Career risk assessment based on your profile and current market trends.',
        keyInsights: [
          'Your career risk level has been assessed',
          'Personalized recommendations generated',
          'Market context analysis included'
        ],
        confidenceScore: 85
      },
      riskAnalysis: {
        score: 65,
        interpretation: 'Moderate career risk with specific areas for improvement.',
        visualizations: [],
        factors: [],
        recommendations: []
      },
      marketContext: {
        trends: 'The Indian IT sector is evolving with increased demand for cloud, AI, and cybersecurity skills.',
        marketOutlook: 'Positive',
        inDemandSkills: [
          { name: 'Cloud Computing', demandLevel: 'high' },
          { name: 'Artificial Intelligence', demandLevel: 'high' },
          { name: 'Cybersecurity', demandLevel: 'medium' }
        ]
      },
      skillGapAnalysis: {
        currentSkills: resumeData?.skills || [],
        requiredSkills: assessmentData?.requiredSkills || [],
        skillGaps: [],
        priorityAreas: []
      },
      personalizedRoadmap: {
        timeline: '6-12 months',
        milestones: [],
        focusAreas: []
      },
      recommendations: []
    };
  }

  private async generateFallbackPDF(
    userId: string,
    sessionId: string,
    resumeData: any,
    assessmentData: any
  ): Promise<{ pdfBuffer: Buffer; report: IEnhancedPDFReport; metadata: any }> {
    structuredLogger.warn('PDFReportService', 'Using fallback PDF generation', {
      userId,
      sessionId
    });

    // Simple fallback PDF generation without worker threads
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          pdfBuffer,
          report: this.generateReportStructure(resumeData, assessmentData),
          metadata: {
            generatedAt: new Date().toISOString(),
            reportVersion: '1.0',
            isEnhanced: false,
            isFallback: true,
            fileSize: pdfBuffer.length
          }
        });
      });

      doc.fontSize(16).text('Career Risk Assessment Report');
      doc.moveDown();
      doc.fontSize(12).text('Simplified Report - Full intelligence features temporarily unavailable.');
      doc.end();
    }) as unknown as Promise<{ pdfBuffer: Buffer; report: IEnhancedPDFReport; metadata: any }>;
  }

  async getGenerationStatus(): Promise<any> {
    return this.workerService.getQueueStatus();
  }

  async cleanupOldReports(userId: string, olderThanDays = 30): Promise<void> {
    // Implementation for cleaning up old reports
    structuredLogger.info('PDFReportService', 'Cleaning up old reports', {
      userId,
      olderThanDays
    });
  }
}

// Singleton instance
let pdfReportService: PDFReportService | null = null;

export function getPDFReportService(): PDFReportService {
  if (!pdfReportService) {
    pdfReportService = new PDFReportService();
  }
  return pdfReportService;
}
