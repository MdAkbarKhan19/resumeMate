/**
 * Resume Parser Agent (Enhanced)
 * Multi-strategy parsing: pdf-parse -> quality check -> Textract fallback
 * Zod validation, date normalization, text quality assessment
 */

import { BaseAgent } from './base-agent';
import { ResumeJSON } from './types';
import { ResumeJSONSchema, safeValidateResumeJSON } from './schemas';

interface ParserInput {
  text?: string;        // Pre-extracted text from PDF/DOCX
  fileBuffer?: Buffer;  // Raw file buffer for multi-strategy extraction
  fileType?: 'pdf' | 'docx';
  fileName?: string;
}

// Date month names for normalization
const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02',
  mar: '03', march: '03', apr: '04', april: '04',
  may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11',
  dec: '12', december: '12',
};

const CURRENT_MARKERS = /^(present|current|ongoing|now|today|till date|to date|existing)$/i;

export class ResumeParserAgent extends BaseAgent<ParserInput, ResumeJSON> {
  constructor() {
    super('resume-parser', { model: 'gpt-4o', maxRetries: 2 });
  }

  protected async execute(input: ParserInput): Promise<{ data: ResumeJSON; tokensUsed: number }> {
    let text = input.text || '';

    // Multi-strategy text extraction if we have a file buffer
    if (input.fileBuffer && (!text || text.trim().length < 50)) {
      this.emitProgress('Extracting text from document...', 5);
      text = await this.extractText(input.fileBuffer, input.fileType || 'pdf');
    }

    // Normalize the extracted text
    text = this.normalizeText(text);

    if (!text || text.trim().length < 50) {
      throw new Error('Insufficient text extracted from document. The file may be image-based or corrupted.');
    }

    // Assess text quality
    const quality = this.assessTextQuality(text);
    this.emitProgress(`Text extracted (quality: ${quality.score}/10). Parsing with AI...`, 20);

    // Extract contact info via regex as fallback enrichment
    const regexContacts = this.extractContactsRegex(text);

    const { content, tokensUsed } = await this.callLLM({
      systemPrompt: `You are an expert resume parser. Extract ALL information with ZERO data loss. Return valid JSON only.

Key rules:
- Map non-standard section headers to correct categories:
  "Technical Expertise", "Core Competencies", "Technical Proficiencies" -> skills
  "Professional Background", "Work History", "Employment" -> experience
  "Academic Background", "Academic History" -> education
  "Achievements", "Awards", "Honors" -> customSections
  "Publications", "Research", "Papers" -> customSections
  "Professional Development", "Training" -> certifications
- For dates: normalize to "MMM YYYY" format (e.g., "Jan 2020")
- If "Present", "Current", "Ongoing" appears as end date, set current: true, endDate: ""
- Keep bullet points exactly as written - do NOT rephrase or enhance
- Include ALL skills mentioned anywhere in the resume`,

      userPrompt: `Extract all information from this resume text. Preserve every detail.
${quality.score < 5 ? '\nWARNING: Text quality is low. Some content may be garbled. Do your best to extract what you can.\n' : ''}
RESUME TEXT:
${text.substring(0, 8000)}

Return JSON matching this EXACT structure:
{
  "personalInfo": {
    "name": "Full Name",
    "title": "Professional title if present",
    "email": "email",
    "phone": "phone number",
    "location": "city, state/country",
    "linkedin": "linkedin url or profile",
    "github": "github url or username",
    "portfolio": "website/portfolio url"
  },
  "summary": "Professional summary or objective text",
  "experience": [
    {
      "id": "exp-1",
      "jobTitle": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or empty if current",
      "current": false,
      "bullets": ["Achievement/responsibility 1", "Achievement/responsibility 2"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "Degree Type",
      "field": "Field of study / Major",
      "institution": "University/School Name",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "graduationDate": "MMM YYYY",
      "gpa": "GPA if mentioned"
    }
  ],
  "skills": [
    { "id": "sk-1", "name": "Skill Name", "category": "technical|soft|tools|language" }
  ],
  "certifications": [
    { "id": "cert-1", "name": "Certification Name", "issuer": "Issuing Organization", "date": "MMM YYYY", "expiryDate": "", "credentialId": "" }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Project Name",
      "description": "Brief description",
      "techStack": ["Technology 1", "Technology 2"],
      "url": "URL if present",
      "startDate": "",
      "endDate": ""
    }
  ],
  "languages": [
    { "id": "lang-1", "name": "Language", "proficiency": "Native/Fluent/Professional/Intermediate/Basic" }
  ],
  "volunteer": [
    {
      "id": "vol-1",
      "role": "Role",
      "organization": "Organization",
      "location": "location",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY",
      "current": false,
      "description": "Description"
    }
  ],
  "customSections": [
    { "id": "cs-1", "title": "Section Name", "content": "Full section content" }
  ]
}

CRITICAL RULES:
- Extract EVERYTHING - zero data loss
- Keep bullet points exactly as written (do NOT rephrase)
- Generate unique sequential IDs (exp-1, exp-2, edu-1, sk-1, etc.)
- Empty arrays [] for sections not found in the resume
- Map non-standard section names to correct categories
- Normalize dates to "MMM YYYY" format where possible
- If "Present" or "Current" is an end date, set current: true and endDate: ""
- Categorize skills: "technical" for programming/frameworks, "tools" for software/platforms, "soft" for interpersonal, "language" for spoken languages`,

      model: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 4000,
    });

    this.emitProgress('Validating and enriching parsed data...', 75);

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from response if it has extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Enrich with regex-extracted contacts if AI missed them
    if (parsed.personalInfo) {
      if (!parsed.personalInfo.email && regexContacts.email) {
        parsed.personalInfo.email = regexContacts.email;
      }
      if (!parsed.personalInfo.phone && regexContacts.phone) {
        parsed.personalInfo.phone = regexContacts.phone;
      }
      if (!parsed.personalInfo.linkedin && regexContacts.linkedin) {
        parsed.personalInfo.linkedin = regexContacts.linkedin;
      }
      if (!parsed.personalInfo.github && regexContacts.github) {
        parsed.personalInfo.github = regexContacts.github;
      }
    }

    // Build result with defaults and date normalization
    const result: ResumeJSON = {
      personalInfo: {
        name: parsed.personalInfo?.name || '',
        title: parsed.personalInfo?.title || '',
        email: parsed.personalInfo?.email || '',
        phone: parsed.personalInfo?.phone || '',
        location: parsed.personalInfo?.location || '',
        linkedin: parsed.personalInfo?.linkedin || '',
        github: parsed.personalInfo?.github || '',
        portfolio: parsed.personalInfo?.portfolio || '',
      },
      summary: parsed.summary || '',
      experience: this.ensureArray(parsed.experience).map((e: any, i: number) => ({
        id: e.id || `exp-${i + 1}`,
        jobTitle: e.jobTitle || e.title || e.position || '',
        company: e.company || '',
        location: e.location || '',
        startDate: this.normalizeDate(e.startDate),
        endDate: this.isCurrentDate(e.endDate) ? '' : this.normalizeDate(e.endDate),
        current: Boolean(e.current) || this.isCurrentDate(e.endDate),
        bullets: this.ensureArray(e.bullets).filter((b: string) => typeof b === 'string' && b.trim()),
      })),
      education: this.ensureArray(parsed.education).map((e: any, i: number) => ({
        id: e.id || `edu-${i + 1}`,
        degree: e.degree || '',
        field: e.field || e.major || e.fieldOfStudy || '',
        institution: e.institution || e.school || e.university || '',
        location: e.location || '',
        startDate: this.normalizeDate(e.startDate),
        graduationDate: this.normalizeDate(e.graduationDate || e.endDate || e.graduation),
        gpa: e.gpa || '',
      })),
      skills: this.ensureArray(parsed.skills).map((s: any, i: number) => ({
        id: s.id || `sk-${i + 1}`,
        name: typeof s === 'string' ? s : (s.name || s.skill || ''),
        category: this.normalizeCategory(s.category),
      })),
      certifications: this.ensureArray(parsed.certifications).map((c: any, i: number) => ({
        id: c.id || `cert-${i + 1}`,
        name: c.name || c.title || '',
        issuer: c.issuer || c.organization || c.issuingOrganization || '',
        date: this.normalizeDate(c.date || c.issueDate),
        expiryDate: this.normalizeDate(c.expiryDate || c.expirationDate),
        credentialId: c.credentialId || c.credential || '',
      })),
      projects: this.ensureArray(parsed.projects).map((p: any, i: number) => ({
        id: p.id || `proj-${i + 1}`,
        name: p.name || p.title || '',
        description: p.description || '',
        techStack: this.ensureArray(p.techStack || p.technologies || p.tech),
        url: p.url || p.link || '',
        startDate: this.normalizeDate(p.startDate),
        endDate: this.normalizeDate(p.endDate),
      })),
      languages: this.ensureArray(parsed.languages).map((l: any, i: number) => ({
        id: l.id || `lang-${i + 1}`,
        name: l.name || l.language || '',
        proficiency: l.proficiency || l.level || l.fluency || '',
      })),
      volunteer: this.ensureArray(parsed.volunteer || parsed.volunteering).map((v: any, i: number) => ({
        id: v.id || `vol-${i + 1}`,
        role: v.role || v.title || v.position || '',
        organization: v.organization || v.company || '',
        location: v.location || '',
        startDate: this.normalizeDate(v.startDate),
        endDate: this.isCurrentDate(v.endDate) ? '' : this.normalizeDate(v.endDate),
        current: Boolean(v.current) || this.isCurrentDate(v.endDate),
        description: v.description || '',
      })),
      customSections: this.ensureArray(parsed.customSections).map((s: any, i: number) => ({
        id: s.id || `cs-${i + 1}`,
        title: s.title || '',
        content: s.content || '',
      })),
    };

    // Zod validation
    this.emitProgress('Running schema validation...', 90);
    const validation = safeValidateResumeJSON(result);
    if (!validation.success) {
      console.warn('[ResumeParserAgent] Zod validation warnings:', validation.error);
      // Don't throw - the result still has all the data, just some fields may not match strict schema
    }

    return { data: result, tokensUsed };
  }

