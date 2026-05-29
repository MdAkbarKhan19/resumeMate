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

## Goal
Aim to add as MANY missing JD skills as defensible — the skills section is the highest-leverage ATS surface. Default to ADD; only skip a skill when there is genuinely no link to the candidate's domain. Conservative under-listing of skills costs the candidate ATS points.

## What counts as "defensible to add" (any ONE is enough):
1. **Directly demonstrated** — the bullet explicitly names the skill or uses it ("developed REST APIs" → API Design, HTTP, REST).
2. **Strongly implied by the work** — the work described is impossible (or atypical) without this skill. Examples:
   - "built CI/CD pipeline" → Jenkins / GitHub Actions / GitLab CI (whichever the JD wants)
   - "production microservices on AWS" → Docker, Kubernetes, IAM, CloudWatch
   - "data pipeline at scale" → Kafka, Spark, ETL, batch processing
   - "high-traffic web app" → caching (Redis), load balancing, CDN
3. **Co-technology in the same stack** — a sibling/companion tool of something they DO use. If they use PostgreSQL → add SQL, query optimization, indexing. If they use React → add JSX, ES6, component architecture, Redux/Zustand if JD lists it. If they use Spring Boot → add Maven/Gradle, JUnit, REST.
4. **Methodology/practice implied by the work** — sprints → Agile, Scrum; PR reviews → code review, Git; on-call → incident response, monitoring.
5. **Foundational under the framework they use** — if they use Spring Boot → Java; if they use Pandas → Python; if they use Next.js → React, Node.js, TypeScript.

## What NOT to add:
- Skills in a completely different domain (no iOS/Swift to a backend resume; no UX/Figma to a data engineer).
- Specific products they couldn't plausibly have touched given their roles (e.g., Salesforce Apex on a generic backend resume with no CRM context).
- Skills that contradict their seniority signals.

