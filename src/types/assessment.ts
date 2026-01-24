export enum Proficiency {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum Relevance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum EducationLevel {
  HIGHSCHOOL = 'highschool',
  BACHELORS = 'bachelors',
  MASTERS = 'masters',
  PHD = 'phd'
}

export enum CompanySize {
  STARTUP = 'startup',
  SME = 'sme',
  ENTERPRISE = 'enterprise',
  FAANG = 'faang'
}

export interface Technology {
  id: string;
  name: string;
  experience: number; // Years
  proficiency: Proficiency;
  lastUsed: string; // ISO Date
  relevance: Relevance;
}

export interface CareerContext {
  currentRole: string;
  experienceYears: number;
  industries: string[];
  educationLevel: EducationLevel;
  companySize: CompanySize;
}

export interface LearningEvidence {
  certifications: string[];
  recentCourses: string[];
  sideProjects: number;
}

export interface MarketExposure {
  industries: string[];
  geographic: string[];
  companyTypes: string[];
}

export interface AssessmentRequest {
  userId: string;
  technologies: Technology[];
  careerContext?: CareerContext;
  learningEvidence?: LearningEvidence;
  marketExposure?: MarketExposure;
}

export interface RiskScore {
  overall: number;
  categories: {
    coreSkillScore: number;
    secondarySkillScore: number;
    learningSkillPotential: {
      potential: number;
      readinessMonths: number;
      recommendations: string[];
    };
    specializationRisk: number;
  };
}

export interface MarketIntelligence {
  skillObsolescence: 'LOW' | 'MEDIUM' | 'HIGH';
  marketSaturation: 'LOW' | 'MEDIUM' | 'HIGH';
  salaryTrend: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  jobMarketSize: number;
  marketGrowth: number;
  summary: string;
}

export interface RecommendationStep {
  phase: string;
  action: string;
  effort: string;
  cost: number;
  expectedOutcome: string;
  marketValue: string;
}

export interface Vulnerability {
  risk: string;
  mitigation: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface Recommendation {
  type: 'SKILL_DEVELOPMENT' | 'CAREER_TRANSITION' | 'RISK_MITIGATION';
  title: string;
  riskScore: number;
  salaryProjection: {
    current: number;
    year1: number;
    year3: number;
    year5: number;
    notes: string;
  };
  timeline: string;
  steps: RecommendationStep[];
  vulnerabilities: Vulnerability[];
  successProbability: number;
  notes: string;
  recommendation: 'RECOMMENDED' | 'CONDITIONAL' | 'SKIP THIS PATH';
}

export interface AssessmentResponse {
  success: boolean;
  error?: string;
  overallRiskScore: number;
  scores: RiskScore;
  riskBreakdown: MarketIntelligence;
  recommendations: Recommendation[];
  timestamp: string;
  metadata: {
    algorithmVersion: string;
    dataSourcesUsed: string[];
    confidence: number;
    processingTimeMs: number;
  };
}

export interface MarketIntelligenceResponse {
  success: boolean;
  technology: string;
  marketData: {
    marketSize: number;
    marketTier: number;
    growthRate: number;
    salaryRange: {
      min: number;
      max: number;
      average: number;
      currency: string;
      format: string;
    };
    jobCategories: Record<string, number>;
    topIndustries: string[];
    growthProjection: {
      year1: number;
      year3: number;
      year5: number;
    };
    demandOutlook: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'DECLINING';
  };
  timestamp: string;
}

export interface ValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}