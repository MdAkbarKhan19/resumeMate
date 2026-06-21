import { TextractService } from '@/lib/aws/textract';
import { OpenAIService } from '@/lib/ai/openai';
import { ComprehendService } from '@/lib/aws/comprehend';
import { ParsedResumeData, PersonalInfo, WorkExperience, Education } from '@/types';
import { heuristicParseResume } from '@/lib/resume/heuristic-parser';
import { redactForParsing, restoreRedactions } from '@/lib/ai/pii';
import mammoth from 'mammoth';

// Extended interface for comprehensive parsing
export interface EnhancedParsedResumeData extends ParsedResumeData {
  projects?: any[];
  languages?: any[];
  volunteer?: any[];
  awards?: any[];
  publications?: any[];
  customSections?: any[];
  metadata?: {
    detectedSections: string[];
    layoutType: string;
    hasPhoto: boolean;
    totalPages: number;
  };
}

export class ResumeParserService {
  /**
   * Parse resume from PDF file
   */
  static async parsePDF(fileBuffer: Buffer): Promise<ParsedResumeData> {
    try {
      let text = '';
      let confidence = 1.0;

      try {
        // Import from lib path directly to avoid pdf-parse's test file loading issue in Next.js
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } catch (pdfError) {
        console.warn('pdf-parse failed:', pdfError);
        // If pdf-parse fails, try Textract for scanned PDFs
        try {
          const textractResult = await TextractService.extractText(fileBuffer);
          text = textractResult.text;
          confidence = textractResult.confidence / 100;
        } catch (textractError) {
          console.warn('Textract also failed:', textractError);
          throw new Error('Could not extract text from PDF. The file may be corrupted or password-protected.');
        }
      }

      if (!text || text.trim().length < 10) {
        throw new Error('No readable text found in PDF. The file may be a scanned image without OCR.');
      }

      return await this.parseText(text, confidence);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw error instanceof Error ? error : new Error('Failed to parse PDF resume');
    }
  }

  /**
   * Parse resume from DOCX file
   */
  static async parseDOCX(fileBuffer: Buffer): Promise<ParsedResumeData> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value;

      // Check for warnings
      const warnings = result.messages
        .filter((m) => m.type === 'warning')
        .map((m) => m.message);

