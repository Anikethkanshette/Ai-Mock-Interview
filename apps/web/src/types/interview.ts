export type InterviewAgentName =
  | 'resume-agent'
  | 'interviewer-agent'
  | 'evaluator-agent'
  | 'coach-agent'
  | 'orchestrator-agent';

export interface AgentDecision {
  agent: InterviewAgentName;
  summary: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
}

export interface InterviewAgentState {
  decisions: AgentDecision[];
  lastUpdated: string;
}

export type InterviewRole = 'frontend' | 'backend' | 'fullstack' | 'data' | 'devops';
export type InterviewLevel = 'junior' | 'mid' | 'senior';

export interface QuestionPrediction {
  source: 'company-pattern' | 'interviewer-pattern' | 'role-trend';
  confidence: number;
  rationale: string;
  question: InterviewQuestion;
}

export interface EvidenceSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface InterviewerResearchProfile {
  interviewerName: string;
  verified: boolean;
  confidence: number;
  specialties: string[];
  evidence: EvidenceSource[];
  note: string;
}

export interface CompanyInterviewIntelligence {
  targetCompany?: string;
  interviewerName?: string;
  companySignals: string[];
  interviewerSignals: string[];
  interviewerResearch?: InterviewerResearchProfile;
  evidence: EvidenceSource[];
  predictedQuestions: QuestionPrediction[];
}

export interface ConversationMessage {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  category: string;
  expectedTopics: string[];
  phase: 'intro' | 'resume' | 'technical' | 'system' | 'behavioral' | 'follow-up';
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface ScoreBreakdown {
  technicalAccuracy: number;
  communication: number;
  problemSolving: number;
  impactOrientation: number;
  overall: number;
}

export interface InterviewTurn {
  question: InterviewQuestion;
  answer?: string;
  score?: number;
  feedback?: string;
  scoreBreakdown?: ScoreBreakdown;
  askedAt?: string;
  answeredAt?: string;
}

export interface InterviewSession {
  sessionId: string;
  candidateName: string;
  role: InterviewRole;
  level: InterviewLevel;
  targetCompany?: string;
  interviewerName?: string;
  resumeText: string;
  resumeAnalysis: ResumeScanResult;
  resumeHighlights: string[];
  knownFacts: string[];
  coveredFacts: string[];
  conversation: ConversationMessage[];
  maxTurns: number;
  intelligence?: CompanyInterviewIntelligence;
  agentState?: InterviewAgentState;
  turns: InterviewTurn[];
  createdAt: string;
  status: 'active' | 'completed' | 'terminated';
  completedAt?: string;
  terminatedAt?: string;
}

export interface ResumeScanResult {
  fileName?: string;
  extractedText: string;
  highlights: string[];
  facts: string[];
  sections: ResumeSectionCoverage;
  extractedProfile: ResumeExtractedProfile;
  coverage: ResumeCoverageStats;
  missingSignals: string[];
  recommendedRole: InterviewRole;
  recommendedLevel: InterviewLevel;
}

export interface ResumeSectionCoverage {
  summary: string[];
  experience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  certifications: string[];
  achievements: string[];
}

export interface ResumeExtractedProfile {
  yearsExperience?: number;
  strongestSkills: string[];
  domains: string[];
  quantifiedAchievements: string[];
}

export interface ResumeCoverageStats {
  totalLines: number;
  capturedLines: number;
  coveragePercent: number;
}

export interface EvidenceBackedObservation {
  area: string;
  evidence: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SessionSummary {
  sessionId: string;
  candidateName: string;
  role: InterviewRole;
  level: InterviewLevel;
  status: 'active' | 'completed' | 'terminated';
  createdAt: string;
  completedAt?: string;
  answeredQuestions: number;
  totalQuestions: number;
  averageScore: number;
}

export interface InterviewResult {
  averageScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  completed: boolean;
  strengths: string[];
  improvements: string[];
  observedLacking: EvidenceBackedObservation[];
  improvementPlan: EvidenceBackedObservation[];
  /** Optional LLM-powered narrative summary for the whole session. */
  llmSummary?: string;
}

export interface AnalyticsOverview {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  terminatedSessions: number;
  averageScoreAcrossSessions: number;
  roleDistribution: Record<string, number>;
}

export interface ResumeScoreBreakdown {
  keywordAlignment: number;
  experienceMatch: number;
  impactEvidence: number;
  structureQuality: number;
}

export interface ResumeScoreReport {
  score: number;
  breakdown: ResumeScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface AtsIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
}

export interface AtsCompatibilityReport {
  passScore: number;
  issues: AtsIssue[];
  passLikely: boolean;
}

export interface JobMatchSuggestion {
  title: string;
  companyType: string;
  matchScore: number;
  reasons: string[];
  missingSkills: string[];
}

export interface LinkedInOptimization {
  headline: string;
  about: string;
  featuredBullets: string[];
}

export interface CoverLetterDraft {
  greeting: string;
  opening: string;
  body: string[];
  closing: string;
}

export interface AdvancedResumeInsights {
  strongestNarrative: string;
  quantifiedImpactSignals: string[];
  roleReadinessSummary: string;
  priorityActions: string[];
}

export interface ResumeImprovementTip {
  title: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ResumeIntelligenceReport {
  scoreReport: ResumeScoreReport;
  atsReport: AtsCompatibilityReport;
  jobMatches: JobMatchSuggestion[];
  improvementTips: ResumeImprovementTip[];
  linkedinOptimization: LinkedInOptimization;
  coverLetterDraft: CoverLetterDraft;
  advancedInsights: AdvancedResumeInsights;
}
