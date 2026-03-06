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
  private static async enhanceExperience(
    resumeData: any,
    jdAnalysis: JDAnalysisResult
  ): Promise<EnhancementChange[]> {
    const changes: EnhancementChange[] = [];

    if (!resumeData.experience || !Array.isArray(resumeData.experience)) {
      return changes;
    }

    // Enhance each experience entry's bullets
    for (let i = 0; i < resumeData.experience.length; i++) {
      const exp = resumeData.experience[i];

      // Get bullets (support multiple formats)
      let bullets: string[] = [];
      if (exp.bullets && Array.isArray(exp.bullets)) {
        bullets = exp.bullets;
      } else if (exp.achievements && Array.isArray(exp.achievements)) {
        bullets = exp.achievements;
      } else if (exp.description) {
        bullets = [exp.description];
      }

      if (bullets.length === 0) continue;

      // Enhance bullets for this experience
      const enhancedBulletsResult = await this.enhanceBullets(
        bullets,
        {
          jobTitle: exp.jobTitle || exp.position,
          company: exp.company,
        },
        jdAnalysis,
        i // Pass index to limit enhancements (focus on recent roles)
      );

      // Update bullets and track changes with actual keywords incorporated
      enhancedBulletsResult.forEach((result, bulletIndex) => {
        if (result.text !== bullets[bulletIndex]) {
          const keywordsUsed = result.keywordsIncorporated && result.keywordsIncorporated.length > 0
            ? result.keywordsIncorporated.join(', ')
            : 'ATS optimization';
          changes.push({
            section: 'experience',
            type: 'modified',
            before: bullets[bulletIndex],
            after: result.text,
            reason: `Incorporated: ${keywordsUsed}`,
          });
        }
      });

      // Update in resume data
      const enhancedTexts = enhancedBulletsResult.map(r => r.text);
      if (exp.bullets) {
        exp.bullets = enhancedTexts;
      } else if (exp.achievements) {
        exp.achievements = enhancedTexts;
      } else if (exp.description) {
        exp.description = enhancedTexts[0];
      }
    }

    return changes;
  }

  /**
   * Enhance individual bullets with smart technology replacement and JD keyword integration
   */
  private static async enhanceBullets(
    bullets: string[],
    context: { jobTitle?: string; company?: string },
    jdAnalysis: JDAnalysisResult,
    experienceIndex: number
  ): Promise<Array<{ text: string; keywordsIncorporated: string[] }>> {
    // Only enhance recent experiences (first 2-3 positions)
    if (experienceIndex > 2) {
      return bullets.map(b => ({ text: b, keywordsIncorporated: [] }));
    }

    const client = this.getOpenAIClient();

    // Categorize JD technologies for the prompt
    const allTechnologies = [...new Set([
      ...jdAnalysis.requiredSkills,
      ...jdAnalysis.tools,
      ...(jdAnalysis.preferredSkills || []),
    ])].filter(t => t.toLowerCase() !== jdAnalysis.jobTitle.toLowerCase());

    const prompt = `You are an expert ATS resume optimizer. Your job is to strategically modify resume bullet points to maximize ATS compatibility with the target job description.

## Target Position: ${jdAnalysis.jobTitle}

## Technologies, Tools & Skills from Job Description:
${allTechnologies.join(', ')}

## Action Verbs from JD:
${jdAnalysis.actionVerbs?.slice(0, 10).join(', ') || 'develop, design, implement, lead, build, optimize'}

## Current Role: ${context.jobTitle || 'Unknown'} at ${context.company || 'Unknown'}

## Current Bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

## CRITICAL INSTRUCTIONS - Follow these in priority order:

### 1. Smart Technology Replacement (Apple-to-Apple Swap)
When the resume mentions a technology/framework/tool/database that serves the SAME PURPOSE as one required in the JD, REPLACE it with the JD's version:
- Framework → Framework (e.g., "Oracle ADF" → "Spring Boot", "Angular" → "React")
- Database → Database (e.g., "MySQL" → "PostgreSQL", "Oracle DB" → "MongoDB")
- CI/CD → CI/CD (e.g., "Jenkins" → "GitHub Actions", "Bamboo" → "GitLab CI")
- Cloud → Cloud (e.g., "Azure" → "AWS", "Heroku" → "AWS Lambda")
- ORM → ORM (e.g., "Hibernate" → "Spring Data JPA")
- Messaging → Messaging (e.g., "ActiveMQ" → "Kafka", "RabbitMQ" → "SQS")
NEVER replace across categories (don't replace a database name with a framework).

### 2. Add JD Technologies Where They Naturally Fit
If a bullet describes work that would logically involve a technology from the JD but doesn't mention it, ADD the specific technology:
- "Developed REST APIs" → "Developed REST APIs using Spring Boot with Microservices architecture"
- "Deployed applications" → "Deployed applications on AWS using Docker and Kubernetes"
- "Built data pipeline" → "Built data pipeline using Apache Kafka and PostgreSQL"
- "Implemented authentication" → "Implemented JWT-based authentication with Spring Security"

### 3. Incorporate JD-Specific Keywords
Weave specific JD terms (methodologies, patterns, practices) into bullets naturally:
- If JD mentions "Agile/Scrum" → add "in an Agile environment" or "following Scrum methodology"
- If JD mentions "Microservices" → add architectural context
- If JD mentions "CI/CD" → reference deployment pipeline

### 4. Handle Alternatives (AWS/GCP/Azure, React/Angular/Vue, etc.)
When the JD lists multiple alternatives like "AWS/GCP/Azure" or "React/Angular/Vue":
- Pick ONLY ONE. Do NOT spread all alternatives across different bullet points.
- PREFER the one already mentioned in the resume. If the resume already uses "AWS", keep "AWS".
- If the resume doesn't mention any of them, pick the most commonly used one (AWS > GCP > Azure for cloud; React > Angular > Vue for frontend).
- Be CONSISTENT: use the SAME choice across all bullet points.

### 5. What NOT to Do
- Do NOT just swap synonyms ("enhanced" → "improved", "significant" → "notable")
- Do NOT change "remarkable 50%" to "notable 50%" - that adds zero value
- Do NOT fabricate metrics, achievements, or responsibilities
- Do NOT change the meaning or core truth of a bullet
- Do NOT add technologies the person clearly never worked with in that context
- Keep the same person's voice and style
- Preserve all existing metrics and numbers exactly

### 6. Bold Important Keywords
- Wrap important technologies, tools, frameworks, programming languages, methodologies, and platforms in **double asterisks** for bold emphasis
- Example: "Developed **REST APIs** using **Spring Boot** and **PostgreSQL**, improving response time by 40%"
- Only bold technical keywords, not generic words like "team" or "project"

For each bullet, return the enhanced text AND a list of specific technologies/keywords you actually incorporated.

Return JSON:
{
  "bullets": [
    {
      "text": "Enhanced bullet text with actual JD technologies woven in",
      "keywordsIncorporated": ["Spring Boot", "Microservices", "AWS"]
    }
  ]
}`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS resume optimizer. Your PRIMARY job is to swap in specific technologies from the job description and add JD-relevant tech where it fits naturally. Do NOT just rephrase or swap synonyms. Every change must incorporate a concrete technology, tool, or specific keyword from the JD. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return bullets.map(b => ({ text: b, keywordsIncorporated: [] }));
      }

      const parsed = JSON.parse(content);
      const resultBullets = parsed.bullets || [];

      return bullets.map((original, i) => {
        if (i < resultBullets.length && resultBullets[i]) {
          return {
            text: resultBullets[i].text || original,
            keywordsIncorporated: resultBullets[i].keywordsIncorporated || [],
          };
        }
        return { text: original, keywordsIncorporated: [] };
      });
    } catch (error) {
      console.error('Error enhancing bullets:', error);
      return bullets.map(b => ({ text: b, keywordsIncorporated: [] }));
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

    // Only enhance top 2-3 most relevant projects
    for (let i = 0; i < Math.min(3, resumeData.projects.length); i++) {
      const project = resumeData.projects[i];
      const originalDesc = project.description || '';

      if (!originalDesc) continue;

      const enhancedDesc = await this.enhanceProjectDescription(
        originalDesc,
        project.name,
        jdAnalysis
      );

      if (enhancedDesc && enhancedDesc !== originalDesc) {
        project.description = enhancedDesc;
        changes.push({
          section: 'projects',
          type: 'enhanced',
          before: originalDesc,
          after: enhancedDesc,
          reason: 'Aligned project description with JD keywords',
        });
      }
    }

    return changes;
  }

  /**
   * Enhance a single project description
   */
  private static async enhanceProjectDescription(
    description: string,
    projectName: string,
    jdAnalysis: JDAnalysisResult
  ): Promise<string> {
    const client = this.getOpenAIClient();

    const prompt = `Enhance this project description to better align with a ${jdAnalysis.jobTitle} role by incorporating SPECIFIC technologies from the JD.

Project: ${projectName}
Current Description: "${description}"

Technologies/Skills from JD: ${[...jdAnalysis.requiredSkills.slice(0, 8), ...(jdAnalysis.tools || []).slice(0, 4)].join(', ')}

Instructions:
1. REPLACE equivalent technologies with JD's versions (Framework → Framework, DB → DB)
2. ADD specific JD technologies where they naturally fit
3. Emphasize results and impact
4. Keep it concise (2-3 sentences max)
5. Do NOT fabricate technologies that don't fit the project context
6. Do NOT just swap synonyms

Return JSON:
{
  "description": "Enhanced description with specific JD technologies"
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
        temperature: 0.6,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return description;
      }

      const parsed = JSON.parse(content);
      return parsed.description || description;
    } catch (error) {
      console.error('Error enhancing project:', error);
      return description;
    }
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
