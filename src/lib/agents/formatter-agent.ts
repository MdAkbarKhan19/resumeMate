/**
 * Formatter Agent
 * Handles PDF and DOCX document generation
 * Currently delegates to existing services, will be upgraded to React-PDF in Phase 5
 */

import { BaseAgent } from './base-agent';
import { ResumeJSON } from './types';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';

interface FormatterInput {
  resume: ResumeJSON;
  templateId: string;
  format: 'pdf' | 'docx';
  customization?: TemplateCustomization;
}

interface FormatterOutput {
  buffer: Buffer;
  format: string;
  templateId: string;
}

export class FormatterAgent extends BaseAgent<FormatterInput, FormatterOutput> {
  constructor() {
    super('formatter', { maxRetries: 1 });
  }

  protected async execute(input: FormatterInput): Promise<{ data: FormatterOutput; tokensUsed: number }> {
    const { resume, templateId, format, customization } = input;

    this.emitProgress(`Generating ${format.toUpperCase()}...`, 10);

    // Convert ResumeJSON to the ResumeData format expected by existing services
    const resumeData = this.convertToResumeData(resume);
    const templateCustomization = customization || DEFAULT_CUSTOMIZATION;

    let buffer: Buffer;

    if (format === 'pdf') {
      this.emitProgress('Rendering PDF template...', 30);
      // Use React-PDF for fast serverless-compatible generation
      try {
        const { ReactPDFService } = await import('@/lib/export/react-pdf-service');
        buffer = await ReactPDFService.generatePDF(resumeData, templateId, templateCustomization);
      } catch (reactPdfError) {
        this.emitProgress('Falling back to Puppeteer PDF...', 50);
        const { EnhancedPDFService } = await import('@/lib/export/enhanced-pdf');
        buffer = await EnhancedPDFService.generatePDF(resumeData, templateId, templateCustomization);
      }
    } else {
      this.emitProgress('Generating DOCX...', 30);
      const { EnhancedDOCXService } = await import('@/lib/export/enhanced-docx');
      buffer = await EnhancedDOCXService.generateDOCX(resumeData, templateId);
    }

    this.emitProgress(`${format.toUpperCase()} generated successfully`, 100);

    return {
      data: {
        buffer,
        format,
        templateId,
      },
      tokensUsed: 0, // No AI calls
    };
  }

  /**
   * Convert standardized ResumeJSON to the ResumeData format used by templates
   */
  private convertToResumeData(resume: ResumeJSON): ResumeData {
    return {
      personalInfo: {
        name: resume.personalInfo.name,
        title: resume.personalInfo.title,
        email: resume.personalInfo.email,
        phone: resume.personalInfo.phone || '',
        location: resume.personalInfo.location || '',
        linkedin: resume.personalInfo.linkedin,
        portfolio: resume.personalInfo.portfolio,
        github: resume.personalInfo.github,
      },
      summary: resume.summary,
      experience: resume.experience.map(e => ({
        id: e.id,
        jobTitle: e.jobTitle,
        company: e.company,
        location: e.location || '',
        startDate: e.startDate,
        endDate: e.endDate || '',
        current: e.current,
        bullets: e.bullets,
      })),
      education: resume.education.map(e => ({
        id: e.id,
        degree: e.degree,
        field: e.field,
        institution: e.institution,
        location: e.location || '',
        startDate: e.startDate,
        graduationDate: e.graduationDate,
        gpa: e.gpa,
      })),
      skills: resume.skills.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category as 'technical' | 'soft' | 'language',
      })),
      certifications: resume.certifications.map(c => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        expiryDate: c.expiryDate,
        credentialId: c.credentialId,
      })),
      projects: resume.projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        techStack: p.techStack,
        url: p.url,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      languages: resume.languages.map(l => ({
        id: l.id,
        name: l.name,
        proficiency: l.proficiency,
      })),
      volunteer: resume.volunteer.map(v => ({
        id: v.id,
        role: v.role,
        organization: v.organization,
        location: v.location || '',
        startDate: v.startDate || '',
        endDate: v.endDate || '',
        current: v.current,
        description: v.description,
      })),
      customSections: resume.customSections?.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
      })),
    };
  }
}
