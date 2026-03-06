/**
 * Zod Validation Schemas for Agent Pipeline
 * Ensures type safety and data integrity across all agents
 */

import { z } from 'zod';

// ==========================================
// Personal Info Schema
// ==========================================

export const PersonalInfoSchema = z.object({
  name: z.string().default(''),
  title: z.string().optional().default(''),
  email: z.string().default(''),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  github: z.string().optional().default(''),
  portfolio: z.string().optional().default(''),
});

// ==========================================
// Experience Schema
// ==========================================

export const ExperienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().default(''),
  endDate: z.string().optional().default(''),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

// ==========================================
// Education Schema
// ==========================================

export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string().default(''),
  field: z.string().optional().default(''),
  institution: z.string().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  graduationDate: z.string().default(''),
  gpa: z.string().optional().default(''),
});

// ==========================================
// Skill Schema
// ==========================================

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().default('technical'),
});

// ==========================================
// Certification Schema
// ==========================================

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  expiryDate: z.string().optional().default(''),
  credentialId: z.string().optional().default(''),
});

// ==========================================
// Project Schema
// ==========================================

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  description: z.string().default(''),
  techStack: z.array(z.string()).default([]),
  url: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
});

// ==========================================
// Language Schema
// ==========================================

export const LanguageSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  proficiency: z.string().default(''),
});

// ==========================================
// Volunteer Schema
// ==========================================

export const VolunteerSchema = z.object({
  id: z.string(),
  role: z.string().default(''),
  organization: z.string().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  current: z.boolean().default(false),
  description: z.string().default(''),
});

// ==========================================
// Custom Section Schema
// ==========================================

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  content: z.string().default(''),
});

// ==========================================
// Full Resume JSON Schema
// ==========================================

export const ResumeJSONSchema = z.object({
  personalInfo: PersonalInfoSchema,
  summary: z.string().default(''),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  volunteer: z.array(VolunteerSchema).default([]),
  customSections: z.array(CustomSectionSchema).optional().default([]),
});

// ==========================================
// JD Analysis Schema
// ==========================================

export const JDAnalysisSchema = z.object({
  jobTitle: z.string().default(''),
  companyName: z.string().optional().default(''),
  location: z.string().optional().default(''),
  industry: z.string().optional().default(''),
  experienceYears: z.string().optional().default(''),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  actionVerbs: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  mustHave: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
});

// ==========================================
// ATS Score Result Schema
// ==========================================

export const ATSScoreResultSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: z.object({
    skillsMatch: z.number(),
    keywordCoverage: z.number(),
    experienceRelevance: z.number(),
    educationMatch: z.number(),
    formattingScore: z.number(),
  }),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  suggestions: z.array(z.object({
    priority: z.enum(['critical', 'important', 'suggested']),
    section: z.string(),
    message: z.string(),
    action: z.string(),
  })),
});

// ==========================================
// Type exports (inferred from schemas)
// ==========================================

export type ValidatedResumeJSON = z.infer<typeof ResumeJSONSchema>;
export type ValidatedJDAnalysis = z.infer<typeof JDAnalysisSchema>;
export type ValidatedATSScoreResult = z.infer<typeof ATSScoreResultSchema>;

// ==========================================
// Validation helpers
// ==========================================

export function validateResumeJSON(data: unknown): ValidatedResumeJSON {
  return ResumeJSONSchema.parse(data);
}

export function safeValidateResumeJSON(data: unknown): { success: boolean; data?: ValidatedResumeJSON; error?: string } {
  const result = ResumeJSONSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}

export function validateJDAnalysis(data: unknown): ValidatedJDAnalysis {
  return JDAnalysisSchema.parse(data);
}

export function validateATSScore(data: unknown): ValidatedATSScoreResult {
  return ATSScoreResultSchema.parse(data);
}
