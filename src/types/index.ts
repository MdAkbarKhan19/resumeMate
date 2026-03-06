// Resume Data Types
export interface PersonalInfo {
  fullName: string;
  title?: string;
  email: string;
  phone: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  linkedin?: string;
  website?: string;
  github?: string;
  portfolio?: string;
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  field?: string;
  institution: string;
  location?: string;
  startDate?: string;
  graduationDate: string;
  gpa?: string;
  honors?: string;
  relevantCoursework?: string[];
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic';
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

// Complete Resume Data Structure
export interface ResumeData {
  id?: string;
  title: string;
  templateId: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  awards?: Award[];
  languages?: Language[];
  customSections?: CustomSection[];
  lastJDAnalysis?: JDAnalysisResult;
  atsScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: 'MODERN' | 'MINIMALIST' | 'PROFESSIONAL' | 'CREATIVE' | 'HYBRID';
  thumbnail?: string;
  htmlTemplate: string;
  cssStyles: string;
  docxTemplate?: string;
  isActive: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: number;
}

// Job Description Analysis Types
export interface JDAnalysisResult {
  jdText: string;
  jdTitle?: string;
  jdCompany?: string;
  keywords: string[];
  requiredSkills: string[];
  matchScore: number;
  missingKeywords: string[];
  suggestions: string[];
  matchedKeywords: string[];
  analyzedAt: string;
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  occurrences: number;
  context?: string[];
}

// AI Service Types
export interface AIBulletEnhancement {
  original: string;
  enhanced: string;
  improvements: string[];
  tokensUsed?: number;
  cost?: number;
}

export interface AIGrammarCheck {
  text: string;
  corrections: GrammarCorrection[];
  score: number;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  type: 'grammar' | 'spelling' | 'style' | 'clarity';
  message: string;
  position: { start: number; end: number };
}

export interface RedundancyCheck {
  redundantPairs: Array<{
    index1: number;
    index2: number;
    text1: string;
    text2: string;
    similarity: number;
  }>;
  suggestions: string[];
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  provider: 'EMAIL' | 'GOOGLE';
  emailVerified: boolean;
  planType: 'FREE' | 'TIER1' | 'TIER2';
  resumesCreated: number;
  resumeCredits: number;
  subscriptionActive: boolean;
  subscriptionExpiry?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Payment Types
export interface PaymentPlan {
  id: string;
  name: string;
  type: 'FREE' | 'TIER1' | 'TIER2';
  price: number;
  currency: string;
  features: string[];
  credits?: number;
  duration?: 'monthly' | 'quarterly' | 'yearly';
  stripePriceId?: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// File Upload Types
export interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
}

export interface ParsedResumeData {
  personalInfo: Partial<PersonalInfo>;
  summary?: string;
  experience: Partial<WorkExperience>[];
  education: Partial<Education>[];
  skills: Partial<Skill>[];
  certifications?: Partial<Certification>[];
  confidence: number;
  warnings: string[];
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// Export/Download Types
export interface ExportOptions {
  format: 'pdf' | 'docx';
  templateId: string;
  resumeData: ResumeData;
  includeWatermark?: boolean;
}

// Usage Tracking Types
export interface UsageStats {
  resumesCreated: number;
  resumesRemaining: number;
  aiCallsUsed: number;
  aiCallsRemaining: number;
  exportsUsed: number;
  exportsRemaining: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
