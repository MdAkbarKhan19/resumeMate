import OpenAI from 'openai';
import { openaiConfig } from '@/config';
import { AIBulletEnhancement, GrammarCorrection, RedundancyCheck } from '@/types';

const openai = new OpenAI({
  apiKey: openaiConfig.apiKey,
});

export class OpenAIService {
  /**
   * Enhance a resume bullet point with AI
   */
  static async enhanceBullet(originalBullet: string, context?: string): Promise<AIBulletEnhancement> {
    try {
      const prompt = `You are a professional resume writer. Enhance the following resume bullet point to make it more impactful:

Original: "${originalBullet}"
${context ? `Context: ${context}` : ''}

Requirements:
1. Start with a strong action verb
2. Include specific metrics or quantifiable results where possible (use realistic examples if none provided)
3. Keep it concise (1-2 lines max)
4. Use professional language
5. Avoid first-person pronouns (I, me, my)
6. Focus on achievements, not just responsibilities
7. Wrap important keywords (technologies, tools, frameworks, programming languages, methodologies, platforms) in **double asterisks** for bold emphasis. Example: "Developed **REST APIs** using **Spring Boot** and **PostgreSQL**, improving response time by 40%"

Provide:
1. The enhanced bullet point
2. A brief list of what was improved

Format your response as JSON:
{
  "enhanced": "the enhanced bullet point",
  "improvements": ["improvement 1", "improvement 2", ...]
}`;

      const response = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = tokensUsed * 0.000002; // Approximate cost per token for GPT-3.5-turbo

      return {
        original: originalBullet,
        enhanced: parsed.enhanced || originalBullet,
        improvements: parsed.improvements || [],
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('OpenAI enhance bullet error:', error);
      throw new Error('Failed to enhance bullet point');
    }
  }

  /**
   * Check grammar and provide corrections
   */
  static async checkGrammar(text: string): Promise<{
    corrections: GrammarCorrection[];
    corrected: string;
    tokensUsed?: number;
    cost?: number;
  }> {
    try {
      const prompt = `You are a professional editor. Review the following text for grammar, spelling, and style issues:

"${text}"

Identify all errors and provide corrections. For each issue, provide:
1. The original text (exact phrase with error)
2. The corrected text
3. The type of error (grammar, spelling, style, or clarity)
4. A brief explanation
5. The position in the text (start and end character index)

Format your response as JSON array:
[
  {
    "original": "text with error",
    "corrected": "corrected text",
    "type": "grammar|spelling|style|clarity",
    "message": "explanation",
    "position": {"start": 0, "end": 10}
  }
]

If no errors, return an empty array.`;

      const response = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Lower temperature for more factual corrections
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const corrections = JSON.parse(content);

      const correctionsList: GrammarCorrection[] = corrections.map((c: any) => ({
        original: c.original,
        corrected: c.corrected,
        type: c.type,
        message: c.message,
        position: c.position,
      }));

      // Apply corrections to get corrected text
      let correctedText = text;
      corrections.sort((a: any, b: any) => b.position.start - a.position.start); // Sort in reverse order
      for (const correction of corrections) {
        const { start, end } = correction.position;
        correctedText = correctedText.slice(0, start) + correction.corrected + correctedText.slice(end);
      }

      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = tokensUsed * 0.000002;

      return {
        corrections: correctionsList,
        corrected: correctedText,
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('OpenAI grammar check error:', error);
      return { corrections: [], corrected: text, tokensUsed: 0, cost: 0 }; // Return empty on error
    }
  }

  /**
   * Detect redundant content in bullets
   */
  static async detectRedundancy(bullets: string[]): Promise<RedundancyCheck> {
    try {
      const prompt = `You are analyzing resume bullet points for redundancy. Compare these bullets:

${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Identify pairs of bullets that are too similar or redundant. For each redundant pair, provide:
1. The indices of the two bullets (0-based)
2. The text of both bullets
3. A similarity score (0-1)
4. A suggestion for how to differentiate them or combine them

Format your response as JSON:
{
  "redundantPairs": [
    {
      "index1": 0,
      "index2": 1,
      "text1": "first bullet",
      "text2": "second bullet",
      "similarity": 0.85
    }
  ],
  "suggestions": [
    "Suggestion for how to fix the redundancy..."
  ]
}`;

      const response = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '{"redundantPairs": [], "suggestions": []}';
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI redundancy check error:', error);
      return { redundantPairs: [], suggestions: [] };
    }
  }

  /**
   * Generate a professional summary
   */
  static async generateSummary(params: {
    yearsOfExperience: string;
    skills: string[];
    targetRole?: string;
  }): Promise<{ summary: string; tokensUsed?: number; cost?: number }> {
    try {
      const { yearsOfExperience, skills, targetRole } = params;
      
      const prompt = `Generate a professional resume summary (2-3 sentences) based on:

Years of experience: ${yearsOfExperience}
Key skills: ${skills.join(', ')}
${targetRole ? `Target role: ${targetRole}` : ''}

Requirements:
1. Concise and impactful (2-3 sentences max)
2. Highlight key strengths and experience
3. No first-person pronouns
4. Professional tone
5. Focus on value proposition

Return only the summary text, no additional formatting.`;

      const response = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = tokensUsed * 0.000002; // Approximate cost per token for GPT-3.5-turbo

      return {
        summary: response.choices[0]?.message?.content?.trim() || '',
        tokensUsed,
        cost,
      };
    } catch (error) {
      console.error('OpenAI generate summary error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Score resume against job description
   */
  static async scoreResumeMatch(
    resumeText: string,
    jdText: string
  ): Promise<{
    score: number;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `You are an ATS (Applicant Tracking System) expert. Compare this resume with a job description and provide a match score.

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Provide:
1. A match score (0-100) indicating how well the resume matches the job requirements
2. Key strengths (what matches well)
3. Gaps (what's missing)
4. Specific recommendations for improvement

Format as JSON:
{
  "score": 75,
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

      const response = await openai.chat.completions.create({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI score match error:', error);
      throw new Error('Failed to score resume match');
    }
  }

  /**
   * Extract structured data from resume text with ZERO data loss
   * Uses GPT-4o for maximum accuracy and comprehensive extraction
   */
  static async parseResumeText(text: string): Promise<any> {
    try {
      const prompt = `You are an expert resume parser. Extract ALL information from this resume with ZERO data loss.

RESUME TEXT:
${text}

INSTRUCTIONS:
1. Identify ALL sections (standard and custom)
2. Extract complete data for each section
3. Preserve ALL bullet points exactly as written
4. Maintain date formats and locations
5. If a section doesn't fit standard categories, create a custom section
6. Extract ALL contact information (email, phone, LinkedIn, GitHub, portfolio, etc.)
7. Preserve all formatting context (bold items might be section headers)

REQUIRED OUTPUT FORMAT (valid JSON only):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "Phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "portfolio": "Portfolio/Website URL",
    "title": "Professional title if present at top of resume"
  },
  "summary": "Professional summary or objective - full text",
  "experience": [
    {
      "title": "Job Title/Position",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Start Date (any format)",
      "endDate": "End Date or Present",
      "bullets": ["Bullet point 1", "Bullet point 2", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree Type",
      "field": "Field of Study",
      "institution": "School Name",
      "location": "City, State",
      "startDate": "Start Date",
      "graduationDate": "Graduation Date",
      "gpa": "GPA if present",
      "honors": "Honors/Awards if present"
    }
  ],
  "skills": [
    {
      "category": "Skill Category (e.g., Programming Languages, Frameworks, etc.)",
      "items": ["Skill 1", "Skill 2", "..."]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project Description",
      "technologies": ["Tech 1", "Tech 2"],
      "url": "Project URL if present",
      "startDate": "Start Date if present",
      "endDate": "End Date if present"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Issue Date",
      "expiryDate": "Expiry Date if present",
      "credentialId": "Credential ID if present",
      "url": "Verification URL if present"
    }
  ],
  "languages": [
    {
      "name": "Language Name",
      "proficiency": "Proficiency Level (Native, Fluent, Intermediate, Basic)"
    }
  ],
  "volunteer": [
    {
      "role": "Role/Position",
      "organization": "Organization Name",
      "location": "Location",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "description": "Description of volunteer work"
    }
  ],
  "awards": [
    {
      "title": "Award Title",
      "issuer": "Issuing Organization",
      "date": "Date Received",
      "description": "Description if present"
    }
  ],
  "publications": [
    {
      "title": "Publication Title",
      "publisher": "Publisher/Conference",
      "date": "Publication Date",
      "url": "URL if present",
      "description": "Description/Abstract if present"
    }
  ],
  "customSections": [
    {
      "title": "Section Name from Resume",
      "content": "Full content of the section (preserve formatting cues)"
    }
  ],
  "metadata": {
    "detectedSections": ["List of all section names found in resume"],
    "layoutType": "single-column or two-column",
    "hasPhoto": false,
    "totalPages": 1
  }
}

CRITICAL REQUIREMENTS:
- Extract EVERYTHING - no information should be lost
- Keep bullet points exactly as written
- If unsure about categorization, use customSections
- For dates, preserve original format but note if it says "Present", "Current", etc.
- Empty arrays for sections not found, never null
- If a section has unusual name (e.g., "Technical Expertise" instead of "Skills"), still map it correctly
- Return ONLY valid JSON, no additional text`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o for maximum accuracy
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser that extracts 100% of information with zero data loss. You always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistency
        max_tokens: 8000, // Increased for comprehensive extraction of complex resumes
        response_format: { type: "json_object" } // Ensures JSON output
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      
      // Ensure all required fields exist with defaults
      return {
        personalInfo: parsed.personalInfo || {},
        summary: parsed.summary || '',
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages : [],
        volunteer: Array.isArray(parsed.volunteer) ? parsed.volunteer : [],
        awards: Array.isArray(parsed.awards) ? parsed.awards : [],
        publications: Array.isArray(parsed.publications) ? parsed.publications : [],
        customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
        metadata: parsed.metadata || {
          detectedSections: [],
          layoutType: 'single-column',
          hasPhoto: false,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('OpenAI parse resume error:', error);
      throw new Error('Failed to parse resume');
    }
  }
}

export default OpenAIService;