  /**
   * Multi-strategy text extraction from file buffer
   */
  private async extractText(fileBuffer: Buffer, fileType: string): Promise<string> {
    if (fileType === 'docx') {
      return this.extractFromDOCX(fileBuffer);
    }
    return this.extractFromPDF(fileBuffer);
  }

  /**
   * PDF extraction: pdf-parse first, then Textract fallback
   */
  private async extractFromPDF(fileBuffer: Buffer): Promise<string> {
    // Strategy 1: pdf-parse (fast, works for digital PDFs)
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(fileBuffer);
      const text = pdfData.text || '';

      if (this.assessTextQuality(text).score >= 4) {
        this.emitProgress('PDF text extracted via pdf-parse', 10);
        return text;
      }
      // Text quality is low, try Textract
      this.emitProgress('Low quality text from pdf-parse, trying Textract...', 10);
    } catch (err) {
      this.emitProgress('pdf-parse failed, trying Textract...', 8);
    }

    // Strategy 2: AWS Textract (handles scanned PDFs / image-based)
    try {
      const { TextractService } = await import('../aws/textract');
      const textractResult = await TextractService.extractText(fileBuffer);
      if (textractResult.text && textractResult.text.trim().length > 50) {
        this.emitProgress(`Text extracted via Textract (confidence: ${textractResult.confidence}%)`, 15);
        return textractResult.text;
      }
    } catch (err) {
      this.emitProgress('Textract unavailable, using best available text', 12);
    }

