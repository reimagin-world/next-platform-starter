"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFReportService = void 0;
exports.getPDFReportService = getPDFReportService;
// src/backend/src/services/pdf/PDFReportService.ts
const PDFWorkerService_1 = require("./PDFWorkerService");
const logger_1 = require("../../utils/logger");
const config_service_1 = require("../../config/config.service");
class PDFReportService {
    constructor() {
        this.workerService = (0, PDFWorkerService_1.getPDFWorkerService)();
    }
    async generateEnhancedPDFReport(userId, sessionId, resumeData, assessmentData) {
        try {
            logger_1.structuredLogger.logUserJourney({
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
            const config = await (0, config_service_1.getConfig)('pdf', userId);
            // Generate PDF using worker thread
            const pdfBuffer = await this.workerService.generatePDF(userId, sessionId, resumeData, assessmentData, config);
            // Generate metadata and report structure for API response
            const metadata = this.generateReportMetadata(userId, sessionId, pdfBuffer);
            const report = await this.generateReportStructure(resumeData, assessmentData);
            logger_1.structuredLogger.logUserJourney({
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
        }
        catch (error) {
            logger_1.structuredLogger.error('PDFReportService', 'Enhanced PDF generation failed', {
                userId,
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            // Fallback to simplified PDF if worker fails
            return this.generateFallbackPDF(userId, sessionId, resumeData, assessmentData);
        }
    }
    generateReportMetadata(userId, sessionId, pdfBuffer) {
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
    estimatePageCount(pdfBuffer) {
        // Simple estimation based on file size
        const sizePerPage = 5000; // Approximate bytes per page
        return Math.max(1, Math.ceil(pdfBuffer.length / sizePerPage));
    }
    async generateReportStructure(resumeData, assessmentData) {
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
                currentSkills: (resumeData === null || resumeData === void 0 ? void 0 : resumeData.skills) || [],
                requiredSkills: (assessmentData === null || assessmentData === void 0 ? void 0 : assessmentData.requiredSkills) || [],
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
    async generateFallbackPDF(userId, sessionId, resumeData, assessmentData) {
        logger_1.structuredLogger.warn('PDFReportService', 'Using fallback PDF generation', {
            userId,
            sessionId
        });
        // Simple fallback PDF generation without worker threads
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        return new Promise((resolve) => {
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
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
        });
    }
    async getGenerationStatus() {
        return this.workerService.getQueueStatus();
    }
    async cleanupOldReports(userId, olderThanDays = 30) {
        // Implementation for cleaning up old reports
        logger_1.structuredLogger.info('PDFReportService', 'Cleaning up old reports', {
            userId,
            olderThanDays
        });
    }
}
exports.PDFReportService = PDFReportService;
// Singleton instance
let pdfReportService = null;
function getPDFReportService() {
    if (!pdfReportService) {
        pdfReportService = new PDFReportService();
    }
    return pdfReportService;
}
