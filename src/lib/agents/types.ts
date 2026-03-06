/**
 * Agentic AI Framework - Type Definitions
 * Defines all interfaces for the multi-agent orchestration system
 */

export type AgentStatus = 'idle' | 'running' | 'complete' | 'error';

export type AgentName =
  | 'orchestrator'
  | 'resume-parser'
  | 'jd-parser'
  | 'ats-scorer'
  | 'resume-builder'
  | 'formatter';

export interface AgentProgress {
  agent: AgentName;
  status: AgentStatus;
  message: string;
  progress?: number; // 0-100
  data?: unknown;
}

export type ProgressCallback = (progress: AgentProgress) => void;

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
  durationMs: number;
}

// ==========================================
// Resume JSON Schema (standardized format)
// ==========================================

export interface ResumeJSON {
  personalInfo: {
    name: string;
    title?: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  experience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    id: string;
    degree: string;
    field?: string;
    institution: string;
    location?: string;
    startDate?: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    techStack: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  languages: Array<{
    id: string;
    name: string;
    proficiency: string;
  }>;
  volunteer: Array<{
    id: string;
    role: string;
    organization: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  customSections?: Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

// ==========================================
// JD Analysis Types
// ==========================================

export interface JDAnalysis {
  jobTitle: string;
  companyName?: string;
  location?: string;
  industry?: string;
  experienceYears?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  actionVerbs: string[];
  tools: string[];
  certifications: string[];
  education: string[];
  mustHave: string[];
  niceToHave: string[];
  responsibilities: string[];
  qualifications: string[];
}

// ==========================================
// ATS Scoring Types
// ==========================================

export interface ATSScoreResult {
  overall: number; // 0-100
  breakdown: {
    skillsMatch: number;
    keywordCoverage: number;
    experienceRelevance: number;
    educationMatch: number;
    formattingScore: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: ATSSuggestion[];
}

export interface ATSSuggestion {
  priority: 'critical' | 'important' | 'suggested';
  section: string;
  message: string;
  action: string;
}

// ==========================================
// Enhancement Types
// ==========================================

export interface EnhancementChange {
  section: 'skills' | 'experience' | 'summary' | 'projects' | 'certifications';
  type: 'added' | 'modified' | 'enhanced';
  before: string;
  after: string;
  reason: string;
}

export interface EnhancementResult {
  enhancedResume: ResumeJSON;
  changes: EnhancementChange[];
  beforeScore: number;
  afterScore: number;
  summary: {
    skillsAdded: number;
    bulletsModified: number;
    summaryEnhanced: boolean;
    projectsEnhanced: number;
  };
}

// ==========================================
// Orchestrator Types
// ==========================================

export type OrchestratorAction =
  | 'parse-resume'
  | 'analyze-jd'
  | 'score-ats'
  | 'enhance-resume'
  | 'full-pipeline';

export interface OrchestratorRequest {
  action: OrchestratorAction;
  resumeId?: string;
  resumeData?: ResumeJSON;
  jdText?: string;
  jdAnalysis?: JDAnalysis;
  templateId?: string;
  targetScore?: number;
  fileBuffer?: Buffer;
  fileType?: 'pdf' | 'docx';
}

export interface OrchestratorResponse {
  success: boolean;
  action: OrchestratorAction;
  results: Record<string, unknown>;
  totalTokensUsed: number;
  totalDurationMs: number;
  agentResults: AgentProgress[];
}
