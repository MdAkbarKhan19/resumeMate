/**
 * Advanced Job Description Analyzer
 * Extracts keywords, skills, requirements, and provides intelligent matching
 */

import OpenAI from 'openai';
import { ATSCheckerService } from './ats-checker';

export interface JDAnalysisResult {
  // Extracted data
  jobTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  actionVerbs: string[];
  tools: string[];
  certifications: string[];
  education: string[];
  experienceYears?: string;
  
  // Categorized requirements
  mustHave: string[];
  niceToHave: string[];
  
  // Raw text sections
  responsibilities: string[];
  qualifications: string[];
  
  // Metadata
  industry?: string;
  companyName?: string;
  location?: string;
}

export interface ATSScore {
  overall: number; // 0-100
  breakdown: {
    skillsMatch: number;
    keywordMatch: number;
    experienceMatch: number;
    educationMatch: number;
    formattingScore: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export interface BeforeAfterComparison {
  before: ATSScore;
  after: ATSScore;
  improvement: number;
  keyImprovements: string[];
}

export class JobDescriptionAnalyzer {
  private static openai: OpenAI | null = null;

  private static getOpenAIClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Analyze job description using AI to extract structured information
   */
  static async analyzeJobDescription(jobDescription: string): Promise<JDAnalysisResult> {
    const client = this.getOpenAIClient();

    const prompt = `You are an expert ATS recruiter analyzing a job description. Extract ALL technical requirements with precision.

Job Description:
"""
${jobDescription}
"""

Extract and categorize CAREFULLY:

1. **Job Title** - The position title ONLY (e.g., "Senior Java Developer"). Do NOT include this in any skills arrays.

2. **Required Skills** - ONLY specific technologies, languages, frameworks, databases, and tools that are EXPLICITLY required. Examples: "Java", "Spring Boot", "PostgreSQL", "Docker", "AWS", "Microservices", "REST APIs", "Kafka"
   - DO NOT include the job title (e.g., "Java Developer") as a skill
   - DO NOT include vague terms like "software development" or "programming"
   - ONLY include concrete, searchable technical terms

3. **Preferred Skills** - Technologies/tools listed as nice-to-have or preferred

4. **Keywords** - Important ATS-relevant terms and phrases from the JD that a resume should contain (methodologies, patterns, domain terms)

5. **Action Verbs** - Strong verbs used in the JD (develop, architect, implement, etc.)

6. **Tools** - Specific software tools, platforms, and DevOps tools (Docker, Kubernetes, Jenkins, JIRA, Git, IntelliJ, etc.)

7. **Certifications** - Specific certs mentioned (AWS Certified, PMP, etc.)

8. **Education** - Degree requirements

9. **Experience Years** - Years of experience required

10. **Responsibilities** - Key duties listed

11. **Qualifications** - Requirements listed

12. **Must-have vs Nice-to-have** - Distinguish critical vs preferred requirements

CRITICAL RULES:
- The job TITLE (e.g., "Java Developer", "Senior Software Engineer") must NEVER appear in requiredSkills, preferredSkills, keywords, or tools arrays
- requiredSkills should contain ONLY specific technologies/frameworks/tools (e.g., "Java", "Spring Boot", "Kubernetes"), NOT job roles
- Be thorough - extract EVERY technology, framework, tool, database, cloud service, and methodology mentioned

Return as JSON:
{
  "jobTitle": "extracted title",
  "requiredSkills": ["Java", "Spring Boot", "Microservices", "PostgreSQL"],
  "preferredSkills": ["Kafka", "Redis"],
  "keywords": ["CI/CD", "Agile", "design patterns", "distributed systems"],
  "actionVerbs": ["develop", "architect", "lead"],
  "tools": ["Docker", "Kubernetes", "Jenkins", "Git", "JIRA"],
  "certifications": ["AWS Certified Solutions Architect"],
  "education": ["Bachelor's in Computer Science"],
  "experienceYears": "5+ years",
  "responsibilities": ["Design and develop microservices", "Lead code reviews"],
  "qualifications": ["5+ years Java experience", "Experience with cloud platforms"],
  "mustHave": ["Java", "Spring Boot", "Microservices"],
  "niceToHave": ["Kafka experience", "AWS certifications"],
  "industry": "tech",
  "companyName": "company name if mentioned",
  "location": "location if mentioned"
}`;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter and ATS specialist. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as JDAnalysisResult;

    // Also use traditional keyword extraction as backup
    const traditionalKeywords = ATSCheckerService.extractKeywords(jobDescription);

    // Merge and deduplicate
    parsed.requiredSkills = [...new Set([...parsed.requiredSkills, ...traditionalKeywords.skills])];
    parsed.tools = [...new Set([...parsed.tools, ...traditionalKeywords.tools])];
    parsed.keywords = [...new Set([...parsed.keywords, ...traditionalKeywords.all])];

    // Post-process: remove job title from all skill/keyword arrays
    const jobTitleLower = (parsed.jobTitle || '').toLowerCase();
    const filterTitle = (arr: string[]) => arr.filter(
      item => item.toLowerCase() !== jobTitleLower &&
              !item.toLowerCase().includes(jobTitleLower) &&
              item.length > 1
    );
    parsed.requiredSkills = filterTitle(parsed.requiredSkills);
    parsed.preferredSkills = filterTitle(parsed.preferredSkills);
    parsed.keywords = filterTitle(parsed.keywords);
    parsed.tools = filterTitle(parsed.tools);

    return parsed;
  }

  /**
   * Calculate ATS score for a resume against a job description
   */
  static async calculateATSScore(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<ATSScore> {
    // Extract all text from resume
    const resumeText = this.extractResumeText(resumeData);
    const resumeTextLower = resumeText.toLowerCase();

    // 1. Skills Match (30%)
    const requiredSkillsCount = jdAnalysis.requiredSkills.length;
    const matchedRequiredSkills = jdAnalysis.requiredSkills.filter(skill =>
      resumeTextLower.includes(skill.toLowerCase())
    );
    const skillsMatchPercent = requiredSkillsCount > 0
      ? (matchedRequiredSkills.length / requiredSkillsCount) * 100
      : 100;

    // 2. Keyword Match (25%)
    const keywordsCount = jdAnalysis.keywords.length;
    const matchedKeywordsRaw = jdAnalysis.keywords.filter(keyword =>
      resumeTextLower.includes(keyword.toLowerCase())
    );
    const keywordMatchPercent = keywordsCount > 0
      ? (matchedKeywordsRaw.length / keywordsCount) * 100
      : 100;

    // 3. Experience Match (20%)
    let experienceMatchPercent = 100;
    if (jdAnalysis.experienceYears) {
      const requiredYears = this.extractYearsFromText(jdAnalysis.experienceYears);
      const resumeYears = this.calculateTotalExperience(resumeData.experience || []);
      experienceMatchPercent = resumeYears >= requiredYears ? 100 : (resumeYears / requiredYears) * 100;
    }

    // 4. Education Match (15%)
    let educationMatchPercent = 100;
    if (jdAnalysis.education && jdAnalysis.education.length > 0) {
      const hasMatchingEducation = this.checkEducationMatch(
        resumeData.education || [],
        jdAnalysis.education
      );
      educationMatchPercent = hasMatchingEducation ? 100 : 60; // Partial credit if no exact match
    }

    // 5. Formatting Score (10%)
    const formattingScore = this.calculateFormattingScore(resumeData);

    // Calculate overall weighted score
    const overall = Math.round(
      (skillsMatchPercent * 0.30) +
      (keywordMatchPercent * 0.25) +
      (experienceMatchPercent * 0.20) +
      (educationMatchPercent * 0.15) +
      (formattingScore * 0.10)
    );

    // Find missing keywords
    const missingKeywords = [
      ...jdAnalysis.requiredSkills.filter(skill =>
        !resumeTextLower.includes(skill.toLowerCase())
      ),
      ...jdAnalysis.mustHave.filter(item =>
        !resumeTextLower.includes(item.toLowerCase())
      ),
    ];

    // Generate suggestions
    const suggestions = this.generateSuggestions(
      matchedRequiredSkills,
      jdAnalysis,
      resumeData,
      overall
    );

    return {
      overall: Math.min(100, Math.max(0, overall)),
      breakdown: {
        skillsMatch: Math.round(skillsMatchPercent),
        keywordMatch: Math.round(keywordMatchPercent),
        experienceMatch: Math.round(experienceMatchPercent),
        educationMatch: Math.round(educationMatchPercent),
        formattingScore: Math.round(formattingScore),
      },
      matchedKeywords: [...new Set([...matchedRequiredSkills, ...matchedKeywordsRaw])],
      missingKeywords: [...new Set(missingKeywords)],
      suggestions,
    };
  }

  /**
   * Compare before and after scores
   */
  static compareScores(before: ATSScore, after: ATSScore): BeforeAfterComparison {
    const improvement = after.overall - before.overall;
    
    const keyImprovements: string[] = [];
    
    if (after.breakdown.skillsMatch > before.breakdown.skillsMatch) {
      keyImprovements.push(`Skills match improved by ${after.breakdown.skillsMatch - before.breakdown.skillsMatch}%`);
    }
    
    if (after.breakdown.keywordMatch > before.breakdown.keywordMatch) {
      keyImprovements.push(`Keyword match improved by ${after.breakdown.keywordMatch - before.breakdown.keywordMatch}%`);
    }
    
    const newKeywords = after.matchedKeywords.filter(k => !before.matchedKeywords.includes(k));
    if (newKeywords.length > 0) {
      keyImprovements.push(`Added ${newKeywords.length} new relevant keywords: ${newKeywords.slice(0, 3).join(', ')}${newKeywords.length > 3 ? '...' : ''}`);
    }

    return {
      before,
      after,
      improvement,
      keyImprovements,
    };
  }

  /**
   * Extract all text from resume data
   */
  private static extractResumeText(resumeData: any): string {
    const parts: string[] = [];

    if (resumeData.personalInfo) {
      parts.push(JSON.stringify(resumeData.personalInfo));
    }

    if (resumeData.professionalTitle) {
      parts.push(resumeData.professionalTitle);
    }

    if (resumeData.summary) {
      parts.push(resumeData.summary);
    }

    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      resumeData.experience.forEach((exp: any) => {
        parts.push(exp.jobTitle || exp.position || '');
        parts.push(exp.company || '');
        parts.push(exp.description || '');
        if (exp.achievements && Array.isArray(exp.achievements)) {
          parts.push(exp.achievements.join(' '));
        }
        if (exp.bullets && Array.isArray(exp.bullets)) {
          parts.push(exp.bullets.join(' '));
        }
      });
    }

    if (resumeData.education && Array.isArray(resumeData.education)) {
      resumeData.education.forEach((edu: any) => {
        parts.push(edu.degree || '');
        parts.push(edu.institution || '');
        parts.push(edu.field || '');
      });
    }

    if (resumeData.skills) {
      if (Array.isArray(resumeData.skills)) {
        parts.push(resumeData.skills.join(' '));
      } else if (typeof resumeData.skills === 'object') {
        Object.values(resumeData.skills).forEach((skillSet: any) => {
          if (Array.isArray(skillSet)) {
            parts.push(skillSet.join(' '));
          }
        });
      }
    }

    if (resumeData.certifications && Array.isArray(resumeData.certifications)) {
      resumeData.certifications.forEach((cert: any) => {
        parts.push(cert.name || cert.title || '');
      });
    }

    if (resumeData.projects && Array.isArray(resumeData.projects)) {
      resumeData.projects.forEach((proj: any) => {
        parts.push(proj.name || '');
        parts.push(proj.description || '');
        if (proj.techStack && Array.isArray(proj.techStack)) {
          parts.push(proj.techStack.join(' '));
        }
        if (proj.technologies && Array.isArray(proj.technologies)) {
          parts.push(proj.technologies.join(' '));
        }
      });
    }

    return parts.join(' ');
  }

  /**
   * Extract years from text like "5+ years" or "3-5 years"
   */
  private static extractYearsFromText(text: string): number {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Calculate total years of experience from experience array
   */
  private static calculateTotalExperience(experiences: any[]): number {
    let totalMonths = 0;

    experiences.forEach(exp => {
      const startDate = exp.startDate ? new Date(exp.startDate) : null;
      const endDate = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);

      if (startDate && endDate) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        totalMonths += months;
      }
    });

    return totalMonths / 12; // Convert to years
  }

  /**
   * Check if resume education matches JD requirements
   */
  private static checkEducationMatch(resumeEducation: any[], requiredEducation: string[]): boolean {
    const resumeText = resumeEducation.map(edu =>
      `${edu.degree} ${edu.field || ''} ${edu.institution || ''}`.toLowerCase()
    ).join(' ');

    return requiredEducation.some(req => {
      const reqLower = req.toLowerCase();
      return resumeText.includes('bachelor') && reqLower.includes('bachelor') ||
             resumeText.includes('master') && reqLower.includes('master') ||
             resumeText.includes('phd') && reqLower.includes('phd') ||
             resumeText.includes(reqLower);
    });
  }

  /**
   * Calculate formatting score (ATS-friendly format checks)
   */
  private static calculateFormattingScore(resumeData: any): number {
    let score = 100;

    // Deduct for missing critical sections
    if (!resumeData.experience || resumeData.experience.length === 0) score -= 20;
    if (!resumeData.education || resumeData.education.length === 0) score -= 15;
    if (!resumeData.skills) score -= 15;
    if (!resumeData.summary) score -= 10;

    // Check for good practices
    if (resumeData.personalInfo?.email) score += 0; // No penalty
    if (resumeData.personalInfo?.phone) score += 0; // No penalty

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate actionable suggestions based on analysis
   */
  private static generateSuggestions(
    matchedSkills: string[],
    jdAnalysis: JDAnalysisResult,
    resumeData: any,
    overallScore: number
  ): string[] {
    const suggestions: string[] = [];

    // Missing skills suggestions
    const missingRequiredSkills = jdAnalysis.requiredSkills.filter(
      skill => !matchedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
    );

    if (missingRequiredSkills.length > 0) {
      suggestions.push(
        `Add these required skills: ${missingRequiredSkills.slice(0, 5).join(', ')}${missingRequiredSkills.length > 5 ? ' and more' : ''}`
      );
    }

    // Experience suggestions
    if (jdAnalysis.experienceYears) {
      const requiredYears = this.extractYearsFromText(jdAnalysis.experienceYears);
      const resumeYears = this.calculateTotalExperience(resumeData.experience || []);
      
      if (resumeYears < requiredYears) {
        suggestions.push(
          `Highlight relevant experience more prominently. JD requires ${jdAnalysis.experienceYears} of experience.`
        );
      }
    }

    // Keyword optimization
    if (overallScore < 70) {
      suggestions.push(
        'Incorporate more keywords from the job description in your experience bullets and summary'
      );
    }

    // Action verb suggestions
    if (jdAnalysis.actionVerbs.length > 0) {
      suggestions.push(
        `Use strong action verbs like: ${jdAnalysis.actionVerbs.slice(0, 5).join(', ')}`
      );
    }

    // Tools and technologies
    const missingTools = jdAnalysis.tools.filter(
      tool => !this.extractResumeText(resumeData).toLowerCase().includes(tool.toLowerCase())
    );

    if (missingTools.length > 0) {
      suggestions.push(
        `Add experience with these tools if applicable: ${missingTools.slice(0, 3).join(', ')}`
      );
    }

    // Certifications
    if (jdAnalysis.certifications.length > 0) {
      suggestions.push(
        `Consider highlighting these certifications if you have them: ${jdAnalysis.certifications.join(', ')}`
      );
    }

    return suggestions;
  }
}
