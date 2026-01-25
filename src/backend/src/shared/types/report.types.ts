export interface IExecutiveSummary {
  overview: string;
  keyInsights: string[];
  confidenceScore: number;
  riskCategory?: 'low' | 'medium' | 'high';
  summaryBullets?: string[];
}

export interface IRiskAnalysis {
  score: number;
  interpretation: string;
  visualizations: IChartData[];
  factors: IRiskFactor[];
  recommendations: string[];
  timeline?: string;
}

export interface IMarketAnalysis {
  trends: string;
  inDemandSkills: ISkillDemand[];
  marketOutlook: string;
  regionalInsights?: IRegionalInsight[];
  salaryTrends?: ISalaryTrend[];
}

export interface ISkillNarrative {
  currentSkills: string[];
  requiredSkills: string[];
  skillGaps: ISkillGap[];
  priorityAreas: string[];
  learningPath?: ILearningPath[];
  certificationRecommendations?: ICertification[];
}

export interface IRoadmapGeneration {
  timeline: string;
  milestones: IMilestone[];
  focusAreas: string[];
  quarterlyGoals?: IQuarterlyGoal[];
  successMetrics?: IMetric[];
}

export interface IActionableInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  actions: string[];
  impactScore?: number;
  effortLevel?: 'low' | 'medium' | 'high';
}

export interface IEnhancedPDFReport {
  executiveSummary: IExecutiveSummary;
  riskAnalysis: IRiskAnalysis;
  marketContext: IMarketAnalysis;
  skillGapAnalysis: ISkillNarrative;
  personalizedRoadmap: IRoadmapGeneration;
  recommendations: IActionableInsight[];
  metadata?: IReportMetadata;
}

export interface IReportMetadata {
  generatedAt: string;
  reportVersion: string;
  reportId: string;
  fileSize: number;
  pageCount: number;
  isEnhanced: boolean;
  containsIntelligence: boolean;
  containsVisualizations: boolean;
  processingTime?: number;
}

// Supporting types
export interface IChartData {
  type: 'bar' | 'line' | 'pie' | 'radar';
  data: number[];
  labels: string[];
  title: string;
}

export interface IRiskFactor {
  factor: string;
  impact: number;
  description: string;
  mitigation: string;
}

export interface ISkillDemand {
  name: string;
  demandLevel: 'low' | 'medium' | 'high' | 'critical';
  growthRate?: number;
  averageSalary?: number;
}

export interface IRegionalInsight {
  region: string;
  demand: string;
  opportunities: string[];
}

export interface ISalaryTrend {
  role: string;
  currentAverage: number;
  projectedGrowth: number;
  experienceRange: string;
}

export interface ISkillGap {
  currentSkill: string;
  requiredSkill: string;
  gapLevel: 'small' | 'medium' | 'large';
  priority: 'high' | 'medium' | 'low';
  learningResources?: string[];
}

export interface ILearningPath {
  skill: string;
  resources: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ICertification {
  name: string;
  provider: string;
  relevance: number;
  cost?: number;
  duration?: string;
}

export interface IMilestone {
  title: string;
  description: string;
  timeline: string;
  actions: string[];
  successCriteria: string[];
}

export interface IQuarterlyGoal {
  quarter: string;
  goals: string[];
  metrics: string[];
}

export interface IMetric {
  name: string;
  target: number;
  current: number;
  unit: string;
}
