/**
 * React-PDF Service
 * Fast, serverless-compatible PDF generation using @react-pdf/renderer
 * Replaces Puppeteer-based generation (~200ms vs ~3-5s)
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';

// Only two templates are supported. Other IDs alias to the closest match.
const templateLoaders: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  'minimalist': () => import('./react-pdf-templates/minimalist'),
  'modern-two-column': () => import('./react-pdf-templates/modern-two-column'),
};

const TEMPLATE_ALIASES: Record<string, 'minimalist' | 'modern-two-column'> = {
  'modern-two-column': 'modern-two-column',
  'minimalist': 'minimalist',
  'minimalist-single': 'minimalist',
  'ats-classic': 'minimalist',
  'professional': 'minimalist',
  'professional-corporate': 'minimalist',
  'executive': 'minimalist',
  'tech-modern': 'modern-two-column',
  'creative-ats': 'modern-two-column',
};

export class ReactPDFService {
  /**
   * Generate PDF buffer from resume data using React-PDF
   * Much faster than Puppeteer: no browser launch, no network requests
   */
  static async generatePDF(
    resumeData: ResumeData,
    templateId: string,
    customization: TemplateCustomization = DEFAULT_CUSTOMIZATION
  ): Promise<Buffer> {
    const startTime = Date.now();

    // Resolve template ID through aliases (handles legacy/old IDs)
    const resolvedId = TEMPLATE_ALIASES[templateId] || 'minimalist';
    if (!(templateId in templateLoaders) && !(templateId in TEMPLATE_ALIASES)) {
      console.warn(`Template "${templateId}" not found for React-PDF, falling back to minimalist`);
    }

    const templateModule = await templateLoaders[resolvedId]();
    const TemplateComponent = templateModule.default;

    // Create React element
    const element = React.createElement(TemplateComponent, {
      data: resumeData,
      customization,
    });

    // Render to PDF buffer
    const buffer = await renderToBuffer(element as any);

    const duration = Date.now() - startTime;
    console.log(`React-PDF generation completed in ${duration}ms (template: ${templateId})`);

    return Buffer.from(buffer);
  }

  /**
   * Get list of supported template IDs for React-PDF generation
   */
  static getSupportedTemplates(): string[] {
    return Object.keys(templateLoaders);
  }

  /**
   * Check if a template ID is supported for React-PDF generation
   */
  static isSupported(templateId: string): boolean {
    return templateId in templateLoaders || templateId in TEMPLATE_ALIASES;
  }
}
