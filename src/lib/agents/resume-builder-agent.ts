/**
 * Resume Builder Agent
 * Enhances resume content to improve ATS score
 * Iterative: enhance -> score -> enhance until target or max iterations
 */

import { BaseAgent } from './base-agent';
import { JDAnalysis, ResumeJSON, EnhancementChange, EnhancementResult } from './types';
import { ATSScorerAgent } from './ats-scorer-agent';

interface BuilderInput {
  resume: ResumeJSON;
  jdAnalysis: JDAnalysis;
  targetScore?: number;
  maxIterations?: number;
}

export class ResumeBuilderAgent extends BaseAgent<BuilderInput, EnhancementResult> {
  constructor() {
    super('resume-builder', { model: 'gpt-4o-mini', maxRetries: 1 });
  }

  protected async execute(input: BuilderInput): Promise<{ data: EnhancementResult; tokensUsed: number }> {
    const { resume, jdAnalysis, targetScore = 75, maxIterations = 2 } = input;
    let totalTokens = 0;
    const allChanges: EnhancementChange[] = [];

    // Deep clone resume for modification
    let enhancedResume: ResumeJSON = JSON.parse(JSON.stringify(resume));

    // Score before enhancement
    this.emitProgress('Calculating initial score...', 5);
    const scorer = new ATSScorerAgent();
    const beforeResult = await scorer.run({ resume: enhancedResume, jdAnalysis });
    const beforeScore = beforeResult.data?.overall || 0;
    totalTokens += beforeResult.tokensUsed;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const iterProgress = (iteration / maxIterations) * 80 + 10;

      // 1. Enhance Skills
      this.emitProgress(`Enhancing skills (iteration ${iteration + 1})...`, iterProgress);
      const skillsResult = await this.enhanceSkills(enhancedResume, jdAnalysis);
      allChanges.push(...skillsResult.changes);
      totalTokens += skillsResult.tokensUsed;

      // 2. Enhance Experience Bullets
      this.emitProgress(`Enhancing experience bullets...`, iterProgress + 20);
      const expResult = await this.enhanceExperience(enhancedResume, jdAnalysis);
      allChanges.push(...expResult.changes);
      totalTokens += expResult.tokensUsed;

      // 3. Enhance Summary
      this.emitProgress(`Enhancing summary...`, iterProgress + 35);
      const summaryResult = await this.enhanceSummary(enhancedResume, jdAnalysis);
      if (summaryResult.change) allChanges.push(summaryResult.change);
      totalTokens += summaryResult.tokensUsed;

      // Check score after this iteration
      const currentResult = await scorer.run({ resume: enhancedResume, jdAnalysis });
      const currentScore = currentResult.data?.overall || 0;
      totalTokens += currentResult.tokensUsed;

      if (currentScore >= targetScore) {
        this.emitProgress(`Target score reached: ${currentScore}`, 95);
        break;
      }
    }

    // Final score
    const afterResult = await scorer.run({ resume: enhancedResume, jdAnalysis });
    const afterScore = afterResult.data?.overall || 0;
    totalTokens += afterResult.tokensUsed;

