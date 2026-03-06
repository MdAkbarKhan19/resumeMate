import puppeteer, { Browser } from 'puppeteer';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { getTemplateComponent } from '@/components/templates';
import React from 'react';

/**
 * Enhanced PDF Generation Service with Paged.js integration
 * Provides pixel-perfect WYSIWYG PDF output with proper page breaks and styling
 */
export class EnhancedPDFService {
  private static browser: Browser | null = null;

  /**
   * Get or create a persistent browser instance for better performance
   */
  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance (call on shutdown)
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate enhanced PDF with Paged.js for perfect pagination
   */
  static async generatePDF(
    resumeData: ResumeData,
    templateId: string,
    customization: TemplateCustomization = DEFAULT_CUSTOMIZATION
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Dynamic import to avoid Next.js bundling issues
      const { renderToStaticMarkup } = await import('react-dom/server');
      
      // Set viewport to letter size (8.5 x 11 inches at 96 DPI)
      await page.setViewport({
        width: 816, // 8.5 inches * 96 DPI
        height: 1056, // 11 inches * 96 DPI
        deviceScaleFactor: 2, // For high-quality rendering
      });

      // Get template component
      const TemplateComponent = getTemplateComponent(templateId);

      // Render template to HTML
      const templateElement = React.createElement(TemplateComponent as any, {
        data: resumeData,
        customization,
        preview: false, // PDF mode - no interactive elements
      });

      const templateHTML = renderToStaticMarkup(templateElement);

      // Build complete HTML with all necessary resources
      const fullHTML = this.buildEnhancedHTML(templateHTML, customization);

      // Set page content and wait for all resources to load
      await page.setContent(fullHTML, {
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        timeout: 60000,
      });

      // Wait for fonts to be fully loaded
      await page.evaluateHandle('document.fonts.ready');

      // Wait for Paged.js to complete pagination (if used)
      await page.waitForFunction(
        () => {
          return (window as any).PagedPolyfill?.preview?.done || true;
        },
        { timeout: 30000 }
      ).catch(() => {
        // Paged.js might not be used in all templates, continue anyway
      });

      // Add a small delay to ensure all styles are applied
      await page.waitForTimeout(500);

      // Generate PDF with optimal settings
      const pdfBuffer = await page.pdf({
        format: 'letter',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        displayHeaderFooter: false,
        omitBackground: false,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Enhanced PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Build complete HTML document with all styles, fonts, and Paged.js
   */
  private static buildEnhancedHTML(
    templateHTML: string,
    customization: TemplateCustomization
  ): string {
    const primaryColor = customization?.primaryColor || '#2563eb';
    const fontFamily = customization?.fontFamily || 'Inter';
    const fontSize = customization?.fontSize || 'base';
    const spacing = customization?.spacing || 'normal';

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
      hex = hex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    // Font size mappings
    const fontSizeMap: Record<string, string> = {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    };

    // Spacing mappings
    const spacingMap: Record<string, string> = {
      compact: '0.75rem',
      normal: '1rem',
      relaxed: '1.5rem',
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - PDF Export</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts - Multiple font families for template variety -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;600;700;800&family=Lato:wght@300;400;700;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Source+Sans+Pro:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  
  <!-- Paged.js for advanced pagination control -->
  <script src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js"></script>
  
  <style>
    /* CSS Paged Media rules for print */
    @page {
      size: letter;
      margin: 0;
    }
    
    /* Ensure all colors and backgrounds print correctly */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Base body styles */
    body {
      margin: 0;
      padding: 0;
      font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      font-size: ${fontSizeMap[fontSize] || '1rem'};
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #000000;
      background: #ffffff;
    }
    
    /* Page container */
    .resume-page {
      width: 8.5in;
      min-height: 11in;
      position: relative;
      background: white;
    }
    
    /* Two-column template specific styles */
    .modern-two-column {
      height: 11in;
      overflow: hidden;
    }
    
    .modern-two-column .flex {
      height: 100%;
    }
    
    /* Custom spacing based on user preference */
    .resume-section {
      margin-bottom: ${spacingMap[spacing] || '1rem'};
    }
    
    /* Primary color customization */
    .text-primary {
      color: ${primaryColor} !important;
    }
    
    .bg-primary {
      background-color: ${primaryColor} !important;
    }
    
    .bg-primary-50 {
      background-color: ${hexToRgba(primaryColor, 0.1)} !important;
    }
    
    .border-primary {
      border-color: ${primaryColor} !important;
    }
    
    /* Page break controls for Paged.js */
    .page-break-before {
      break-before: page;
      page-break-before: always;
    }
    
    .page-break-after {
      break-after: page;
      page-break-after: always;
    }
    
    .page-break-avoid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Avoid breaking these elements */
    h1, h2, h3, h4, h5, h6 {
      break-after: avoid;
      page-break-after: avoid;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Keep job entries together */
    .job-entry,
    .education-entry,
    .project-entry {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Typography enhancements */
    h1 {
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    
    h2 {
      font-weight: 600;
      letter-spacing: -0.015em;
    }
    
    h3 {
      font-weight: 600;
    }
    
    /* List styling */
    ul {
      list-style-position: outside;
      padding-left: 1.25rem;
    }
    
    li {
      margin-bottom: 0.25rem;
    }
    
    /* Link styling for print */
    a {
      color: inherit;
      text-decoration: none;
    }
    
    /* Ensure proper text rendering */
    p, li, span, div {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Print-specific media query */
    @media print {
      body {
        width: 8.5in;
        height: 11in;
      }
      
      /* Hide any elements marked as no-print */
      .no-print {
        display: none !important;
      }
      
      /* Ensure page breaks work correctly */
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }
    
    /* Tailwind customizations for this document */
    .prose {
      max-width: none;
    }
    
    /* Fix any potential layout shifts */
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* Ensure consistent box-sizing */
    *, *::before, *::after {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  ${templateHTML}
  
  <script>
    // Ensure fonts are loaded before PDF generation
    document.fonts.ready.then(() => {
      console.log('All fonts loaded');
    });
    
    // Configure Paged.js if available
    if (window.PagedPolyfill) {
      class PagedHandler extends window.PagedPolyfill.Handler {
        constructor(chunker, polisher, caller) {
          super(chunker, polisher, caller);
        }
        
        // Custom handlers can be added here
        afterPreview(pages) {
          console.log('Paged.js preview complete:', pages.length, 'pages');
        }
      }
      
      window.PagedPolyfill.registerHandlers(PagedHandler);
    }
  </script>
</body>
</html>`.trim();
  }

  /**
   * Generate PDF from raw HTML (for custom templates or external content)
   */
  static async generatePDFFromHTML(
    html: string,
    options: {
      format?: 'letter' | 'a4';
      margins?: { top?: string; right?: string; bottom?: string; left?: string };
    } = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'load'],
        timeout: 60000,
      });

      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: options.format || 'letter',
        printBackground: true,
        margin: options.margins || {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }
}
