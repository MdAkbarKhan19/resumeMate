// @ts-ignore - html-to-docx doesn't have type definitions
import HTMLToDocx from 'html-to-docx';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { getTemplateComponent } from '@/components/templates';
import React from 'react';

/**
 * Enhanced DOCX Generation Service
 * Converts HTML resume to editable Word document with ATS-friendly structure
 */
export class EnhancedDOCXService {
  /**
   * Generate DOCX from resume data with proper formatting
   */
  static async generateDOCX(
    resumeData: ResumeData,
    templateId: string,
    customization: TemplateCustomization = DEFAULT_CUSTOMIZATION
  ): Promise<Buffer> {
    try {
      // Dynamic import to avoid Next.js bundling issues
      const { renderToStaticMarkup } = await import('react-dom/server');
      
      // Get template component
      const TemplateComponent = getTemplateComponent(templateId);

      // Render template to HTML
      const templateElement = React.createElement(TemplateComponent as any, {
        data: resumeData,
        customization,
        preview: false, // DOCX mode - no interactive elements
      });

      const templateHTML = renderToStaticMarkup(templateElement);

      // Build ATS-friendly HTML for DOCX conversion
      const docxHTML = this.buildDOCXHTML(templateHTML, resumeData, customization);

      // Configure DOCX options
      const docxOptions = this.getDOCXOptions(customization);

      // Generate DOCX
      const docxBuffer = await HTMLToDocx(docxHTML, null, docxOptions);

      return Buffer.from(docxBuffer);
    } catch (error) {
      console.error('Enhanced DOCX generation error:', error);
      throw new Error(`Failed to generate DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build HTML optimized for DOCX conversion
   * Simplifies complex layouts to ATS-friendly structure
   */
  private static buildDOCXHTML(
    templateHTML: string,
    resumeData: ResumeData,
    customization: TemplateCustomization
  ): string {
    const primaryColor = customization?.primaryColor || '#2563eb';
    const fontFamily = customization?.fontFamily || 'Inter';

    // Clean HTML for better Word compatibility
    let cleanHTML = templateHTML;

    // Remove contenteditable attributes
    cleanHTML = cleanHTML.replace(/contenteditable="[^"]*"/g, '');

    // Remove data attributes that don't translate to Word
    cleanHTML = cleanHTML.replace(/data-[^=]*="[^"]*"/g, '');

    // Simplify complex flex/grid layouts to tables for Word
    // (Word doesn't support CSS Grid/Flexbox well)
    cleanHTML = this.simplifyLayoutForWord(cleanHTML);

    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <title>Resume - ${resumeData.personalInfo?.name || 'Professional'}</title>
  <style>
    /* Base document styles */
    body {
      font-family: ${fontFamily}, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000000;
      margin: 0;
      padding: 0;
    }
    
    /* Page setup */
    @page {
      size: 8.5in 11in;
      margin: 0.75in 0.75in 0.75in 0.75in;
    }
    
    /* Headings */
    h1 {
      font-size: 24pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-top: 0;
      margin-bottom: 12pt;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: bold;
      color: ${primaryColor};
      margin-top: 12pt;
      margin-bottom: 6pt;
      border-bottom: 2pt solid ${primaryColor};
      padding-bottom: 3pt;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 6pt;
      margin-bottom: 3pt;
    }
    
    /* Paragraphs */
    p {
      margin-top: 0;
      margin-bottom: 6pt;
      text-align: justify;
    }
    
    /* Lists */
    ul {
      margin-top: 0;
      margin-bottom: 6pt;
      padding-left: 24pt;
    }
    
    li {
      margin-bottom: 3pt;
    }
    
    /* Links */
    a {
      color: ${primaryColor};
      text-decoration: underline;
    }
    
    /* Tables for layout */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
    }
    
    td {
      vertical-align: top;
      padding: 3pt;
    }
    
    /* Strong and emphasis */
    strong, b {
      font-weight: bold;
    }
    
    em, i {
      font-style: italic;
    }
    
    /* Contact info styling */
    .contact-info {
      text-align: center;
      margin-bottom: 12pt;
    }
    
    /* Section styling */
    .resume-section {
      margin-bottom: 12pt;
    }
    
    /* Job entry */
    .job-entry {
      margin-bottom: 12pt;
    }
    
    .job-header {
      margin-bottom: 3pt;
    }
    
    .job-title {
      font-weight: bold;
      font-size: 11pt;
    }
    
    .company-name {
      font-weight: normal;
      font-style: italic;
    }
    
    .date-range {
      color: #666666;
      font-size: 10pt;
    }
    
    /* Skills */
    .skill-category {
      margin-bottom: 6pt;
    }
    
    .skill-name {
      font-weight: bold;
    }
    
    /* Ensure good printing */
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  ${cleanHTML}
</body>
</html>`.trim();
  }

  /**
   * Simplify complex CSS layouts to table-based layout for Word
   */
  private static simplifyLayoutForWord(html: string): string {
    // This is a simplified version - in production, you might use a proper HTML parser
    // For now, we'll do basic replacements

    // Convert flex/grid containers to tables where necessary
    // This would require more sophisticated parsing in production

    // Remove Tailwind classes that don't translate well
    html = html.replace(/class="[^"]*(?:flex|grid|absolute|fixed|sticky)[^"]*"/g, 'class=""');

    // Simplify multi-column layouts
    // If template uses two columns, ensure it's done with tables

    return html;
  }

  /**
   * Get DOCX conversion options
   */
  private static getDOCXOptions(customization: TemplateCustomization): any {
    const fontFamily = customization?.fontFamily || 'Inter';
    const primaryColor = customization?.primaryColor || '#2563eb';

    return {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: false,
      font: fontFamily,
      fontSize: '11pt',
      lineHeight: 1.5,
      margins: {
        top: 720, // 0.5 inch in twips (1440 twips = 1 inch)
        right: 720,
        bottom: 720,
        left: 720,
      },
      orientation: 'portrait',
      // Custom document properties
      title: 'Professional Resume',
      subject: 'Resume',
      creator: 'ResumeMate',
      keywords: ['resume', 'cv', 'professional'],
      description: 'Professional resume created with ResumeMate',
      lastModifiedBy: 'ResumeMate',
    };
  }

  /**
   * Generate DOCX from raw HTML string
   */
  static async generateDOCXFromHTML(
    html: string,
    options?: {
      title?: string;
      margins?: { top?: number; right?: number; bottom?: number; left?: number };
    }
  ): Promise<Buffer> {
    try {
      const docxOptions = {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: false,
        margins: options?.margins || {
          top: 720,
          right: 720,
          bottom: 720,
          left: 720,
        },
        title: options?.title || 'Resume',
        orientation: 'portrait',
      };

      const docxBuffer = await HTMLToDocx(html, null, docxOptions);
      return Buffer.from(docxBuffer);
    } catch (error) {
      console.error('DOCX from HTML generation error:', error);
      throw new Error(`Failed to generate DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate DOCX buffer
   */
  static isValidDOCX(buffer: Buffer): boolean {
    // DOCX files are ZIP archives, check for ZIP signature
    const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    return buffer.slice(0, 4).equals(zipSignature);
  }
}
