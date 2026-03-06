/**
 * ATS Scorer Agent
 * Hybrid scoring: keyword matching (40%) + semantic analysis (30%) + experience (20%) + formatting (10%)
 * More accurate than pure regex matching
 */

import { BaseAgent } from './base-agent';
import { JDAnalysis, ATSScoreResult, ATSSuggestion, ResumeJSON } from './types';

interface ATSScorerInput {
  resume: ResumeJSON;
  jdAnalysis: JDAnalysis;
}

export class ATSScorerAgent extends BaseAgent<ATSScorerInput, ATSScoreResult> {
  constructor() {
    super('ats-scorer', { model: 'gpt-4o-mini', maxRetries: 2 });
  }

  protected async execute(input: ATSScorerInput): Promise<{ data: ATSScoreResult; tokensUsed: number }> {
    const { resume, jdAnalysis } = input;
    let totalTokens = 0;

    this.emitProgress('Extracting resume text...', 5);
    const resumeText = this.extractResumeText(resume);
    const resumeTextLower = resumeText.toLowerCase();

    // 1. Keyword matching (40%)
    this.emitProgress('Matching keywords...', 15);
    const keywordResult = this.performKeywordMatching(resumeTextLower, jdAnalysis);

    // 2. Semantic analysis via AI (30%)
    this.emitProgress('Running semantic analysis...', 30);
    const semanticResult = await this.performSemanticAnalysis(resume, jdAnalysis);
    totalTokens += semanticResult.tokensUsed;

    // 3. Experience match (20%)
    this.emitProgress('Evaluating experience fit...', 65);
    const experienceScore = this.calculateExperienceScore(resume, jdAnalysis);

    // 4. Formatting quality (10%)
    this.emitProgress('Checking formatting...', 80);
    const formattingScore = this.calculateFormattingScore(resume);

    // Calculate weighted overall score
    const overall = Math.round(
      (keywordResult.score * 0.40) +
      (semanticResult.score * 0.30) +
      (experienceScore * 0.20) +
      (formattingScore * 0.10)
    );

    // Combine matched/missing
    const matchedKeywords = [...new Set([...keywordResult.matched, ...semanticResult.matched])];
    const missingKeywords = [...new Set([
      ...keywordResult.missing.filter(k => !matchedKeywords.includes(k)),
    ])];

    // Separate skills
    const allSkillNames = resume.skills.map(s => s.name.toLowerCase());
    const matchedSkills = jdAnalysis.requiredSkills.filter(s =>
      allSkillNames.some(existing => existing.includes(s.toLowerCase()) || s.toLowerCase().includes(existing))
    );
    const missingSkills = jdAnalysis.requiredSkills.filter(s =>
      !matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase())
    );

    // Generate suggestions
    this.emitProgress('Generating suggestions...', 90);
    const suggestions = this.generateSuggestions(
      { matchedSkills, missingSkills, missingKeywords },
      jdAnalysis,
      resume,
      overall
    );

