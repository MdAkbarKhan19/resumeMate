import { getLLM } from './llm-client';

/**
 * AI Enhancement Service
 * Provides per-field resume content improvement (manual, single-item helpers).
 * Runs on the cheap tier — these are small, interactive, one-field edits.
 */
export class AIEnhancementService {
  /** Resolve the cheap-tier client + model at call time. */
  private static llm() {
    return getLLM('cheap');
  }

  /**
   * Improve a resume bullet point to be more impactful
   * Focuses on action verbs, quantifiable results, and achievement-oriented language
   */
  static async improveBullet(
    bulletText: string,
    context?: {
      jobTitle?: string;
      company?: string;
      industry?: string;
    }
  ): Promise<{
    original: string;
    improved: string;
    suggestions: string[];
  }> {
    try {
      const { client, model } = AIEnhancementService.llm();

      const contextInfo = context
        ? `Job Title: ${context.jobTitle || 'N/A'}, Company: ${context.company || 'N/A'}, Industry: ${context.industry || 'N/A'}`
        : 'No additional context provided';

      const prompt = `You are a professional resume writer. Improve this resume bullet point to be more impactful and achievement-oriented.

Context: ${contextInfo}

Original bullet point:
"${bulletText}"

Requirements:
1. Start with a strong action verb
2. Include quantifiable results or metrics when possible (if the original has numbers, enhance them; if not, suggest adding metrics)
3. Be concise and specific
4. Focus on achievements and impact, not just responsibilities
5. Use professional language appropriate for a resume
6. Keep it to one or two sentences maximum
7. Wrap important keywords (technologies, tools, frameworks, programming languages, methodologies, platforms) in **double asterisks** for bold emphasis. Example: "Developed **REST APIs** using **Spring Boot** and **PostgreSQL**, improving response time by 40%"

Provide:
1. An improved version of the bullet point
2. 2-3 alternative suggestions

Format your response as JSON:
{
  "improved": "The main improved version",
  "alternatives": ["Alternative 1", "Alternative 2", "Alternative 3"]
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer who specializes in creating impactful, achievement-oriented bullet points. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        original: bulletText,
        improved: parsed.improved || bulletText,
        suggestions: parsed.alternatives || [],
      };
    } catch (error) {
      console.error('AI bullet improvement error:', error);
      throw new Error(`Failed to improve bullet point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check grammar and spelling in text
   * Returns corrections and suggestions
   */
  static async checkGrammar(
    text: string
  ): Promise<{
    hasErrors: boolean;
    corrections: Array<{
      original: string;
      correction: string;
      type: 'grammar' | 'spelling' | 'style';
      explanation: string;
    }>;
    improvedText: string;
  }> {
    try {
      const { client, model } = AIEnhancementService.llm();

      const prompt = `Review this resume text for grammar, spelling, and style issues. Provide corrections and an improved version.

Text:
"${text}"

Identify any:
1. Grammar errors
2. Spelling mistakes
3. Style improvements (passive voice, wordiness, unclear phrasing)

Format your response as JSON:
{
  "hasErrors": true/false,
  "corrections": [
    {
      "original": "text with error",
      "correction": "corrected text",
      "type": "grammar|spelling|style",
      "explanation": "brief explanation"
    }
  ],
  "improvedText": "The fully corrected text"
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional editor specializing in resume content. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        hasErrors: parsed.hasErrors || false,
        corrections: parsed.corrections || [],
        improvedText: parsed.improvedText || text,
      };
    } catch (error) {
      console.error('Grammar check error:', error);
      throw new Error(`Failed to check grammar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate or improve a professional summary
   */
  static async generateSummary(
    resumeData: {
      jobTitle?: string;
      yearsExperience?: number;
      skills?: string[];
      achievements?: string[];
      targetRole?: string;
      currentSummary?: string;
    }
  ): Promise<{
    summary: string;
    alternatives: string[];
  }> {
    try {
      const { client, model } = AIEnhancementService.llm();

      const mode = resumeData.currentSummary ? 'improve' : 'generate';

      const prompt = mode === 'improve'
        ? `Improve this professional resume summary to be more impactful:

Current Summary:
"${resumeData.currentSummary}"

Additional Context:
- Job Title: ${resumeData.jobTitle || 'N/A'}
- Years of Experience: ${resumeData.yearsExperience || 'N/A'}
- Key Skills: ${resumeData.skills?.join(', ') || 'N/A'}
- Target Role: ${resumeData.targetRole || 'N/A'}

Requirements:
1. 2-4 sentences maximum
2. Highlight key achievements and unique value proposition
3. Include relevant skills naturally
4. Be specific and quantifiable where possible
5. Professional tone appropriate for the target role

Provide one main improved version and 2 alternative styles.

Format as JSON:
{
  "main": "The main improved summary",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`
        : `Generate a professional resume summary based on this information:

- Job Title: ${resumeData.jobTitle || 'Professional'}
- Years of Experience: ${resumeData.yearsExperience || 'Several years'}
- Key Skills: ${resumeData.skills?.join(', ') || 'Various skills'}
- Notable Achievements: ${resumeData.achievements?.join('; ') || 'Multiple achievements'}
- Target Role: ${resumeData.targetRole || 'Similar role'}

Requirements:
1. 2-4 sentences maximum
2. Highlight key achievements and unique value proposition
3. Include relevant skills naturally
4. Be specific and quantifiable where possible
5. Professional tone appropriate for the target role

Provide one main summary and 2 alternative styles.

Format as JSON:
{
  "main": "The main summary",
  "alternatives": ["Alternative 1", "Alternative 2"]
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer specializing in compelling professional summaries. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        summary: parsed.main || '',
        alternatives: parsed.alternatives || [],
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate skill suggestions based on job description
   */
  static async suggestSkills(
    currentSkills: string[],
    jobDescription: string
  ): Promise<{
    recommended: Array<{ skill: string; reason: string; priority: 'high' | 'medium' | 'low' }>;
    missing: string[];
  }> {
    try {
      const { client, model } = AIEnhancementService.llm();

      const prompt = `Analyze this job description and suggest skills for the resume.

Current Skills on Resume:
${currentSkills.join(', ')}

Job Description:
"${jobDescription}"

Identify:
1. Important skills mentioned in the job description that are missing from the resume
2. Skills that should be prioritized (high/medium/low based on job requirements)
3. Specific technologies, tools, or competencies mentioned

Format as JSON:
{
  "recommended": [
    {
      "skill": "Skill name",
      "reason": "Why this skill is important for this role",
      "priority": "high|medium|low"
    }
  ],
  "missing": ["List of critical skills from job description not in current resume"]
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a career counselor and ATS expert. Analyze job descriptions and provide strategic skill recommendations. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        recommended: parsed.recommended || [],
        missing: parsed.missing || [],
      };
    } catch (error) {
      console.error('Skill suggestion error:', error);
      throw new Error(`Failed to suggest skills: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Tailor resume content to a specific job description
   */
  static async tailorContent(
    originalContent: string,
    jobDescription: string,
    contentType: 'bullet' | 'summary' | 'experience'
  ): Promise<{
    tailored: string;
    changes: string[];
    matchScore: number;
  }> {
    try {
      const { client, model } = AIEnhancementService.llm();

      const prompt = `Tailor this resume ${contentType} to better match the job description.

Original ${contentType}:
"${originalContent}"

Job Description:
"${jobDescription}"

Requirements:
1. Maintain truthfulness - don't add false information
2. Emphasize relevant experience and skills from the original content
3. Use keywords from the job description naturally
4. Keep the same general structure and length
5. Make it more relevant to the target role

Provide:
1. Tailored version
2. List of key changes made
3. Match score (0-100) indicating how well it now aligns with the job description

Format as JSON:
{
  "tailored": "The tailored content",
  "changes": ["Change 1", "Change 2", ...],
  "matchScore": 85
}`;

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer who specializes in tailoring resumes to specific job descriptions while maintaining accuracy. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        tailored: parsed.tailored || originalContent,
        changes: parsed.changes || [],
        matchScore: parsed.matchScore || 0,
      };
    } catch (error) {
      console.error('Content tailoring error:', error);
      throw new Error(`Failed to tailor content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