    // If we got some text from pdf-parse (even low quality), use it
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text || '';
    } catch {
      throw new Error('Failed to extract text from PDF using all available strategies');
    }
  }

  /**
   * DOCX extraction using mammoth
   */
  private async extractFromDOCX(fileBuffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      this.emitProgress('DOCX text extracted', 10);
      return result.value || '';
    } catch {
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  /**
   * Assess extracted text quality (0-10 scale)
   */
  private assessTextQuality(text: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 10;

    if (!text || text.trim().length === 0) return { score: 0, issues: ['No text'] };

    // Check alphanumeric ratio (garbled text has low ratio)
    const alphaNumeric = text.replace(/[^a-zA-Z0-9]/g, '').length;
    const ratio = alphaNumeric / text.length;
    if (ratio < 0.3) { score -= 4; issues.push('Low alphanumeric ratio (possibly garbled)'); }
    else if (ratio < 0.5) { score -= 2; issues.push('Moderate text quality'); }

    // Check word count
    const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
    if (wordCount < 20) { score -= 3; issues.push('Very few words extracted'); }
    else if (wordCount < 50) { score -= 1; issues.push('Low word count'); }

    // Check for common resume keywords
    const resumeKeywords = /\b(experience|education|skills|work|university|degree|email|phone|manager|engineer|developer|analyst|summary|objective|certifications?|projects?)\b/i;
    const keywordMatches = text.match(new RegExp(resumeKeywords.source, 'gi')) || [];
    if (keywordMatches.length === 0) { score -= 3; issues.push('No resume keywords found'); }
    else if (keywordMatches.length < 3) { score -= 1; issues.push('Few resume keywords'); }

    // Check for excessive special characters (OCR artifacts)
    const specialChars = text.replace(/[a-zA-Z0-9\s.,;:!?@#$%&*()\-_+=\[\]{}'"\/\\|<>~`]/g, '').length;
    const specialRatio = specialChars / text.length;
    if (specialRatio > 0.15) { score -= 2; issues.push('High special character ratio (OCR artifacts)'); }

    return { score: Math.max(0, Math.min(10, score)), issues };
  }

  /**
   * Normalize extracted text - fix common PDF extraction artifacts
   */
  private normalizeText(text: string): string {
    if (!text) return '';

    return text
      // Fix common PDF ligatures
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi')
      .replace(/ﬄ/g, 'ffl')
      // Fix bullet point artifacts
      .replace(/[•●■□▪▫◦◆◇►▸‣⁃⦿⦾]/g, '• ')
      .replace(/[\u2022\u2023\u2043\u204C\u204D]/g, '• ')
      // Fix dash variations
      .replace(/[\u2013\u2014\u2015]/g, '-')
      // Fix quote variations
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      // Fix spaces issues
      .replace(/\u00A0/g, ' ')       // Non-breaking space
      .replace(/\u200B/g, '')         // Zero-width space
      .replace(/\u200C/g, '')         // Zero-width non-joiner
      .replace(/\u200D/g, '')         // Zero-width joiner
      .replace(/\uFEFF/g, '')         // BOM
      // Remove control characters (except newline, tab)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Collapse multiple spaces (but preserve newlines)
      .replace(/[^\S\n]+/g, ' ')
      // Collapse 3+ newlines to 2
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Normalize date strings to consistent "MMM YYYY" format
   */
  private normalizeDate(dateStr: string | undefined | null): string {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const d = dateStr.trim();
    if (!d) return '';

    // Check if it's a "current" marker
    if (this.isCurrentDate(d)) return '';

    // Already in "MMM YYYY" or "Month YYYY" format - just standardize month
    const monthYearMatch = d.match(/^(\w+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const month = monthYearMatch[1].toLowerCase();
      const year = monthYearMatch[2];
      const monthNum = MONTH_MAP[month];
      if (monthNum) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
      }
      return d; // Return as-is if we can't parse the month
    }

    // Handle "MM/YYYY" or "MM-YYYY"
    const slashMatch = d.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      const monthIdx = parseInt(slashMatch[1]) - 1;
      const year = slashMatch[2];
      if (monthIdx >= 0 && monthIdx < 12) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[monthIdx]} ${year}`;
      }
    }

    // Handle "YYYY-MM" (ISO-like)
    const isoMatch = d.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const year = isoMatch[1];
      const monthIdx = parseInt(isoMatch[2]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[monthIdx]} ${year}`;
      }
    }

    // Handle "YYYY-MM-DD"
    const fullIsoMatch = d.match(/^(\d{4})[\/\-](\d{1,2})[\/\-]\d{1,2}$/);
    if (fullIsoMatch) {
      const year = fullIsoMatch[1];
      const monthIdx = parseInt(fullIsoMatch[2]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[monthIdx]} ${year}`;
      }
    }

    // Handle just a year "2020"
    if (/^\d{4}$/.test(d)) {
      return d;
    }

    // Return as-is if no pattern matches
    return d;
  }

  /**
   * Check if a date string represents "current/present"
   */
  private isCurrentDate(dateStr: string | undefined | null): boolean {
    if (!dateStr || typeof dateStr !== 'string') return false;
    return CURRENT_MARKERS.test(dateStr.trim());
  }

  /**
   * Normalize skill category names
   */
  private normalizeCategory(category: string | undefined): string {
    if (!category) return 'technical';
    const cat = category.toLowerCase().trim();

    if (['technical', 'programming', 'frameworks', 'languages & frameworks', 'tech'].includes(cat)) return 'technical';
    if (['tools', 'platforms', 'tools & platforms', 'software', 'technologies'].includes(cat)) return 'tools';
    if (['soft', 'soft skills', 'interpersonal', 'leadership', 'communication'].includes(cat)) return 'soft';
    if (['language', 'languages', 'spoken languages'].includes(cat)) return 'language';

    return cat;
  }

  /**
   * Extract contact info via regex as fallback
   */
  private extractContactsRegex(text: string): {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  } {
    const contacts: any = {};

    // Email
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    if (emailMatch) contacts.email = emailMatch[0];

    // Phone (various formats)
    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (phoneMatch) contacts.phone = phoneMatch[0].trim();

    // LinkedIn
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[\w-]+|linkedin\.com\/pub\/[\w-]+)/i);
    if (linkedinMatch) contacts.linkedin = linkedinMatch[0];

    // GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) contacts.github = githubMatch[0];

    return contacts;
  }

  private ensureArray(val: unknown): any[] {
    return Array.isArray(val) ? val : [];
  }
}
