/**
 * AI Auto-Enhancement Engine
 * Intelligently enhances resume content based on job description analysis
 * Adds skills, modifies experience bullets, optimizes summary - all done systematically
 */

import OpenAI from 'openai';
import { JDAnalysisResult, JobDescriptionAnalyzer } from './jd-analyzer';

export interface EnhancementResult {
  enhancedResume: any;
  changes: EnhancementChange[];
  summary: {
    skillsAdded: number;
    bulletsModified: number;
    summaryEnhanced: boolean;
    projectsEnhanced: number;
  };
}

export interface EnhancementChange {
  section: 'skills' | 'experience' | 'summary' | 'projects' | 'certifications';
  type: 'added' | 'modified' | 'enhanced';
  before: string;
  after: string;
  reason: string;
}

export class AIAutoEnhancer {
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
   * Main auto-enhancement function
   * Intelligently enhances entire resume based on job description
   */
  static async autoEnhanceResume(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementResult> {
    const changes: EnhancementChange[] = [];
    const enhancedResume = JSON.parse(JSON.stringify(resumeData)); // Deep clone

    // 1. Enhance Skills Section
    const skillsChanges = await this.enhanceSkills(enhancedResume, jdAnalysis);
    changes.push(...skillsChanges);

    // 2. Enhance Experience Bullets
    const experienceChanges = await this.enhanceExperience(enhancedResume, jdAnalysis);
    changes.push(...experienceChanges);

    // 3. Enhance Professional Summary
    const summaryChange = await this.enhanceSummary(enhancedResume, jdAnalysis);
    if (summaryChange) {
      changes.push(summaryChange);
    }

    // 4. Enhance Projects (if any)
    const projectsChanges = await this.enhanceProjects(enhancedResume, jdAnalysis);
    changes.push(...projectsChanges);

    // Create summary
    const summary = {
      skillsAdded: skillsChanges.filter(c => c.type === 'added').length,
      bulletsModified: experienceChanges.length,
      summaryEnhanced: !!summaryChange,
      projectsEnhanced: projectsChanges.length,
    };

    return {
      enhancedResume,
      changes,
      summary,
    };
  }

  /**
   * Enhance skills section by adding relevant missing skills
   */
  private static async enhanceSkills(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementChange[]> {
    const changes: EnhancementChange[] = [];
    
    // Get existing skills as flat array
    const existingSkills = this.extractExistingSkills(resumeData);
    const existingSkillsLower = existingSkills.map(s => s.toLowerCase());

    // Find missing required skills from JD
    const missingRequiredSkills = jdAnalysis.requiredSkills.filter(
      skill => !existingSkillsLower.includes(skill.toLowerCase())
    );

    // Find missing preferred skills
    const missingPreferredSkills = jdAnalysis.preferredSkills.filter(
      skill => !existingSkillsLower.includes(skill.toLowerCase())
    );

    // Use AI to determine which missing skills should be added
    // (Only add skills that make sense based on existing experience)
    const skillsToAdd = await this.determineSkillsToAdd(
      resumeData,
      missingRequiredSkills,
      missingPreferredSkills,
      jdAnalysis
    );

    // Add skills in appropriate categories
    if (!resumeData.skills) {
      resumeData.skills = [];
    }

    // Handle both array and object format
    if (Array.isArray(resumeData.skills)) {
      // Check if array contains strings or objects
      const isStringArray = resumeData.skills.length === 0 || 
                           typeof resumeData.skills[0] === 'string';
      
      skillsToAdd.forEach(skill => {
        if (isStringArray) {
          // Simple string array
          resumeData.skills.push(skill.name);
        } else {
          // Skill object array with { id, name, category }
          // Map AI categories to our schema: Technical|Soft|Tools -> technical|soft|language
          let mappedCategory = 'technical';
          if (skill.category.toLowerCase().includes('soft')) {
            mappedCategory = 'soft';
          } else if (skill.category.toLowerCase().includes('language')) {
            mappedCategory = 'language';
          }
          
          resumeData.skills.push({
            id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: skill.name,
            category: mappedCategory,
          });
        }
        changes.push({
          section: 'skills',
          type: 'added',
          before: '',
          after: skill.name,
          reason: skill.reason,
        });
      });
    } else {
      // Grouped format
      skillsToAdd.forEach(skill => {
        const category = skill.category || 'Technical';
        if (!resumeData.skills[category]) {
          resumeData.skills[category] = [];
        }
        resumeData.skills[category].push(skill.name);
        changes.push({
          section: 'skills',
          type: 'added',
          before: '',
          after: skill.name,
          reason: skill.reason,
        });
      });
    }

    return changes;
  }

  /**
   * Use AI to determine which skills to add based on resume context
   */
  private static async determineSkillsToAdd(
    resumeData: any,
    missingRequired: string[],
    missingPreferred: string[],
    jdAnalysis: JDAnalysisResult
  ): Promise<Array<{ name: string; category: string; reason: string }>> {
    // Also include missing tools from JD
    const existingSkills = this.extractExistingSkills(resumeData).map(s => s.toLowerCase());
    const missingTools = (jdAnalysis.tools || []).filter(
      tool => !existingSkills.includes(tool.toLowerCase())
    );

    if (missingRequired.length === 0 && missingPreferred.length === 0 && missingTools.length === 0) {
      return [];
    }

    const client = this.getOpenAIClient();

    // Extract context from resume (include bullets for more context)
    const experienceSummary = resumeData.experience?.map((exp: any) => ({
      title: exp.jobTitle || exp.position,
      company: exp.company,
      description: exp.description || '',
      bullets: (exp.bullets || exp.achievements || []).slice(0, 4),
    })) || [];

    // Filter out job title from skills lists
    const jobTitleLower = jdAnalysis.jobTitle.toLowerCase();
    const filterJobTitle = (skills: string[]) => skills.filter(
      s => s.toLowerCase() !== jobTitleLower && !s.toLowerCase().includes(jobTitleLower)
    );

    const prompt = `You are an expert resume consultant specializing in ATS optimization. Analyze the candidate's experience and determine which missing skills/tools from the job description should be added to their Skills section.

## Candidate's Experience:
${JSON.stringify(experienceSummary, null, 2)}

## Skills Missing from Resume (grouped by priority):
Required Skills: ${filterJobTitle(missingRequired).join(', ') || 'None'}
Preferred Skills: ${filterJobTitle(missingPreferred).join(', ') || 'None'}
Tools & Technologies: ${filterJobTitle(missingTools).join(', ') || 'None'}

## Target Position: ${jdAnalysis.jobTitle}

## Rules:
1. ADD skills that the candidate demonstrably has based on their experience bullets (e.g., if they "developed REST APIs" they likely know HTTP, API Design, etc.)
2. ADD tools/technologies mentioned in the JD that are closely related to what the candidate already uses (e.g., if they use PostgreSQL, adding SQL is legitimate)
3. ADD methodologies/practices implied by their work (e.g., if they worked in sprints, add "Agile" and "Scrum")
4. Do NOT add skills completely unrelated to their background
5. Categorize each skill precisely:
   - "Technical" for programming languages, frameworks, libraries, databases, cloud services
   - "Tools" for specific software tools, platforms, IDEs, DevOps tools
   - "Soft" for methodologies, practices, interpersonal skills
6. NEVER add the job title itself as a skill
7. Prioritize: Required > Tools > Preferred

Return a JSON array:
{
  "skills": [
    {
      "name": "skill name exactly as it appears in the JD",
      "category": "Technical|Tools|Soft",
      "reason": "Brief reason based on their actual experience"
    }
  ]
}

If no skills should be added, return: { "skills": [] }`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an ATS optimization expert. Add skills that are genuinely supported by the candidate\'s experience AND required by the job description. Never add the job title as a skill. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);

      // Handle both array and object with 'skills' key
      const skillsArray = Array.isArray(parsed) ? parsed : (parsed.skills || []);

      // Post-process: filter out the job title if it somehow got through
      return skillsArray.filter((skill: any) =>
        skill.name &&
        skill.name.toLowerCase() !== jobTitleLower &&
        !skill.name.toLowerCase().includes(jobTitleLower)
      );
    } catch (error) {
      console.error('Error determining skills to add:', error);
      // Fallback: add top 3 required skills if they seem technical
      return filterJobTitle(missingRequired).slice(0, 3).map(skill => ({
        name: skill,
        category: 'Technical',
        reason: 'Required skill from job description',
      }));
    }
  }

  /**
   * Enhance experience bullets to incorporate JD keywords naturally
   */
  /**
   * Enhance experience bullets in a SINGLE batched call across all experiences.
   *
   * Why one call:
   *  - Cost: collapses 1-3 OpenAI calls into 1, and the long instructions are
   *    sent once instead of N times.
   *  - Quality: the model sees every bullet in every role at once, so it can
   *    distribute each JD keyword to the single best-matching bullet on its
   *    own — no need to thread a `usedKeywords` set between calls.
   */
  private static async enhanceExperience(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementChange[]> {
    const changes: EnhancementChange[] = [];

    if (!resumeData.experience || !Array.isArray(resumeData.experience)) {
      return changes;
    }

    // Build a flat list of {expIdx, bulletIdx, text} addressing every bullet
    // we want to consider. Cap at the 3 most recent roles — that's where
    // recruiters look first; older roles stay untouched.
    type Addr = { expIdx: number; bulletIdx: number; text: string; field: 'bullets' | 'achievements' | 'description' };
    const flat: Addr[] = [];
    const expCount = Math.min(resumeData.experience.length, 3);
    for (let expIdx = 0; expIdx < expCount; expIdx++) {
      const exp = resumeData.experience[expIdx];
      let bullets: string[] = [];
      let field: Addr['field'] = 'bullets';
      if (exp.bullets && Array.isArray(exp.bullets)) {
        bullets = exp.bullets; field = 'bullets';
      } else if (exp.achievements && Array.isArray(exp.achievements)) {
        bullets = exp.achievements; field = 'achievements';
      } else if (exp.description) {
        bullets = [exp.description]; field = 'description';
      }
      bullets.forEach((text, bulletIdx) => {
        if (text && text.trim()) flat.push({ expIdx, bulletIdx, text, field });
      });
    }

    if (flat.length === 0) return changes;

    const enhanced = await this.enhanceAllBullets(flat, resumeData.experience.slice(0, expCount), jdAnalysis);

    // Apply results back to the resume in place, and record changes.
    enhanced.forEach((result, i) => {
      const addr = flat[i];
      const exp = resumeData.experience[addr.expIdx];
      if (result.text !== addr.text) {
        const keywordsUsed = result.keywordsIncorporated?.length
          ? result.keywordsIncorporated.join(', ')
          : 'ATS optimization';
        changes.push({
          section: 'experience',
          type: 'modified',
          before: addr.text,
          after: result.text,
          reason: `Incorporated: ${keywordsUsed}`,
        });
      }
      if (addr.field === 'description') {
        exp.description = result.text;
      } else {
        const arr = exp[addr.field] as string[];
        arr[addr.bulletIdx] = result.text;
      }
    });

    return changes;
  }

  /**
   * Batched enhancement of every bullet across all (recent) experiences in a
   * single OpenAI call. Returns enhanced text + keywordsIncorporated per
   * bullet in the same order it was passed in.
   */
  private static async enhanceAllBullets(
    flat: Array<{ expIdx: number; bulletIdx: number; text: string }>,
    experiences: Array<{ jobTitle?: string; position?: string; company?: string }>,
    jdAnalysis: JDAnalysisResult,
  ): Promise<Array<{ text: string; keywordsIncorporated: string[] }>> {
    const client = this.getOpenAIClient();

    const allTechnologies = [...new Set([
      ...jdAnalysis.requiredSkills,
      ...jdAnalysis.tools,
      ...(jdAnalysis.preferredSkills || []),
    ])].filter(t => t.toLowerCase() !== jdAnalysis.jobTitle.toLowerCase());

    // Group bullets by experience for the prompt — easier for the model to
    // reason about role-appropriate keyword placement.
    const grouped: Record<number, Array<{ globalIdx: number; text: string }>> = {};
    flat.forEach((b, globalIdx) => {
      if (!grouped[b.expIdx]) grouped[b.expIdx] = [];
      grouped[b.expIdx].push({ globalIdx, text: b.text });
    });

    const rolesBlock = experiences.map((exp, i) => {
      const bullets = grouped[i] || [];
      const title = exp.jobTitle || exp.position || 'Unknown';
      const company = exp.company || 'Unknown';
      const lines = bullets.map(b => `  [${b.globalIdx}] ${b.text}`).join('\n');
      return `### Role ${i + 1}: ${title} at ${company}\n${lines || '  (no bullets)'}`;
    }).join('\n\n');

    // Two-phase structured-output prompt:
    //  Phase 1 (plan): for each candidate keyword, the model proposes a primary
    //  bullet AND at least one alternate, cites EVIDENCE from the original
    //  bullet text supporting the placement, and either commits or rejects.
    //  Phase 2 (rewrite): the model executes the committed plan and produces
    //  the final bullets.
    // Forcing the plan first inside the JSON shape is "chain-of-thought as a
    // schema constraint" — the model is required to reason explicitly before
    // it writes, which catches "force-fitted" keywords that wouldn't survive
    // a fabrication audit. All in one API call, no extra cost.
    const prompt = `You are an expert ATS resume optimizer. You will rewrite resume bullets across an ENTIRE candidate's recent experience in ONE structured pass, distributing job-description keywords with evidence-based reasoning.

## Target Position: ${jdAnalysis.jobTitle}

## Keyword Pool (from JD — these are the candidates you may consider adding):
${allTechnologies.join(', ')}

## Action Verbs from JD:
${jdAnalysis.actionVerbs?.slice(0, 10).join(', ') || 'develop, design, implement, lead, build, optimize'}

## Candidate's Bullets (each labeled with its global [index]):
${rolesBlock}

================================================================
## METHOD — you MUST follow this structured reasoning process:

### PHASE 1 — Plan (per keyword)
For EACH keyword in the pool, perform this analysis BEFORE writing anything:

  1. **Hypothesis**: identify the single bullet whose existing content is the most natural carrier for this keyword.
  2. **Evidence**: quote the EXACT phrase from that bullet's original text that supports adding this keyword (e.g. "Built data pipeline" supports adding "Kafka"). Evidence must be a substring of the original bullet.
  3. **Alternates**: name up to 2 OTHER bullets you also considered, and one sentence on why they're weaker fits.
  4. **Decision**:
     - "place" if the evidence cleanly supports the keyword in the same technical domain (DB→DB, framework→framework, etc.)
     - "reject" if no bullet has supporting evidence. Authenticity beats coverage — never force.
  5. **Domain check** (only for "place"): the evidence must be in the SAME category as the keyword. A bullet about UI never gets a database keyword. A bullet about deployment never gets a frontend framework.

Then, GLOBALLY across the plan:
  - No keyword may be "place"-d into more than one bullet.
  - If the JD lists alternatives (AWS/GCP/Azure, React/Angular/Vue), pick exactly ONE — prefer what the resume already uses — and apply that single choice everywhere.

### PHASE 2 — Rewrite
For each bullet that received a "place" decision, weave the keyword in naturally:
  - **Apple-to-apple replacement** (preferred): if the bullet already names a tech that serves the same purpose as the JD keyword, REPLACE the old tech with the JD's version. ("MySQL" → "PostgreSQL", "Jenkins" → "GitHub Actions".)
  - **Augmentation** (fallback): if no replacement exists, add the keyword inline where the evidence supports it. ("Built data pipeline" → "Built **Kafka**-backed data pipeline".)
  - Preserve voice, tone, and every existing number/metric EXACTLY.
  - No synonym swaps with no information gain ("enhanced" → "improved" is forbidden).
  - No fabricated metrics, achievements, or responsibilities.
  - Wrap injected technical keywords in **double asterisks** for bold. Only bold technologies / tools / frameworks / languages / methodologies — never generic words.

For every bullet that received no "place" decision, return its text UNCHANGED.

================================================================
## OUTPUT — return strict JSON in this exact shape:

{
  "plan": [
    {
      "keyword": "Spring Boot",
      "hypothesis_bullet_index": 3,
      "evidence_quote": "Built REST APIs",
      "alternates_considered": [{ "index": 7, "reason_rejected": "UI work, wrong domain" }],
      "domain_check": "framework→framework — bullet describes API work",
      "decision": "place"
    },
    {
      "keyword": "Apache Spark",
      "hypothesis_bullet_index": null,
      "evidence_quote": "",
      "alternates_considered": [],
      "domain_check": "no bullets reference batch/big-data processing",
      "decision": "reject"
    }
  ],
  "bullets": [
    { "index": 0, "text": "<final text>", "keywordsIncorporated": ["Spring Boot"] },
    { "index": 1, "text": "<original text unchanged>", "keywordsIncorporated": [] }
    // ... one entry for every input bullet (0..${flat.length - 1})
  ]
}

Hard constraints:
- Every input bullet index (0..${flat.length - 1}) MUST appear exactly once in "bullets".
- Every placed keyword must appear in exactly one bullet's "keywordsIncorporated".
- evidence_quote must be a verbatim substring of the original bullet text — if you cannot quote it, the decision MUST be "reject".`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert ATS resume optimizer. You ALWAYS produce a per-keyword plan with evidence quoted verbatim from the original bullet text BEFORE writing the final bullets. You never place a keyword without evidence. You never add a keyword to more than one bullet. You never fabricate metrics, responsibilities, or technologies. Authenticity beats coverage. Always return valid JSON in the exact schema requested.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return flat.map(f => ({ text: f.text, keywordsIncorporated: [] }));
      }

      const parsed = JSON.parse(content);
      const resultArray = Array.isArray(parsed.bullets) ? parsed.bullets : [];

      // ---- Server-side audit of the model's plan + rewrites ----
      // The structured plan gives us something concrete to verify. We enforce
      // two invariants regardless of what the model claimed:
      //   (A) No keyword is placed in more than one bullet (deduplicate by
      //       first-seen even if the model violates the rule).
      //   (B) Any keywordsIncorporated entry must be a token that actually
      //       appears in the JD pool (no fabricated technologies).
      const poolLower = new Set(allTechnologies.map(t => t.toLowerCase().trim()));
      const seenKeyword = new Set<string>();

      const byIndex = new Map<number, { text: string; keywordsIncorporated: string[] }>();
      resultArray.forEach((r: any) => {
        if (typeof r?.index !== 'number' || typeof r?.text !== 'string') return;
        const rawKeywords: string[] = Array.isArray(r.keywordsIncorporated) ? r.keywordsIncorporated : [];
        const cleanedKeywords = rawKeywords
          .map(k => String(k || '').trim())
          .filter(k => k.length > 0)
          .filter(k => poolLower.has(k.toLowerCase()))          // (B) reject anything not in the JD pool
          .filter(k => {
            const key = k.toLowerCase();
            if (seenKeyword.has(key)) return false;             // (A) first-bullet wins, drop duplicates
            seenKeyword.add(key);
            return true;
          });

        byIndex.set(r.index, { text: r.text, keywordsIncorporated: cleanedKeywords });
      });

      return flat.map((f, i) => byIndex.get(i) || { text: f.text, keywordsIncorporated: [] });
    } catch (error) {
      console.error('Error enhancing bullets:', error);
      return flat.map(f => ({ text: f.text, keywordsIncorporated: [] }));
    }
  }

