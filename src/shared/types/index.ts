// SHARED TYPES
export interface ReportContent {
  executiveSummary: string;
  riskAnalysis: { score: number };
  recommendations: { title: string; description: string }[];
}

export interface PDFGenerationRequest {
  reportId: string;
  data: ReportContent;
}

export interface PDFGenerationResult {
  url: string;
  status: 'completed' | 'failed';
}
