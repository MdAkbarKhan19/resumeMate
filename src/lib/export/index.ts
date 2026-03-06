/**
 * Export Service
 * Handles PDF and DOCX generation from resume data
 */

import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { ResumeData, Experience, Education, Skill, Certification, Project, Language } from '@/types/resume';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Generate PDF from resume HTML
 */
export class ExportService {
  /**
   * Generate PDF buffer from resume component
   */
  static async generatePDF(resumeHTML: string): Promise<Buffer> {
    let browser;
    
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      
      // Set content with proper styling
      await page.setContent(resumeHTML, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate DOCX from resume data
   */
  static async generateDOCX(resume: ResumeData): Promise<Buffer> {
    try {
      const sections: any[] = [];

      // Personal Info Header
      const personalInfo = resume.personalInfo;
      sections.push(
        new Paragraph({
          text: personalInfo.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: personalInfo.email,
          alignment: AlignmentType.CENTER,
        })
      );

      if (personalInfo.phone) {
        sections.push(
          new Paragraph({
            text: personalInfo.phone,
            alignment: AlignmentType.CENTER,
          })
        );
      }

      if (personalInfo.location) {
        sections.push(
          new Paragraph({
            text: personalInfo.location,
            alignment: AlignmentType.CENTER,
          })
        );
      }

      // Links
      const links = [];
      if (personalInfo.linkedin) links.push(personalInfo.linkedin);
      if (personalInfo.portfolio) links.push(personalInfo.portfolio);
      if (personalInfo.github) links.push(personalInfo.github);
      
      if (links.length > 0) {
        sections.push(
          new Paragraph({
            text: links.join(' | '),
            alignment: AlignmentType.CENTER,
          })
        );
      }

      sections.push(new Paragraph({ text: '' })); // Spacing

      // Summary
      if (resume.summary) {
        sections.push(
          new Paragraph({
            text: 'Professional Summary',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: resume.summary,
          }),
          new Paragraph({ text: '' })
        );
      }

      // Experience
      if (resume.experience && resume.experience.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Experience',
            heading: HeadingLevel.HEADING_2,
          })
        );

        resume.experience.forEach((exp: Experience) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.jobTitle,
                  bold: true,
                }),
                new TextRun({
                  text: ` | ${exp.company}`,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}${exp.location ? ' | ' + exp.location : ''}`,
                  italics: true,
                }),
              ],
            })
          );

          exp.bullets.forEach((bullet: string) => {
            sections.push(
              new Paragraph({
                text: `• ${bullet}`,
                indent: { left: 720 }, // 0.5 inch
              })
            );
          });

          sections.push(new Paragraph({ text: '' }));
        });
      }

      // Education
      if (resume.education && resume.education.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Education',
            heading: HeadingLevel.HEADING_2,
          })
        );

        resume.education.forEach((edu: Education) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.degree}${edu.field ? ' in ' + edu.field : ''}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: edu.institution,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.startDate || ''} - ${edu.graduationDate || ''}${edu.gpa ? ' | GPA: ' + edu.gpa : ''}`,
                  italics: true,
                }),
              ],
            }),
            new Paragraph({ text: '' })
          );
        });
      }

      // Skills
      if (resume.skills && resume.skills.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Skills',
            heading: HeadingLevel.HEADING_2,
          })
        );

        // Group skills by category
        const skillsByCategory = resume.skills.reduce((acc, skill) => {
          const cat = skill.category || 'other';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(skill.name);
          return acc;
        }, {} as Record<string, string[]>);

        Object.entries(skillsByCategory).forEach(([category, skillNames]) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${category}: `,
                  bold: true,
                }),
                new TextRun({
                  text: skillNames.join(', '),
                }),
              ],
            })
          );
        });

        sections.push(new Paragraph({ text: '' }));
      }

      // Certifications
      if (resume.certifications && resume.certifications.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Certifications',
            heading: HeadingLevel.HEADING_2,
          })
        );

        resume.certifications.forEach((cert: Certification) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                }),
                new TextRun({
                  text: ` - ${cert.issuer}`,
                }),
                cert.date ? new TextRun({ text: ` | ${cert.date}` }) : new TextRun({ text: '' }),
              ],
            })
          );
        });

        sections.push(new Paragraph({ text: '' }));
      }

      // Projects
      if (resume.projects && resume.projects.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Projects',
            heading: HeadingLevel.HEADING_2,
          })
        );

        resume.projects.forEach((project: Project) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: project.name,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              text: project.description,
            })
          );

          if (project.techStack && project.techStack.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Technologies: ${project.techStack.join(', ')}`,
                    italics: true,
                  }),
                ],
              })
            );
          }

          sections.push(new Paragraph({ text: '' }));
        });
      }

      // Languages
      if (resume.languages && resume.languages.length > 0) {
        sections.push(
          new Paragraph({
            text: 'Languages',
            heading: HeadingLevel.HEADING_2,
          })
        );

        resume.languages.forEach((lang: Language) => {
          sections.push(
            new Paragraph({
              text: `${lang.name}: ${lang.proficiency}`,
            })
          );
        });
      }

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      console.error('DOCX generation error:', error);
      throw new Error('Failed to generate DOCX');
    }
  }

  /**
   * Render React component to HTML string for PDF generation
   */
  static renderTemplateToHTML(component: React.ReactElement): string {
    const markup = renderToStaticMarkup(component);
    
    // Wrap in full HTML document with styles
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
            }
            @page {
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${markup}
        </body>
      </html>
    `;
  }
}
