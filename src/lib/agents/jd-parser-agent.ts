/**
 * JD Parser Agent
 * Extracts structured information from job descriptions using AI
 * Cached by JD text hash to avoid redundant API calls
 */

import { BaseAgent } from './base-agent';
import { JDAnalysis } from './types';
import { ATSCheckerService } from '../ai/ats-checker';

// Simple in-memory cache (keyed by hash of JD text)
const jdCache = new Map<string, { result: JDAnalysis; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export class JDParserAgent extends BaseAgent<string, JDAnalysis> {
  constructor() {
    super('jd-parser', { model: 'gpt-4o-mini', maxRetries: 2 });
  }

  protected async execute(jdText: string): Promise<{ data: JDAnalysis; tokensUsed: number }> {
    // Check cache
    const cacheKey = hashText(jdText);
    const cached = jdCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      this.emitProgress('Using cached JD analysis');
      return { data: cached.result, tokensUsed: 0 };
    }

    this.emitProgress('Analyzing job description...', 10);

    const { content, tokensUsed } = await this.callLLM({
      systemPrompt: 'You are an expert recruiter and ATS specialist. Extract structured information from job descriptions. NEVER include the job title itself in skills arrays. Always return valid JSON.',
      userPrompt: `Extract all structured information from this job description:

"""
${jdText}
"""

CRITICAL RULES:
- The job TITLE (e.g., "Java Developer") must NEVER appear in requiredSkills, preferredSkills, keywords, or tools
- requiredSkills should contain ONLY specific technologies (e.g., "Java", "Spring Boot", "Docker"), NOT job roles
- tools should contain specific software platforms (e.g., "JIRA", "Git", "Docker", "Jenkins")
- Be thorough - extract EVERY specific technology, framework, library, database, cloud service, and methodology

Return JSON with this exact structure:
{
  "jobTitle": "extracted title",
  "companyName": "company if mentioned",
  "location": "location if mentioned",
  "industry": "industry if identifiable",
  "experienceYears": "e.g. 5+ years",
  "requiredSkills": ["Java", "Spring Boot", "PostgreSQL", "Microservices"],
  "preferredSkills": ["Kafka", "Redis"],
  "keywords": ["CI/CD", "Agile", "design patterns", "distributed systems"],
  "actionVerbs": ["develop", "architect", "lead"],
  "tools": ["Docker", "Kubernetes", "Jenkins", "Git", "JIRA"],
  "certifications": ["required certs"],
  "education": ["Bachelor's in CS"],
  "mustHave": ["Java", "Spring Boot"],
  "niceToHave": ["Kafka experience"],
  "responsibilities": ["key duties"],
  "qualifications": ["listed requirements"]
}`,
      temperature: 0.2,
      maxTokens: 2000,
    });

    this.emitProgress('Parsing AI response...', 70);
    const parsed = JSON.parse(content) as JDAnalysis;

    // Merge with traditional keyword extraction for better coverage
    this.emitProgress('Merging with keyword extraction...', 85);
    try {
      const traditionalKeywords = ATSCheckerService.extractKeywords(jdText);
      parsed.requiredSkills = [...new Set([...parsed.requiredSkills, ...traditionalKeywords.skills])];
      parsed.tools = [...new Set([...parsed.tools, ...traditionalKeywords.tools])];
      parsed.keywords = [...new Set([...parsed.keywords, ...traditionalKeywords.all])];
    } catch {
      // Traditional extraction is optional - continue if it fails
    }

    // Post-process: filter out job title from all skill arrays
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

    // Cache result
    jdCache.set(cacheKey, { result: parsed, timestamp: Date.now() });

    return { data: parsed, tokensUsed };
  }
}