  /**
   * Enhance professional summary to align with JD
   */
  private static async enhanceSummary(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementChange | null> {
    if (!resumeData.summary) {
      // Generate a new summary if none exists
      resumeData.summary = await this.generateSummary(resumeData, jdAnalysis);
      return {
        section: 'summary',
        type: 'added',
        before: '',
        after: resumeData.summary,
        reason: 'Generated tailored summary for job application',
      };
    }

    const client = this.getOpenAIClient();
    const originalSummary = resumeData.summary;

    const prompt = `You are an expert resume writer. Enhance this professional summary to better align with the target job.

Current Summary:
"${originalSummary}"

Target Job: ${jdAnalysis.jobTitle}
Key Required Skills/Technologies: ${[...jdAnalysis.requiredSkills.slice(0, 8), ...(jdAnalysis.tools || []).slice(0, 5)].join(', ')}
Important Keywords: ${jdAnalysis.keywords.slice(0, 10).join(', ')}

Instructions:
1. Incorporate specific technologies and tools from the JD (not just generic terms)
2. Mention 3-5 specific technical skills/tools that match the JD
3. Keep the candidate's core strengths and experience
4. Keep it to 3-4 sentences
5. Make it compelling and achievement-oriented
6. DO NOT fabricate experience or qualifications
7. DO NOT just swap synonyms - add real JD-specific terms

Return JSON:
{
  "summary": "Enhanced professional summary with specific JD technologies woven in"
}`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const parsed = JSON.parse(content);
      const enhancedSummary = parsed.summary;

      if (enhancedSummary && enhancedSummary !== originalSummary) {
        resumeData.summary = enhancedSummary;
        return {
          section: 'summary',
          type: 'enhanced',
          before: originalSummary,
          after: enhancedSummary,
          reason: 'Optimized for target job description',
        };
      }

      return null;
    } catch (error) {
      console.error('Error enhancing summary:', error);
      return null;
    }
  }