      return await this.parseText(text, 1.0, warnings);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX resume');
    }
  }

  /**
   * Parse resume text into structured data with ALL sections
   */
  static async parseText(
    text: string,
    baseConfidence: number = 1.0,
    initialWarnings: string[] = []
  ): Promise<EnhancedParsedResumeData> {
    try {
      const warnings: string[] = [...initialWarnings];

      // PII protection: extract contact details LOCALLY (no model), then redact
      // them from the text before the AI structural parse. The model receives
      // only the redacted body — it never sees the candidate's name, email,
      // phone, or personal profile URLs. We restore identity fields afterwards
      // from the local extraction.
      const heuristic = heuristicParseResume(text);
      const localPII = heuristic.personalInfo;

      // Use AI to extract structured data with all sections. If the AI step is
      // unavailable (bad/expired key, quota, network), fall back to a pure
      // heuristic parser so the upload still succeeds with an editable resume
      // instead of hard-failing with a 500.
      let aiParsed: any;
      try {
        const redacted = redactForParsing(text, {
          name: localPII.name,
          personalUrls: [localPII.linkedin, localPII.github, localPII.portfolio].filter(Boolean),
        });
        aiParsed = await OpenAIService.parseResumeText(redacted);
        // Clean up placeholders that leaked into the parsed body. We ONLY restore
        // the candidate's own NAME — email/phone are intentionally cleared (not
        // substituted), because redaction replaced EVERY email/phone (including a
        // reference's or prior manager's) with the same token, so stamping the
        // candidate's contact info back would corrupt third-party details. The
        // candidate's own email/phone are filled into personalInfo from the local
        // extraction below instead.
        aiParsed = restoreRedactions(aiParsed, { name: localPII.name });
      } catch (aiError) {
        console.warn('AI resume parse unavailable, using heuristic fallback:', aiError);
        aiParsed = heuristic;
        warnings.push(
          'AI parsing was unavailable — imported with basic extraction. Please review and organise each section.',
        );
      }

      // Use AWS Comprehend to extract entities for verification (optional)
      let entities: any[] = [];
      try {
        entities = await ComprehendService.detectEntities(text);
      } catch (e) {
        console.warn('Comprehend not available, skipping entity detection');
      }

      // Extract and normalize all sections
      const personalInfo = this.extractPersonalInfo(text, aiParsed, entities);

      // Identity fields are sourced from the LOCAL extraction (the model never
      // received them), filling any gap the regex pass missed.
      personalInfo.fullName = personalInfo.fullName || localPII.name;
      personalInfo.email = personalInfo.email || localPII.email;
      personalInfo.phone = personalInfo.phone || localPII.phone;
      personalInfo.location = personalInfo.location || localPII.location;
      personalInfo.linkedin = personalInfo.linkedin || localPII.linkedin;
      personalInfo.github = personalInfo.github || localPII.github;
      personalInfo.website = personalInfo.website || localPII.portfolio;
      const experience = this.extractExperience(aiParsed);
      const education = this.extractEducation(aiParsed);
      const skills = this.extractSkills(aiParsed);
      const projects = this.extractProjects(aiParsed);
      const certifications = this.extractCertifications(aiParsed);
      const languages = this.extractLanguages(aiParsed);
      const volunteer = this.extractVolunteer(aiParsed);
      const awards = this.extractAwards(aiParsed);
      const publications = this.extractPublications(aiParsed);
      const customSections = aiParsed.customSections || [];

      // Calculate overall confidence with enhanced metrics
      const confidence = this.calculateConfidence(
        personalInfo,
        experience,
        education,
        skills,
        baseConfidence
      );

      // Add warnings for missing critical information
      if (!personalInfo.fullName) {
        warnings.push('Could not extract full name - please verify');
      }
      if (!personalInfo.email) {
        warnings.push('Could not extract email address - please add manually');
      }
      if (experience.length === 0) {
        warnings.push('No work experience found - check if section was detected');
      }
      if (confidence < 0.7) {
        warnings.push('Low parsing confidence - please review all fields carefully');
      }

      return {
        personalInfo,
        summary: aiParsed.summary || '',
        experience,
        education,
        skills,
        certifications,
        projects,
        languages,
        volunteer,
        awards,
        publications,
        customSections,
        confidence,
        warnings,
        metadata: aiParsed.metadata || {
          detectedSections: [],
          layoutType: 'single-column',
          hasPhoto: false,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error('Failed to parse resume text');
    }
  }

  /**
   * Extract personal information
   */
  private static extractPersonalInfo(
    text: string,
    aiParsed: any,
    entities: any[]
  ): Partial<PersonalInfo> {
    const info: Partial<PersonalInfo> = {
      fullName: aiParsed.personalInfo?.name || '',
      title: aiParsed.personalInfo?.title || '',
      email: aiParsed.personalInfo?.email || '',
      phone: aiParsed.personalInfo?.phone || '',
      location: aiParsed.personalInfo?.location || '',
      linkedin: aiParsed.personalInfo?.linkedin || '',
      website: aiParsed.personalInfo?.portfolio || aiParsed.personalInfo?.website || '',
      github: aiParsed.personalInfo?.github || '',
    };

    // Extract email using regex if not found
    if (!info.email) {
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        info.email = emailMatch[0];
      }
    }

    // Extract phone using regex if not found
    if (!info.phone) {
      const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        info.phone = phoneMatch[0];
      }
    }

    // Extract LinkedIn URL
    if (!info.linkedin) {
      const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
      if (linkedinMatch) {
        info.linkedin = `https://${linkedinMatch[0]}`;
      }
    }

    return info;
  }

  /**
   * Extract work experience
   */
  private static extractExperience(aiParsed: any): Partial<WorkExperience>[] {
    if (!aiParsed.experience || !Array.isArray(aiParsed.experience)) {
      return [];
    }

    return aiParsed.experience.map((exp: any, index: number) => ({
      id: `exp-${index}`,
      position: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate?.toLowerCase() === 'present' ? '' : (exp.endDate || ''),
      current: exp.endDate?.toLowerCase() === 'present' || !exp.endDate,
      bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
    }));
  }

  /**
   * Extract education
   */
  private static extractEducation(aiParsed: any): Partial<Education>[] {
    if (!aiParsed.education || !Array.isArray(aiParsed.education)) {
      return [];
    }

    return aiParsed.education.map((edu: any, index: number) => ({
      id: `edu-${index}`,
      degree: edu.degree || '',
      field: edu.field || '',
      institution: edu.institution || '',
      location: edu.location || '',
      startDate: edu.startDate || '',
      endDate: edu.graduationDate || edu.endDate || '',
      gpa: edu.gpa || '',
    }));
  }

  /**
   * Extract skills
   */
  private static extractSkills(aiParsed: any): any[] {
    if (!aiParsed.skills || !Array.isArray(aiParsed.skills)) {
      return [];
    }

    // AI returns {category, items: [...]} format - keep it as the DB/builder expects this format
    return aiParsed.skills.map((skill: any) => {
      if (typeof skill === 'string') {
        // Simple string skill → wrap in technical category
        return { category: 'technical', items: [skill] };
      }
      if (skill.items && Array.isArray(skill.items)) {
        // Already in grouped format from AI
        return { category: skill.category || 'technical', items: skill.items };
      }
      if (skill.name) {
        // Individual skill object → wrap in its category
        return { category: skill.category || 'technical', items: [skill.name] };
      }
      return null;
    }).filter(Boolean);
  }

  /**
   * Extract projects
   */
  private static extractProjects(aiParsed: any): any[] {
    if (!aiParsed.projects || !Array.isArray(aiParsed.projects)) {
      return [];
    }

    return aiParsed.projects.map((project: any, index: number) => ({
      id: `project-${Date.now()}-${index}`,
      name: project.name || '',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      url: project.url || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
    }));
  }

  /**
   * Extract certifications
   */
  private static extractCertifications(aiParsed: any): any[] {
    if (!aiParsed.certifications || !Array.isArray(aiParsed.certifications)) {
      return [];
    }

    return aiParsed.certifications.map((cert: any, index: number) => ({
      id: `cert-${Date.now()}-${index}`,
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || '',
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
      url: cert.url || '',
    }));
  }

  /**
   * Extract languages
   */
  private static extractLanguages(aiParsed: any): any[] {
    if (!aiParsed.languages || !Array.isArray(aiParsed.languages)) {
      return [];
    }

    return aiParsed.languages.map((lang: any, index: number) => ({
      id: `lang-${Date.now()}-${index}`,
      name: lang.name || '',
      proficiency: lang.proficiency || '',
    }));
  }

  /**
   * Extract volunteer experience
   */
  private static extractVolunteer(aiParsed: any): any[] {
    if (!aiParsed.volunteer || !Array.isArray(aiParsed.volunteer)) {
      return [];
    }

    return aiParsed.volunteer.map((vol: any, index: number) => ({
      id: `vol-${Date.now()}-${index}`,
      role: vol.role || '',
      organization: vol.organization || '',
      location: vol.location || '',
      startDate: vol.startDate || '',
      endDate: vol.endDate || '',
      current: vol.endDate?.toLowerCase() === 'present' || vol.endDate?.toLowerCase() === 'current' || !vol.endDate,
      description: vol.description || '',
    }));
  }

  /**
   * Extract awards and honors
   */
  private static extractAwards(aiParsed: any): any[] {
    if (!aiParsed.awards || !Array.isArray(aiParsed.awards)) {
      return [];
    }

    return aiParsed.awards.map((award: any, index: number) => ({
      id: `award-${Date.now()}-${index}`,
      title: award.title || '',
      issuer: award.issuer || '',
      date: award.date || '',
      description: award.description || '',
    }));
  }

  /**
   * Extract publications
   */
  private static extractPublications(aiParsed: any): any[] {
    if (!aiParsed.publications || !Array.isArray(aiParsed.publications)) {
      return [];
    }

    return aiParsed.publications.map((pub: any, index: number) => ({
      id: `pub-${Date.now()}-${index}`,
      title: pub.title || '',
      publisher: pub.publisher || '',
      date: pub.date || '',
      url: pub.url || '',
      description: pub.description || '',
    }));
  }

  /**
   * Calculate parsing confidence score
   */
  private static calculateConfidence(
    personalInfo: Partial<PersonalInfo>,
    experience: Partial<WorkExperience>[],
    education: Partial<Education>[],
    skills: any[],
    baseConfidence: number
  ): number {
    let score = baseConfidence;

    // Deduct points for missing critical information
    if (!personalInfo.fullName) score -= 0.2;
    if (!personalInfo.email) score -= 0.1;
    if (experience.length === 0) score -= 0.2;
    if (education.length === 0) score -= 0.1;
    if (skills.length === 0) score -= 0.1;

    // Bonus for complete information
    if (personalInfo.phone) score += 0.05;
    if (personalInfo.linkedin) score += 0.05;

    return Math.max(0, Math.min(1, score));
  }
}

export default ResumeParserService;
