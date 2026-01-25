"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEnhancedPDF = generateEnhancedPDF;
exports.generateIntelligenceNarratives = generateIntelligenceNarratives;
// src/backend/src/services/pdf/PDFWorker.ts
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../../utils/logger");
const pdfkit_1 = __importDefault(require("pdfkit"));
const executiveSummaryService_1 = require("../../services/intelligence/executiveSummaryService");
const riskAnalysisService_1 = require("../../services/intelligence/riskAnalysisService");
const marketAnalysisService_1 = require("../../services/intelligence/marketAnalysisService");
const skillNarrativeService_1 = require("../../services/intelligence/skillNarrativeService");
const roadmapService_1 = require("../../services/intelligence/roadmapService");
if (!worker_threads_1.isMainThread && worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on('message', async (task) => {
        try {
            logger_1.structuredLogger.logUserJourney({
                service: 'PDFWorker',
                action: 'startPDFGeneration',
                userId: task.userId,
                sessionId: task.sessionId,
                metadata: { workerThread: true }
            });
            // Generate intelligence narratives
            const intelligenceNarratives = await generateIntelligenceNarratives(task.resumeData, task.assessmentData, task.userId, task.sessionId);
            // Generate PDF with intelligence data
            const pdfBuffer = await generateEnhancedPDF(intelligenceNarratives, task.config);
            worker_threads_1.parentPort.postMessage({
                success: true,
                pdfBuffer,
                userId: task.userId,
                sessionId: task.sessionId
            });
            logger_1.structuredLogger.logUserJourney({
                service: 'PDFWorker',
                action: 'completePDFGeneration',
                userId: task.userId,
                sessionId: task.sessionId,
                metadata: {
                    success: true,
                    pdfSize: pdfBuffer.length,
                    workerThread: true
                }
            });
        }
        catch (error) {
            logger_1.structuredLogger.error('PDFWorker', 'PDF generation failed', {
                userId: task.userId,
                sessionId: task.sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            worker_threads_1.parentPort.postMessage({
                success: false,
                error: error instanceof Error ? error.message : 'PDF generation failed',
                userId: task.userId,
                sessionId: task.sessionId
            });
        }
    });
}
async function generateIntelligenceNarratives(resumeData, assessmentData, userId, sessionId) {
    try {
        const [executiveSummary, riskAnalysis, marketContext, skillGapAnalysis, personalizedRoadmap] = await Promise.all([
            (0, executiveSummaryService_1.generateExecutiveSummary)(resumeData, assessmentData, userId, sessionId),
            (0, riskAnalysisService_1.generateRiskAnalysis)(resumeData, assessmentData, userId, sessionId),
            (0, marketAnalysisService_1.generateMarketAnalysis)(resumeData, assessmentData, userId, sessionId),
            (0, skillNarrativeService_1.generateSkillNarrative)(resumeData, assessmentData, userId, sessionId),
            (0, roadmapService_1.generateRoadmap)(resumeData, assessmentData, userId, sessionId)
        ]);
        return {
            executiveSummary,
            riskAnalysis,
            marketContext,
            skillGapAnalysis,
            personalizedRoadmap,
            recommendations: generateActionableInsights(riskAnalysis, skillGapAnalysis, personalizedRoadmap)
        };
    }
    catch (error) {
        logger_1.structuredLogger.error('PDFWorker', 'Intelligence narrative generation failed', {
            userId,
            sessionId,
            error
        });
        throw error;
    }
}
function generateActionableInsights(riskAnalysis, skillGapAnalysis, roadmap) {
    // Generate actionable insights based on the analysis
    return [
        {
            id: 'insight-1',
            title: 'Immediate Risk Mitigation',
            description: 'Focus on acquiring these skills within 3 months to reduce career risk',
            priority: 'high',
            timeline: '3 months'
        },
        {
            id: 'insight-2',
            title: 'Strategic Career Investment',
            description: 'Long-term investments for career growth over the next 12 months',
            priority: 'medium',
            timeline: '12 months'
        }
    ];
}
async function generateEnhancedPDF(report, config) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                info: {
                    Title: 'Career Risk Assessment Report',
                    Author: 'Career Risk Calculator',
                    Subject: 'Personalized Career Risk Analysis',
                    Keywords: 'career, risk, assessment, IT, India',
                    CreationDate: new Date()
                }
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Add professional header
            addProfessionalHeader(doc, config);
            // Add executive summary
            addExecutiveSummary(doc, report.executiveSummary);
            // Add risk analysis with visualization
            addRiskAnalysis(doc, report.riskAnalysis);
            // Add market context
            addMarketContext(doc, report.marketContext);
            // Add skill gap analysis
            addSkillGapAnalysis(doc, report.skillGapAnalysis);
            // Add personalized roadmap
            addPersonalizedRoadmap(doc, report.personalizedRoadmap);
            // Add recommendations
            addRecommendations(doc, report.recommendations);
            // Add footer
            addFooter(doc, config);
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
}
function addProfessionalHeader(doc, config) {
    // Logo placeholder
    doc.fillColor('#1a365d')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Career Risk Assessment Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#2d3748')
        .fontSize(12)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    })}`, { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
    doc.moveDown(1);
}
function addExecutiveSummary(doc, summary) {
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Executive Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#2d3748')
        .fontSize(11)
        .font('Helvetica')
        .text(summary.overview, { align: 'justify' });
    doc.moveDown(0.5);
    doc.fillColor('#1a365d')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Key Insights:');
    doc.moveDown(0.25);
    summary.keyInsights.forEach((insight, index) => {
        doc.fillColor('#2d3748')
            .fontSize(10)
            .font('Helvetica')
            .text(`• ${insight}`);
    });
    doc.moveDown(1);
    addSectionSeparator(doc);
}
function addRiskAnalysis(doc, analysis) {
    doc.addPage();
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Career Risk Analysis', { underline: true });
    doc.moveDown(0.5);
    // Risk score visualization
    const riskScore = analysis.score;
    const riskLevel = getRiskLevel(riskScore);
    doc.fillColor('#2d3748')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Overall Risk Score: ${riskScore}/100`);
    doc.moveDown(0.5);
    // Draw risk meter
    const startX = 50;
    const y = doc.y;
    const width = 500;
    const height = 20;
    // Background
    doc.fillColor('#e2e8f0')
        .rect(startX, y, width, height)
        .fill();
    // Risk level indicator
    const riskWidth = (riskScore / 100) * width;
    const riskColor = getRiskColor(riskScore);
    doc.fillColor(riskColor)
        .rect(startX, y, riskWidth, height)
        .fill();
    // Border
    doc.strokeColor('#cbd5e0')
        .rect(startX, y, width, height)
        .stroke();
    // Labels
    doc.fillColor('#4a5568')
        .fontSize(9)
        .font('Helvetica')
        .text('Low Risk', startX - 20, y + 5)
        .text('High Risk', startX + width + 5, y + 5);
    doc.moveDown(2);
    // Risk interpretation
    doc.fillColor('#2d3748')
        .fontSize(11)
        .font('Helvetica')
        .text(analysis.interpretation, { align: 'justify' });
    doc.moveDown(1);
    addSectionSeparator(doc);
}
function addMarketContext(doc, marketContext) {
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Market Context & Industry Analysis', { underline: true });
    doc.moveDown(0.5);
    // Market trends
    doc.fillColor('#2b6cb0')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Current Indian IT Market Trends:');
    doc.moveDown(0.25);
    doc.fillColor('#2d3748')
        .fontSize(11)
        .font('Helvetica')
        .text(marketContext.trends, { align: 'justify' });
    doc.moveDown(0.5);
    // In-demand skills
    doc.fillColor('#2b6cb0')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Top In-Demand Skills:');
    doc.moveDown(0.25);
    marketContext.inDemandSkills.forEach((skill, index) => {
        doc.fillColor('#2d3748')
            .fontSize(10)
            .font('Helvetica')
            .text(`${index + 1}. ${skill.name} - ${skill.demandLevel} demand`);
    });
    doc.moveDown(1);
    addSectionSeparator(doc);
}
function addSkillGapAnalysis(doc, analysis) {
    doc.addPage();
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Skill Gap Analysis', { underline: true });
    doc.moveDown(0.5);
    // Current vs required skills
    const tableTop = doc.y;
    const firstCol = 50;
    const secondCol = 250;
    const thirdCol = 400;
    // Table header
    doc.fillColor('#2c5282')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Current Skills', firstCol, tableTop)
        .text('Required Skills', secondCol, tableTop)
        .text('Gap Priority', thirdCol, tableTop);
    doc.moveDown(0.75);
    // Table rows
    let y = doc.y;
    analysis.skillGaps.forEach((gap, index) => {
        if (y > 700) { // Check if we need new page
            doc.addPage();
            y = 50;
        }
        doc.fillColor('#2d3748')
            .fontSize(10)
            .font('Helvetica')
            .text(gap.currentSkill || 'Not assessed', firstCol, y)
            .text(gap.requiredSkill, secondCol, y)
            .text(gap.priority, thirdCol, y);
        y += 20;
    });
    doc.y = y;
    doc.moveDown(1);
    addSectionSeparator(doc);
}
function addPersonalizedRoadmap(doc, roadmap) {
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Personalized Career Roadmap', { underline: true });
    doc.moveDown(0.5);
    roadmap.milestones.forEach((milestone, index) => {
        doc.fillColor('#2b6cb0')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${milestone.timeline}: ${milestone.title}`);
        doc.moveDown(0.25);
        doc.fillColor('#2d3748')
            .fontSize(10)
            .font('Helvetica')
            .text(milestone.description, { align: 'justify' });
        doc.moveDown(0.25);
        milestone.actions.forEach((action) => {
            doc.fillColor('#4a5568')
                .fontSize(9)
                .font('Helvetica')
                .text(`✓ ${action}`);
        });
        doc.moveDown(0.5);
    });
    doc.moveDown(1);
    addSectionSeparator(doc);
}
function addRecommendations(doc, recommendations) {
    doc.addPage();
    doc.fillColor('#1a365d')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('Actionable Recommendations', { underline: true });
    doc.moveDown(0.5);
    recommendations.forEach((rec, index) => {
        doc.fillColor(getPriorityColor(rec.priority))
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${rec.title} [${rec.priority.toUpperCase()} PRIORITY]`);
        doc.moveDown(0.25);
        doc.fillColor('#2d3748')
            .fontSize(11)
            .font('Helvetica')
            .text(rec.description, { align: 'justify' });
        doc.moveDown(0.25);
        doc.fillColor('#4a5568')
            .fontSize(10)
            .font('Helvetica-Italic')
            .text(`Timeline: ${rec.timeline}`);
        doc.moveDown(0.75);
    });
}
function addFooter(doc, config) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        // Footer line
        doc.strokeColor('#e2e8f0')
            .lineWidth(1)
            .moveTo(50, 780)
            .lineTo(550, 780)
            .stroke();
        // Confidential notice
        doc.fillColor('#718096')
            .fontSize(8)
            .font('Helvetica')
            .text('CONFIDENTIAL - For authorized use only', 50, 785, { align: 'left' });
        // Page number
        doc.text(`Page ${i + 1} of ${pageCount}`, 0, 785, { align: 'center' });
        // Generation timestamp
        doc.text(`Generated: ${new Date().toISOString()}`, 50, 785, { align: 'right', width: 500 });
    }
}
function addSectionSeparator(doc) {
    doc.strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
    doc.moveDown(1);
}
function getRiskLevel(score) {
    if (score <= 30)
        return 'Low';
    if (score <= 60)
        return 'Medium';
    return 'High';
}
function getRiskColor(score) {
    if (score <= 30)
        return '#48bb78'; // Green
    if (score <= 60)
        return '#ed8936'; // Orange
    return '#f56565'; // Red
}
function getPriorityColor(priority) {
    switch (priority.toLowerCase()) {
        case 'high': return '#f56565';
        case 'medium': return '#ed8936';
        case 'low': return '#48bb78';
        default: return '#4a5568';
    }
}
