// src/backend/src/routes/pdf.routes.ts
import express from 'express';
import { getPDFReportService } from '../services/pdf/PDFReportService';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { logger, structuredLogger } from '../utils/logger';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for PDF generation
const pdfGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 PDF generations per windowMs
  message: 'Too many PDF generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip;
  }
});

// Generate enhanced PDF report
router.post(
  '/generate-enhanced',
  authenticate,
  pdfGenerationLimiter,
  validateRequest({
    body: {
      resumeData: 'object',
      assessmentData: 'object',
      options: 'object?'
    }
  }),
  async (req, res) => {
    try {
      const { resumeData, assessmentData, options } = req.body;
      const userId = (req as any).user.userId;
      const sessionId = req.headers['x-session-id'] as string || 'unknown';

      structuredLogger.logUserJourney({
        service: 'PDFRoutes',
        action: 'requestEnhancedPDF',
        userId,
        sessionId,
        metadata: {
          hasOptions: !!options,
          resumeFields: Object.keys(resumeData || {}).length,
          assessmentFields: Object.keys(assessmentData || {}).length
        }
      });

      const pdfService = getPDFReportService();

      // Queue PDF generation (non-blocking)
      const result = await pdfService.generateEnhancedPDFReport(
        userId,
        sessionId,
        resumeData,
        assessmentData
      );

      // Set appropriate headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="career-risk-report-${userId}-${Date.now()}.pdf"`,
        'Content-Length': result.pdfBuffer.length,
        'X-Report-ID': result.metadata.reportId,
        'X-Report-Version': result.metadata.reportVersion,
        'X-Generated-At': result.metadata.generatedAt,
        'X-Enhanced-Report': 'true'
      });

      // Send PDF buffer
      res.send(result.pdfBuffer);

      structuredLogger.logUserJourney({
        service: 'PDFRoutes',
        action: 'deliverEnhancedPDF',
        userId,
        sessionId,
        metadata: {
          ...result.metadata,
          deliverySize: result.pdfBuffer.length,
          deliveryTime: Date.now()
        }
      });

    } catch (error) {
      structuredLogger.error('PDFRoutes', 'Enhanced PDF generation failed', {
        userId: (req as any).user?.userId,
        sessionId: req.headers['x-session-id'],
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF report',
        message: error instanceof Error ? error.message : 'Internal server error',
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Get PDF generation status
router.get(
  '/status',
  authenticate,
  async (req, res) => {
    try {
      const pdfService = getPDFReportService();
      const status = await pdfService.getGenerationStatus();

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      structuredLogger.error('PDFRoutes', 'Failed to get PDF generation status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get PDF generation status'
      });
    }
  }
);

// Download previously generated report
router.get(
  '/download/:reportId',
  authenticate,
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const userId = (req as any).user.userId;

      // In a real implementation, this would fetch from storage
      // For now, return a placeholder
      res.status(501).json({
        success: false,
        error: 'Report storage not implemented yet',
        reportId,
        message: 'This endpoint will be available in the next update'
      });
    } catch (error) {
      structuredLogger.error('PDFRoutes', 'Failed to download report', {
        reportId: req.params.reportId,
        userId: (req as any).user?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to download report'
      });
    }
  }
);

// Health check for PDF service
router.get(
  '/health',
  async (req, res) => {
    try {
      const pdfService = getPDFReportService();
      const status = await pdfService.getGenerationStatus();

      res.json({
        success: true,
        service: 'pdf-generation',
        status: 'healthy',
        workers: status.workerCount,
        queue: status.queueSize,
        active: status.activeTasks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        service: 'pdf-generation',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
