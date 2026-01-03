// src/backend/src/services/pdf/PDFWorker.ts
import { parentPort, workerData, isMainThread } from 'worker_threads';
import { logger, structuredLogger } from '../../utils/logger';
import PDFDocument from 'pdfkit';
import { IEnhancedPDFReport } from '../../../shared/types/report.types';
import { generateExecutiveSummary } from '../../services/intelligence/executiveSummaryService';
import { generateRiskAnalysis } from '../../services/intelligence/riskAnalysisService';
import { generateMarketAnalysis } from '../../services/intelligence/marketAnalysisService';
import { generateSkillNarrative } from '../../services/intelligence/skillNarrativeService';
import { generateRoadmap } from '../../services/intelligence/roadmapService';

interface PDFGenerationTask {
  userId: string;
  sessionId: string;
  resumeData: any;
  assessmentData: any;
  config: any;
}

if (!isMainThread && parentPort) {
  parentPort.on('message', async (task: PDFGenerationTask) => {
    try {
      structuredLogger.logUserJourney({
        service: 'PDFWorker',
        action: 'startPDFGeneration',
        userId: task.userId,
        sessionId: task.sessionId,
        metadata: { workerThread: true }
      });

      // Generate intelligence narratives
      const intelligenceNarratives = await generateIntelligenceNarratives(
        task.resumeData,
        task.assessmentData,
        task.userId,
        task.sessionId
      );

      // Generate PDF with intelligence data
      const pdfBuffer = await generateEnhancedPDF(intelligenceNarratives, task.config);

      parentPort!.postMessage({
        success: true,
        pdfBuffer,
        userId: task.userId,
        sessionId: task.sessionId
      });

      structuredLogger.logUserJourney({
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

    } catch (error) {
      structuredLogger.error('PDFWorker', 'PDF generation failed', {
        userId: task.userId,
        sessionId: task.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      parentPort!.postMessage({
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
        userId: task.userId,
        sessionId: task.sessionId
      });
    }
  });
}

async function generateIntelligenceNarratives(
  resumeData: any,
  assessmentData: any,
  userId: string,
  sessionId: string
): Promise<IEnhancedPDFReport> {
  try {
    const [
      executiveSummary,
      riskAnalysis,
      marketContext,
      skillGapAnalysis,
      personalizedRoadmap
    ] = await Promise.all([
      generateExecutiveSummary(resumeData, assessmentData, userId, sessionId),
      generateRiskAnalysis(resumeData, assessmentData, userId, sessionId),
      generateMarketAnalysis(resumeData, assessmentData, userId, sessionId),
      generateSkillNarrative(resumeData, assessmentData, userId, sessionId),
      generateRoadmap(resumeData, assessmentData, userId, sessionId)
    ]);

    return {
      executiveSummary,
      riskAnalysis,
      marketContext,
      skillGapAnalysis,
      personalizedRoadmap,
      recommendations: generateActionableInsights(
        riskAnalysis,
        skillGapAnalysis,
        personalizedRoadmap
      )
    };
  } catch (error) {
    structuredLogger.error('PDFWorker', 'Intelligence narrative generation failed', {
      userId,
      sessionId,
      error
    });
    throw error;
  }
}

function generateActionableInsights(
  riskAnalysis: any,
  skillGapAnalysis: any,
  roadmap: any
): any[] {
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

async function generateEnhancedPDF(
  report: IEnhancedPDFReport,
  config: any
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
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

      const chunks: Buffer[] = [];

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
    } catch (error) {
      reject(error);
    }
  });
}

function addProfessionalHeader(doc: PDFKit.PDFDocument, config: any): void {
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

function addExecutiveSummary(doc: PDFKit.PDFDocument, summary: any): void {
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
  summary.keyInsights.forEach((insight: string, index: number) => {
    doc.fillColor('#2d3748')
       .fontSize(10)
       .font('Helvetica')
       .text(`• ${insight}`);
  });

  doc.moveDown(1);
  addSectionSeparator(doc);
}

function addRiskAnalysis(doc: PDFKit.PDFDocument, analysis: any): void {
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

function addMarketContext(doc: PDFKit.PDFDocument, marketContext: any): void {
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
  marketContext.inDemandSkills.forEach((skill: any, index: number) => {
    doc.fillColor('#2d3748')
       .fontSize(10)
       .font('Helvetica')
       .text(`${index + 1}. ${skill.name} - ${skill.demandLevel} demand`);
  });

  doc.moveDown(1);
  addSectionSeparator(doc);
}

function addSkillGapAnalysis(doc: PDFKit.PDFDocument, analysis: any): void {
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
  analysis.skillGaps.forEach((gap: any, index: number) => {
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

function addPersonalizedRoadmap(doc: PDFKit.PDFDocument, roadmap: any): void {
  doc.fillColor('#1a365d')
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('Personalized Career Roadmap', { underline: true });

  doc.moveDown(0.5);

  roadmap.milestones.forEach((milestone: any, index: number) => {
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
    milestone.actions.forEach((action: string) => {
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

function addRecommendations(doc: PDFKit.PDFDocument, recommendations: any[]): void {
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

function addFooter(doc: PDFKit.PDFDocument, config: any): void {
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

function addSectionSeparator(doc: PDFKit.PDFDocument): void {
  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke();

  doc.moveDown(1);
}

function getRiskLevel(score: number): string {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  return 'High';
}

function getRiskColor(score: number): string {
  if (score <= 30) return '#48bb78'; // Green
  if (score <= 60) return '#ed8936'; // Orange
  return '#f56565'; // Red
}

function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high': return '#f56565';
    case 'medium': return '#ed8936';
    case 'low': return '#48bb78';
    default: return '#4a5568';
  }
}

// For testing purposes
export { generateEnhancedPDF, generateIntelligenceNarratives };