## Output rules:
- Categorize: "Technical" (languages/frameworks/libraries/DBs/cloud), "Tools" (IDEs/DevOps/platforms), "Soft" (methodologies/practices).
- NEVER add the job title itself as a skill.
- Prioritize: Required > Tools > Preferred — but include all three tiers liberally if defensible.
- It is OK and EXPECTED to return 8-15 skills if the JD pool is large and the candidate's domain matches; do not artificially cap at 3-5.

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

      // Honest change-classification. The model returns keywordsIncorporated,
      // but that list can include keywords that were ALREADY present in the
      // original bullet (it just bolded them). We split those out here so the
      // UI never claims to have added a keyword that the candidate already had.
      const original = addr.text;
      const rewritten = result.text;
      // Strip bold markers to compare semantic content honestly.
      const rewrittenPlain = rewritten.replace(/\*\*/g, '');
      const originalLower = original.toLowerCase();
      const claimed = result.keywordsIncorporated || [];
      const newlyAdded = claimed.filter(
        (k) => !originalLower.includes(k.toLowerCase()),
      );
      const alreadyPresent = claimed.filter((k) =>
        originalLower.includes(k.toLowerCase()),
      );
      const textMateriallyChanged = rewrittenPlain.trim() !== original.trim();

      if (textMateriallyChanged && newlyAdded.length > 0) {
        const tail =
          alreadyPresent.length > 0
            ? ` (also highlighted: ${alreadyPresent.join(', ')})`
            : '';
        changes.push({
          section: 'experience',
          type: 'modified',
          before: original,
          after: rewritten,
          reason: `Incorporated: ${newlyAdded.join(', ')}${tail}`,
        });
      } else if (textMateriallyChanged) {
        const tail =
          alreadyPresent.length > 0
            ? ` Highlighted: ${alreadyPresent.join(', ')}.`
            : '';
        changes.push({
          section: 'experience',
          type: 'modified',
          before: original,
          after: rewritten,
          reason: `Rewritten for impact and JD-tone alignment.${tail}`,
        });
      } else if (rewritten !== original && alreadyPresent.length > 0) {
        // Only difference is **bold** markers around words already in the
        // bullet. Don't pretend we incorporated anything.
        changes.push({
          section: 'experience',
          type: 'enhanced',
          before: original,
          after: rewritten,
          reason: `Highlighted for ATS visibility: ${alreadyPresent.join(', ')}`,
        });
      }
      // else: identical text, no claim — do not push a change record.

      if (addr.field === 'description') {
        exp.description = rewritten;
      } else {
        const arr = exp[addr.field] as string[];
        arr[addr.bulletIdx] = rewritten;
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

Your goal is **maximum honest coverage**. Default to "place" — only "reject" when there is genuinely no bullet whose work domain touches this keyword. Conservative under-placement is just as bad as fabrication: it leaves the candidate's ATS score on the table.

For EACH keyword in the pool, perform this analysis BEFORE writing anything:

  1. **Hypothesis**: identify the single bullet whose existing content is the most natural carrier for this keyword.
  2. **Evidence** — accept EITHER of these:
     - **Direct evidence**: a verbatim phrase from the bullet that names the same concept (e.g. "Built REST APIs" supports "Spring Boot" or "API design").
     - **Implied evidence**: the bullet describes work where this keyword is a *standard, expected tool* in that domain. Examples:
        - "data pipeline processing 10M events/day" → implies Kafka / Spark / Kinesis (pick whichever the JD asks for)
        - "CI/CD pipeline" → implies Jenkins / GitHub Actions / GitLab CI
        - "containerized services" → implies Docker / Kubernetes
        - "production microservices" → implies AWS / GCP / Azure, observability, service mesh
        - "scaled to N users / N requests" → implies caching (Redis), load balancing, sharding
     - Quote the supporting phrase verbatim in evidence_quote either way. For implied evidence, the quote is the *work description that implies the tool*, not the tool itself.
  3. **Alternates**: name up to 2 OTHER bullets you also considered, and one sentence on why they're weaker fits.
  4. **Decision**:
     - "place" if direct OR implied evidence supports the keyword in the same technical domain.
     - "reject" ONLY if no bullet's work touches this keyword's domain at all. Reject is rare — most JD keywords will find a home if you think about the domain.
  5. **Domain check** (only for "place"): the evidence must be in the SAME category as the keyword. A bullet about UI never gets a database keyword. A bullet about deployment never gets a frontend framework. iOS/mobile keywords don't go into backend bullets.

Then, GLOBALLY across the plan:
  - No keyword may be "place"-d into more than one bullet (one placement per bullet keeps the rewrite natural; the skills section catches the rest).
  - If the JD lists alternatives (AWS/GCP/Azure, React/Angular/Vue, MySQL/Postgres), pick exactly ONE — prefer what the resume already uses — and apply that single choice everywhere.
  - Aim to place at least 60-80% of the JD pool. If you're rejecting more than 40% of keywords, you are being too conservative — re-examine the bullets through an implied-evidence lens.

### PHASE 2 — Rewrite (EVERY bullet, not just the ones with keywords)

You MUST rewrite EVERY bullet for impact — not only the ones that received a "place" decision. Returning a bullet unchanged is only acceptable when (a) no keyword was placed AND (b) the bullet is already a strong, specific, action-led sentence with no weasel words. That is rare. Default to rewriting.

The rewrite has TWO independent axes — apply both:

**Axis A — Keyword integration** (only for bullets with a "place" decision):
  - **Apple-to-apple replacement** (preferred): if the bullet already names a tech that serves the same purpose as the JD keyword, REPLACE the old tech with the JD's version. ("MySQL" → "PostgreSQL", "Jenkins" → "GitHub Actions".)
  - **Augmentation** (fallback): if no replacement exists, add the keyword inline where the evidence supports it. ("Built data pipeline" → "Built **Kafka**-backed data pipeline".)

**Axis B — Impact rewrite** (EVERY bullet):
  1. **Strong opening action verb.** If the bullet starts with a weak verb ("Worked on", "Helped", "Involved in", "Responsible for", "Assisted with", "Participated in"), replace it with a precise active verb from this pool (prefer ones that match the JD's voice): Architected, Engineered, Designed, Built, Delivered, Led, Drove, Owned, Shipped, Scaled, Optimized, Reduced, Automated, Migrated, Refactored, Integrated, Implemented, Launched, Developed, Established, Streamlined.
  2. **Remove weasel words and filler.** Cut "responsible for", "helped to", "involved in", "tasked with", "assisted in", "worked on a team that". The active verb already implies ownership.
  3. **Tighten verbose phrasing.** "in order to" → "to". "due to the fact that" → "because". "utilized" → "used". "functionality" → name what the feature actually did.
  4. **JD-tone alignment.** Where the bullet uses a generic word and the JD uses a more specific/elevated synonym in the SAME domain, prefer the JD's version. Example: bullet says "service", JD says "microservice" → use "microservice". This is NOT a free synonym swap — only when the JD term is more specific AND clearly applies.
  5. **Preserve voice and POV.** First-person implied, no pronouns. Past tense for past roles, present for current.

**Hard rules — non-negotiable:**
  - Preserve EVERY number, metric, percentage, date, dollar/rupee figure, team size, and user count EXACTLY. Do not round, scale, or invent any.
  - No fabricated achievements, responsibilities, technologies, or outcomes. If the original bullet did not state an outcome, do not invent one.
  - No pure synonym swaps with no information gain ("enhanced" → "improved" is forbidden when there's no JD keyword in play).
  - Wrap ONLY injected/highlighted technical keywords (technologies, tools, frameworks, languages, methodologies) in **double asterisks**. Never bold generic verbs or domain nouns.
  - Each rewritten bullet must be a single sentence, 18–32 words ideally, max 40.

**Worked examples:**
  - WEAK: "Worked on building a REST API to handle copy order processing for the UI team"
    STRONG: "Engineered a **multi-threaded REST API in Java** that processes copy orders online and offline, eliminating UI blocking for 50K+ daily requests" (only if the metric existed in the original; otherwise omit the number)
  - WEAK: "Responsible for testing the application and fixing bugs"
    STRONG: "Drove end-to-end testing and defect triage across the application, reducing escaped defects through systematic regression coverage"
  - WEAK: "Helped to migrate legacy services to AWS"
    STRONG: "Led migration of legacy services to **AWS**, modernizing the deployment pipeline and removing on-prem dependencies"

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
- evidence_quote must be a verbatim substring of the original bullet text — for direct evidence, quote the supporting phrase; for implied evidence, quote the work-description phrase that implies the tool (e.g. quote "data pipeline" when placing Kafka on a pipeline bullet).
- Default to "place". Only "reject" when no bullet's domain touches the keyword at all.`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert ATS resume optimizer. You ALWAYS produce a per-keyword plan with evidence quoted verbatim from the original bullet text BEFORE writing the final bullets. You then REWRITE EVERY bullet for impact — strong action verbs, weasel-words removed, verbose phrasing tightened, JD-tone aligned — independent of whether a keyword was placed. Returning a bullet unchanged is the exception, not the default. You never place a keyword without evidence. You never add a keyword to more than one bullet. You never fabricate metrics, responsibilities, or technologies, and you preserve every existing number EXACTLY. Authenticity beats coverage. Always return valid JSON in the exact schema requested.',
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