    return {
      data: {
        enhancedResume,
        changes: allChanges,
        beforeScore,
        afterScore,
        summary: {
          skillsAdded: allChanges.filter(c => c.section === 'skills' && c.type === 'added').length,
          bulletsModified: allChanges.filter(c => c.section === 'experience').length,
          summaryEnhanced: allChanges.some(c => c.section === 'summary'),
          projectsEnhanced: allChanges.filter(c => c.section === 'projects').length,
        },
      },
      tokensUsed: totalTokens,
    };
  }

  private async enhanceSkills(
    resume: ResumeJSON,
    jdAnalysis: JDAnalysis
  ): Promise<{ changes: EnhancementChange[]; tokensUsed: number }> {
    const changes: EnhancementChange[] = [];
    const existingSkillNames = resume.skills.map(s => s.name.toLowerCase());

    const missingRequired = jdAnalysis.requiredSkills.filter(
      s => !existingSkillNames.some(e => e.includes(s.toLowerCase()) || s.toLowerCase().includes(e))
    );
    const missingPreferred = jdAnalysis.preferredSkills.filter(
      s => !existingSkillNames.some(e => e.includes(s.toLowerCase()) || s.toLowerCase().includes(e))
    );

    if (missingRequired.length === 0 && missingPreferred.length === 0) {
      return { changes, tokensUsed: 0 };
    }

    const experienceContext = resume.experience.slice(0, 3).map(e => ({
      title: e.jobTitle,
      company: e.company,
      bullets: e.bullets.slice(0, 3),
    }));

    const { content, tokensUsed } = await this.callLLM({
      systemPrompt: 'You are an ATS optimization expert. Add skills that are supported by the candidate\'s experience AND required by the JD. Never add the job title as a skill. Always return valid JSON.',
      userPrompt: `Based on this candidate's experience, which missing skills should be added to their Skills section?

Experience:
${JSON.stringify(experienceContext, null, 2)}

Missing Required Skills: ${missingRequired.filter(s => s.toLowerCase() !== jdAnalysis.jobTitle.toLowerCase()).join(', ')}
Missing Preferred Skills: ${missingPreferred.filter(s => s.toLowerCase() !== jdAnalysis.jobTitle.toLowerCase()).join(', ')}
Missing Tools: ${(jdAnalysis.tools || []).filter((t: string) => !existingSkillNames.some(e => e.includes(t.toLowerCase()))).join(', ')}

Target Job: ${jdAnalysis.jobTitle}

Rules:
- ADD skills, tools, and technologies the candidate demonstrably has based on their bullet points
- ADD related/equivalent technologies (if they use PostgreSQL, they likely know SQL)
- NEVER add the job title itself as a skill (e.g., don't add "Java Developer")
- Categorize as "technical" (languages, frameworks, DBs), "tools" (software, platforms), or "soft" (methodologies)

Return JSON:
{
  "skills": [
    { "name": "skill name", "category": "technical", "reason": "why it's legitimate" }
  ]
}`,
      temperature: 0.3,
      maxTokens: 1000,
    });

    try {
      const parsed = JSON.parse(content);
      const skillsToAdd = parsed.skills || [];
      const jobTitleLower = jdAnalysis.jobTitle.toLowerCase();

      for (const skill of skillsToAdd) {
        // Skip if skill is the job title
        if (skill.name.toLowerCase() === jobTitleLower || skill.name.toLowerCase().includes(jobTitleLower)) {
          continue;
        }
        const id = `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        resume.skills.push({
          id,
          name: skill.name,
          category: skill.category || 'technical',
        });
        changes.push({
          section: 'skills',
          type: 'added',
          before: '',
          after: skill.name,
          reason: skill.reason || `Required for ${jdAnalysis.jobTitle}`,
        });
      }
    } catch {
      // If parsing fails, skip skill enhancement
    }

    return { changes, tokensUsed };
  }

  private async enhanceExperience(
    resume: ResumeJSON,
    jdAnalysis: JDAnalysis
  ): Promise<{ changes: EnhancementChange[]; tokensUsed: number }> {
    const changes: EnhancementChange[] = [];
    let totalTokens = 0;

    // Only enhance first 2-3 experiences (most relevant/recent)
    const toEnhance = resume.experience.slice(0, Math.min(3, resume.experience.length));

    for (const exp of toEnhance) {
      if (exp.bullets.length === 0) continue;

      const { content, tokensUsed } = await this.callLLM({
        systemPrompt: 'You are an expert ATS resume optimizer. Your PRIMARY job is to swap in specific technologies from the job description and add JD-relevant tech where it fits naturally. Do NOT just rephrase or swap synonyms. Always return valid JSON.',
        userPrompt: `Enhance these resume bullets for a ${jdAnalysis.jobTitle} position using SPECIFIC technologies from the JD.

Current Role: ${exp.jobTitle} at ${exp.company}
Current Bullets:
${exp.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Technologies & Skills from JD: ${[...jdAnalysis.requiredSkills.slice(0, 10), ...(jdAnalysis.tools || []).slice(0, 5)].join(', ')}
Action verbs to use: ${jdAnalysis.actionVerbs.slice(0, 6).join(', ')}

CRITICAL RULES:
1. REPLACE equivalent technologies with JD's versions (e.g., Oracle ADF → Spring Boot, MySQL → PostgreSQL)
2. ADD specific JD technologies where they naturally fit (e.g., "Built APIs" → "Built REST APIs using Spring Boot")
3. Incorporate JD methodologies/practices (Agile, Microservices, CI/CD) naturally
4. When JD lists alternatives (AWS/GCP/Azure), pick ONLY ONE - prefer what's already in the resume, be consistent across all bullets
5. Do NOT just swap synonyms - every change must add a concrete JD technology/keyword
6. Keep core truth, metrics, and achievements intact
7. Do NOT fabricate achievements
8. Keep each bullet to 1-2 lines
9. Wrap important technologies, tools, frameworks, and platforms in **double asterisks** for bold emphasis (e.g., "Developed **REST APIs** using **Spring Boot**")

Return JSON:
{
  "bullets": [
    {
      "text": "Enhanced bullet with JD technologies",
      "keywordsIncorporated": ["Spring Boot", "Microservices"]
    }
  ]
}`,
        temperature: 0.4,
        maxTokens: 2000,
      });

      totalTokens += tokensUsed;

      try {
        const parsed = JSON.parse(content);
        const newBullets = parsed.bullets || [];

        for (let i = 0; i < Math.min(newBullets.length, exp.bullets.length); i++) {
          const bullet = newBullets[i];
          const bulletText = typeof bullet === 'string' ? bullet : bullet.text;
          const keywords = typeof bullet === 'object' && bullet.keywordsIncorporated
            ? bullet.keywordsIncorporated
            : [];

          if (bulletText && bulletText !== exp.bullets[i]) {
            const reason = keywords.length > 0
              ? `Incorporated: ${keywords.join(', ')}`
              : `Optimized for ${jdAnalysis.jobTitle}`;
            changes.push({
              section: 'experience',
              type: 'modified',
              before: exp.bullets[i],
              after: bulletText,
              reason,
            });
            exp.bullets[i] = bulletText;
          }
        }
      } catch {
        // Skip if parsing fails
      }
    }

    return { changes, tokensUsed: totalTokens };
  }

  private async enhanceSummary(
    resume: ResumeJSON,
    jdAnalysis: JDAnalysis
  ): Promise<{ change: EnhancementChange | null; tokensUsed: number }> {
    const original = resume.summary || '';

    const action = original ? 'enhance' : 'generate';
    const { content, tokensUsed } = await this.callLLM({
      systemPrompt: 'You are an expert resume writer. Always return valid JSON.',
      userPrompt: action === 'generate'
        ? `Create a professional summary for a ${jdAnalysis.jobTitle} candidate.
Experience: ${resume.experience.slice(0, 3).map(e => `${e.jobTitle} at ${e.company}`).join(', ')}
Skills: ${resume.skills.slice(0, 10).map(s => s.name).join(', ')}
Key requirements: ${jdAnalysis.requiredSkills.slice(0, 8).join(', ')}

Write 2-3 sentences. Professional tone. No first-person pronouns.
Return: { "summary": "the summary" }`
        : `Enhance this summary for a ${jdAnalysis.jobTitle} role:
"${original}"
Key requirements: ${jdAnalysis.requiredSkills.slice(0, 8).join(', ')}
Keywords: ${jdAnalysis.keywords.slice(0, 8).join(', ')}

Keep it 2-3 sentences. Incorporate 3-5 keywords naturally. Maintain truthfulness.
Return: { "summary": "enhanced summary" }`,
      temperature: 0.6,
      maxTokens: 300,
    });

    try {
      const parsed = JSON.parse(content);
      if (parsed.summary && parsed.summary !== original) {
        resume.summary = parsed.summary;
        return {
          change: {
            section: 'summary',
            type: action === 'generate' ? 'added' : 'enhanced',
            before: original,
            after: parsed.summary,
            reason: `Optimized for ${jdAnalysis.jobTitle}`,
          },
          tokensUsed,
        };
      }
    } catch {
      // Skip if parsing fails
    }

    return { change: null, tokensUsed };
  }
}
