import puppeteer from 'puppeteer';
import { getTemplateComponent } from '@/components/templates';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

export class PuppeteerPDFService {
  /**
   * Generate PDF from resume data using Puppeteer
   */
  static async generatePDF(
    resumeData: ResumeData,
    templateId: string,
    customization: TemplateCustomization = DEFAULT_CUSTOMIZATION
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to letter size (8.5 x 11 inches at 96 DPI)
      await page.setViewport({
        width: 816, // 8.5 inches * 96 DPI
        height: 1056, // 11 inches * 96 DPI
        deviceScaleFactor: 2, // For sharp rendering
      });

      // Get template component
      const TemplateComponent = getTemplateComponent(templateId);

      // Render template to HTML
      const templateElement = React.createElement(TemplateComponent as any, {
        data: resumeData,
        customization,
        preview: false, // PDF mode
      });

      const templateHTML = renderToStaticMarkup(templateElement);

      // Build complete HTML with Tailwind CSS and fonts
      const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  
  <style>
    @page {
      size: letter;
      margin: 0;
    }
    
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: ${customization?.fontFamily || 'Inter'}, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Ensure colors print correctly */
    .bg-primary-50 {
      background-color: ${customization?.primaryColor}10 !important;
    }
    
    /* Print-specific styles */
    @media print {
      body {
        width: 8.5in;
        height: 11in;
      }
      
      * {
        page-break-inside: avoid;
      }
      
      h1, h2, h3 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  ${templateHTML}
</body>
</html>
      `.trim();

      // Set page content
      await page.setContent(fullHTML, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000,
      });

      // Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'letter',
        printBackground: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate PDF from HTML string (fallback method)
   */
  static async generatePDFFromHTML(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      const pdfBuffer = await page.pdf({
        format: 'letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
