"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/backend/src/routes/pdf.routes.ts
const express_1 = __importDefault(require("express"));
const PDFReportService_1 = require("../services/pdf/PDFReportService");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const logger_1 = require("../utils/logger");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// Rate limiting for PDF generation
const pdfGenerationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each user to 5 PDF generations per windowMs
    message: 'Too many PDF generation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        var _a;
        return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.ip;
    }
});
// Generate enhanced PDF report
router.post('/generate-enhanced', auth_middleware_1.authenticate, pdfGenerationLimiter, (0, validation_middleware_1.validateRequest)({
    body: {
        resumeData: 'object',
        assessmentData: 'object',
        options: 'object?'
    }
}), async (req, res) => {
    var _a;
    try {
        const { resumeData, assessmentData, options } = req.body;
        const userId = req.user.userId;
        const sessionId = req.headers['x-session-id'] || 'unknown';
        logger_1.structuredLogger.logUserJourney({
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
        const pdfService = (0, PDFReportService_1.getPDFReportService)();
        // Queue PDF generation (non-blocking)
        const result = await pdfService.generateEnhancedPDFReport(userId, sessionId, resumeData, assessmentData);
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
        logger_1.structuredLogger.logUserJourney({
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
    }
    catch (error) {
        logger_1.structuredLogger.error('PDFRoutes', 'Enhanced PDF generation failed', {
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
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
});
// Get PDF generation status
router.get('/status', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const pdfService = (0, PDFReportService_1.getPDFReportService)();
        const status = await pdfService.getGenerationStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.structuredLogger.error('PDFRoutes', 'Failed to get PDF generation status', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get PDF generation status'
        });
    }
});
// Download previously generated report
router.get('/download/:reportId', auth_middleware_1.authenticate, async (req, res) => {
    var _a;
    try {
        const { reportId } = req.params;
        const userId = req.user.userId;
        // In a real implementation, this would fetch from storage
        // For now, return a placeholder
        res.status(501).json({
            success: false,
            error: 'Report storage not implemented yet',
            reportId,
            message: 'This endpoint will be available in the next update'
        });
    }
    catch (error) {
        logger_1.structuredLogger.error('PDFRoutes', 'Failed to download report', {
            reportId: req.params.reportId,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to download report'
        });
    }
});
// Health check for PDF service
router.get('/health', async (req, res) => {
    try {
        const pdfService = (0, PDFReportService_1.getPDFReportService)();
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            service: 'pdf-generation',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