  /**
   * Generate a new summary from scratch
   */
  private static async generateSummary(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<string> {
    const client = this.getOpenAIClient();

    const experienceSummary = resumeData.experience?.slice(0, 3).map((exp: any) => ({
      title: exp.jobTitle || exp.position,
      company: exp.company,
    })) || [];

    const skills = this.extractExistingSkills(resumeData);

    const prompt = `Create a compelling professional summary for this resume targeting a ${jdAnalysis.jobTitle} position.

Candidate's Background:
- Recent Roles: ${experienceSummary.map((e: any) => `${e.title} at ${e.company}`).join(', ')}
- Skills: ${skills.slice(0, 10).join(', ')}

Target Job Requirements:
${jdAnalysis.requiredSkills.slice(0, 8).join(', ')}

Create a 3-4 sentence professional summary that:
1. Highlights relevant experience
2. Emphasizes key skills that match the JD
3. Is compelling and achievement-oriented
4. Positions them as a strong fit

Return JSON:
{
  "summary": "Professional summary here"
}`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return '';
      }

      const parsed = JSON.parse(content);
      return parsed.summary || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  /**
   * Enhance projects section
   */
  private static async enhanceProjects(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementChange[]> {
    const changes: EnhancementChange[] = [];

    if (!resumeData.projects || !Array.isArray(resumeData.projects)) {
      return changes;
    }

    // Collect top 3 projects with non-empty descriptions
    const slice = resumeData.projects.slice(0, 3);
    const targets: Array<{ projIdx: number; name: string; description: string }> = [];
    slice.forEach((p: any, projIdx: number) => {
      if (p?.description) targets.push({ projIdx, name: p.name || `Project ${projIdx + 1}`, description: p.description });
    });
    if (targets.length === 0) return changes;

    const client = this.getOpenAIClient();
    const techPool = [...jdAnalysis.requiredSkills.slice(0, 10), ...(jdAnalysis.tools || []).slice(0, 6)];

    const projectsBlock = targets.map((t, i) => `[${i}] ${t.name}\n  ${t.description}`).join('\n\n');

    const prompt = `Rewrite the project descriptions below to align with a ${jdAnalysis.jobTitle} role, incorporating specific technologies from the JD.

## Technologies / Tools from JD (the keyword pool):
${techPool.join(', ')}

## Projects (labeled by [index]):
${projectsBlock}

## Rules:
1. Each keyword from the pool may appear in AT MOST ONE project description across the resume — pick the best-matching project for each.
2. Replace equivalent technologies (Framework→Framework, DB→DB) with the JD's versions.
3. Add specific JD technologies only where they naturally fit the project's domain.
4. Keep each description to 2-3 sentences. Emphasize results and impact.
5. Do NOT fabricate technologies. Do NOT just swap synonyms.
6. Wrap technical keywords in **double asterisks** for bold emphasis.

Return JSON:
{
  "projects": [
    { "index": 0, "description": "Rewritten description with **Spring Boot** and **PostgreSQL**..." },
    ...
  ]
}

The "projects" array MUST contain one entry per input index (0..${targets.length - 1}).`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert resume writer. Always return valid JSON keyed by the input project index.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return changes;

      const parsed = JSON.parse(content);
      const resultArray = Array.isArray(parsed.projects) ? parsed.projects : [];
      const byIndex = new Map<number, string>();
      resultArray.forEach((r: any) => {
        if (typeof r?.index === 'number' && typeof r?.description === 'string') {
          byIndex.set(r.index, r.description);
        }
      });

      targets.forEach((t, i) => {
        const enhanced = byIndex.get(i);
        if (enhanced && enhanced !== t.description) {
          resumeData.projects[t.projIdx].description = enhanced;
          changes.push({
            section: 'projects',
            type: 'enhanced',
            before: t.description,
            after: enhanced,
            reason: 'Aligned project description with JD keywords',
          });
        }
      });
    } catch (error) {
      console.error('Error enhancing projects:', error);
    }

    return changes;
  }

  /**
   * Extract existing skills from resume (handle multiple formats)
   */
  private static extractExistingSkills(resumeData: any): string[] {
    if (!resumeData.skills) return [];

    if (Array.isArray(resumeData.skills)) {
      // Handle both string array and Skill object array
      return resumeData.skills.map((skill: any) => {
        if (typeof skill === 'string') {
          return skill;
        }
        // Handle Skill object with { id, name, category }
        if (typeof skill === 'object' && skill.name) {
          return skill.name;
        }
        return '';
      }).filter(Boolean); // Remove empty strings
    }

    if (typeof resumeData.skills === 'object') {
      const allSkills: string[] = [];
      Object.values(resumeData.skills).forEach((skillSet: any) => {
        if (Array.isArray(skillSet)) {
          skillSet.forEach((skill: any) => {
            if (typeof skill === 'string') {
              allSkills.push(skill);
            } else if (typeof skill === 'object' && skill.name) {
              allSkills.push(skill.name);
            }
          });
        }
      });
      return allSkills;
    }

    return [];
  }
}