    return {
      data: {
        overall: Math.min(100, Math.max(0, overall)),
        breakdown: {
          skillsMatch: Math.round(keywordResult.score),
          keywordCoverage: Math.round(keywordResult.score),
          experienceRelevance: Math.round(experienceScore),
          educationMatch: Math.round(semanticResult.educationScore),
          formattingScore: Math.round(formattingScore),
        },
        matchedKeywords,
        missingKeywords,
        matchedSkills,
        missingSkills,
        suggestions,
      },
      tokensUsed: totalTokens,
    };
  }

  private performKeywordMatching(
    resumeTextLower: string,
    jdAnalysis: JDAnalysis
  ): { score: number; matched: string[]; missing: string[] } {
    const allTargetKeywords = [
      ...jdAnalysis.requiredSkills,
      ...jdAnalysis.keywords,
      ...jdAnalysis.tools,
    ];
    const unique = [...new Set(allTargetKeywords)];

    const matched: string[] = [];
    const missing: string[] = [];

    for (const keyword of unique) {
      if (resumeTextLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    }

    const score = unique.length > 0 ? (matched.length / unique.length) * 100 : 100;
    return { score, matched, missing };
  }

  private async performSemanticAnalysis(
    resume: ResumeJSON,
    jdAnalysis: JDAnalysis
  ): Promise<{ score: number; matched: string[]; educationScore: number; tokensUsed: number }> {
    const resumeSummaryText = [
      resume.summary,
      ...resume.experience.flatMap(e => [e.jobTitle, e.company, ...e.bullets]),
      ...resume.skills.map(s => s.name),
      ...resume.projects.map(p => `${p.name}: ${p.description}`),
    ].join('\n');

    const { content, tokensUsed } = await this.callLLM({
      systemPrompt: 'You are an ATS scoring expert. Evaluate resume-JD fit semantically. Return valid JSON.',
      userPrompt: `Compare this resume content against the job requirements and score the semantic fit.

JOB REQUIREMENTS:
- Title: ${jdAnalysis.jobTitle}
- Required Skills: ${jdAnalysis.requiredSkills.join(', ')}
- Must Have: ${jdAnalysis.mustHave.join(', ')}
- Key Responsibilities: ${jdAnalysis.responsibilities.slice(0, 5).join('; ')}
- Education: ${jdAnalysis.education.join(', ')}

RESUME CONTENT:
${resumeSummaryText.substring(0, 3000)}

Score each dimension (0-100):
{
  "overallFit": 75,
  "semanticSkillMatch": 70,
  "educationFit": 80,
  "semanticallyMatchedKeywords": ["keywords from JD that are addressed in resume even without exact match"],
  "reasoning": "brief explanation"
}`,
      temperature: 0.2,
      maxTokens: 1000,
    });

    try {
      const parsed = JSON.parse(content);
      return {
        score: parsed.overallFit || 50,
        matched: parsed.semanticallyMatchedKeywords || [],
        educationScore: parsed.educationFit || 70,
        tokensUsed,
      };
    } catch {
      return { score: 50, matched: [], educationScore: 70, tokensUsed };
    }
  }

  private calculateExperienceScore(resume: ResumeJSON, jdAnalysis: JDAnalysis): number {
    if (!jdAnalysis.experienceYears) return 80; // No requirement = decent score

    const requiredYears = parseInt(jdAnalysis.experienceYears.match(/(\d+)/)?.[1] || '0');
    if (requiredYears === 0) return 80;

    let totalMonths = 0;
    for (const exp of resume.experience) {
      const start = exp.startDate ? new Date(exp.startDate) : null;
      const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : null);
      if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        totalMonths += (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
      }
    }

    const actualYears = totalMonths / 12;
    if (actualYears >= requiredYears) return 100;
    return Math.round((actualYears / requiredYears) * 100);
  }

  private calculateFormattingScore(resume: ResumeJSON): number {
    let score = 100;

    if (!resume.experience || resume.experience.length === 0) score -= 20;
    if (!resume.education || resume.education.length === 0) score -= 15;
    if (!resume.skills || resume.skills.length === 0) score -= 15;
    if (!resume.summary) score -= 10;
    if (!resume.personalInfo?.email) score -= 10;
    if (!resume.personalInfo?.phone) score -= 5;

    // Bonus for good practices
    if (resume.certifications && resume.certifications.length > 0) score += 5;
    if (resume.projects && resume.projects.length > 0) score += 5;

    // Check bullet quality
    const allBullets = resume.experience.flatMap(e => e.bullets);
    const avgBulletLength = allBullets.length > 0
      ? allBullets.reduce((sum, b) => sum + b.length, 0) / allBullets.length
      : 0;
    if (avgBulletLength < 30) score -= 10; // Too short
    if (avgBulletLength > 200) score -= 5; // Too long

    return Math.max(0, Math.min(100, score));
  }

  private generateSuggestions(
    matches: { matchedSkills: string[]; missingSkills: string[]; missingKeywords: string[] },
    jdAnalysis: JDAnalysis,
    resume: ResumeJSON,
    overallScore: number
  ): ATSSuggestion[] {
    const suggestions: ATSSuggestion[] = [];

    // Missing required skills
    if (matches.missingSkills.length > 0) {
      suggestions.push({
        priority: 'critical',
        section: 'skills',
        message: `Missing ${matches.missingSkills.length} required skills: ${matches.missingSkills.slice(0, 5).join(', ')}`,
        action: `Add these skills to your skills section if you have experience with them`,
      });
    }

    // Missing keywords
    if (matches.missingKeywords.length > 3) {
      suggestions.push({
        priority: 'important',
        section: 'experience',
        message: `${matches.missingKeywords.length} important keywords missing from your resume`,
        action: 'Incorporate relevant keywords naturally into your experience bullets and summary',
      });
    }

    // Summary check
    if (!resume.summary || resume.summary.length < 50) {
      suggestions.push({
        priority: 'important',
        section: 'summary',
        message: 'Professional summary is missing or too short',
        action: 'Add a 2-3 sentence summary highlighting your relevant experience for this role',
      });
    }

    // Experience bullet quality
    const shortBullets = resume.experience.flatMap(e =>
      e.bullets.filter(b => b.length < 30)
    );
    if (shortBullets.length > 2) {
      suggestions.push({
        priority: 'suggested',
        section: 'experience',
        message: `${shortBullets.length} bullet points are too short and lack detail`,
        action: 'Expand bullets with specific achievements, metrics, and impact',
      });
    }

    // Action verbs
    if (jdAnalysis.actionVerbs.length > 0) {
      suggestions.push({
        priority: 'suggested',
        section: 'experience',
        message: 'Strengthen bullet points with action verbs from the job description',
        action: `Use verbs like: ${jdAnalysis.actionVerbs.slice(0, 5).join(', ')}`,
      });
    }

    // Score-based general advice
    if (overallScore < 50) {
      suggestions.push({
        priority: 'critical',
        section: 'overall',
        message: 'Your resume needs significant improvements to pass ATS screening',
        action: 'Use the AI Auto-Enhance feature to automatically optimize your resume',
      });
    } else if (overallScore < 70) {
      suggestions.push({
        priority: 'important',
        section: 'overall',
        message: 'Your resume is a partial match - targeted improvements recommended',
        action: 'Focus on adding missing skills and incorporating key terms into experience bullets',
      });
    }

    return suggestions;
  }

  private extractResumeText(resume: ResumeJSON): string {
    const parts: string[] = [];

    if (resume.personalInfo) {
      parts.push(resume.personalInfo.name || '');
      parts.push(resume.personalInfo.title || '');
    }
    if (resume.summary) parts.push(resume.summary);

    for (const exp of resume.experience) {
      parts.push(exp.jobTitle, exp.company);
      parts.push(...exp.bullets);
    }
    for (const edu of resume.education) {
      parts.push(edu.degree, edu.institution, edu.field || '');
    }
    for (const skill of resume.skills) {
      parts.push(skill.name);
    }
    for (const cert of resume.certifications) {
      parts.push(cert.name);
    }
    for (const proj of resume.projects) {
      parts.push(proj.name, proj.description, ...proj.techStack);
    }

    return parts.filter(Boolean).join(' ');
  }
}
