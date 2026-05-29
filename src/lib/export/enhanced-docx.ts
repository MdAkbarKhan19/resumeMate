import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  ExternalHyperlink,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from 'docx';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';

const TEMPLATE_ALIASES: Record<string, 'modern-two-column' | 'minimalist'> = {
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

function resolveTemplateId(id: string): 'modern-two-column' | 'minimalist' {
  return TEMPLATE_ALIASES[id] || 'minimalist';
}

const TEXT_COLOR = '222222';
const MUTED_COLOR = '555555';
const ACCENT_COLOR = '1A1A1A';

function hexToDocx(hex?: string, fallback: string = ACCENT_COLOR): string {
  if (!hex) return fallback;
  return hex.replace('#', '').toUpperCase().padStart(6, '0').slice(0, 6);
}

function richTextRuns(text: string, baseOpts: { color?: string; size?: number; font?: string } = {}): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), ...baseOpts }));
    }
    runs.push(new TextRun({ text: match[1], bold: true, ...baseOpts }));
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), ...baseOpts }));
  }
  if (runs.length === 0) runs.push(new TextRun({ text, ...baseOpts }));
  return runs;
}

function sectionHeading(text: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { color: 'CCCCCC', size: 6, style: BorderStyle.SINGLE, space: 1 } },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 24,
        color: accent,
        font: 'Calibri',
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: richTextRuns(text, { size: 20, color: TEXT_COLOR, font: 'Calibri' }),
  });
}

function formatDateRange(start?: string, end?: string, current?: boolean): string {
  const left = (start || '').trim();
  const right = current ? 'Present' : (end || '').trim();
  if (left && right) return `${left} – ${right}`;
  return left || right || '';
}

function normalizeSkillCategory(category: string | undefined): 'technical' | 'soft' | 'language' | 'tools' {
  if (!category) return 'technical';
  const cat = category.toLowerCase().trim();
  if (/^(soft|interpersonal|leadership|communication)/.test(cat) || cat.includes('soft skill')) return 'soft';
  if (/^(language|spoken)/.test(cat) && !cat.includes('programming')) return 'language';
  if (/(tool|platform|software|devops|cloud|database|operating)/.test(cat)) return 'tools';
  return 'technical';
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical Skills',
  soft: 'Soft Skills',
  language: 'Languages',
  tools: 'Tools & Platforms',
};

function buildHeader(data: ResumeData, accent: string): Paragraph[] {
  const { personalInfo } = data;
  const paras: Paragraph[] = [];

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: personalInfo.name || 'Your Name',
          bold: true,
          size: 40,
          color: accent,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (personalInfo.title) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: personalInfo.title,
            size: 22,
            color: MUTED_COLOR,
            font: 'Calibri',
          }),
        ],
      })
    );
  }

  const buildSocialUrl = (rawInput: string, domain: string, slugPath: string): string => {
    const raw = (rawInput || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const lower = raw.toLowerCase();
    if (lower.startsWith(`${domain}/`) || lower.startsWith(`www.${domain}/`)) return `https://${raw}`;
    if (lower.includes(`${domain}/`)) return `https://${raw.replace(/^\/+/, '')}`;
    return `https://${domain}/${slugPath}${raw.replace(/^\/+/, '')}`;
  };
  const displayHandle = (raw: string) => raw.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') || raw;

  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.linkedin) {
    contactParts.push({
      text: displayHandle(personalInfo.linkedin),
      href: buildSocialUrl(personalInfo.linkedin, 'linkedin.com', 'in/'),
    });
  }
  if (personalInfo.github) {
    contactParts.push({
      text: displayHandle(personalInfo.github),
      href: buildSocialUrl(personalInfo.github, 'github.com', ''),
    });
  }
  if (personalInfo.portfolio) {
    contactParts.push({ text: displayHandle(personalInfo.portfolio), href: buildSiteUrl(personalInfo.portfolio) });
  }
  if (personalInfo.location) contactParts.push({ text: personalInfo.location });

  if (contactParts.length > 0) {
    const children: any[] = [];
    contactParts.forEach((part, i) => {
      if (i > 0) {
        children.push(new TextRun({ text: '  |  ', size: 18, color: MUTED_COLOR, font: 'Calibri' }));
      }
      if (part.href) {
        children.push(
          new ExternalHyperlink({
            link: part.href,
            children: [new TextRun({ text: part.text, size: 18, color: '1F4E79', font: 'Calibri', style: 'Hyperlink' })],
          })
        );
      } else {
        children.push(new TextRun({ text: part.text, size: 18, color: TEXT_COLOR, font: 'Calibri' }));
      }
    });
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children,
      })
    );
  }

  return paras;
}

function buildSummary(data: ResumeData, accent: string): Paragraph[] {
  if (!data.summary) return [];
  return [
    sectionHeading('Profile Summary', accent),
    new Paragraph({
      spacing: { after: 100, line: 300 },
      alignment: AlignmentType.JUSTIFIED,
      children: richTextRuns(data.summary, { size: 20, color: TEXT_COLOR, font: 'Calibri' }),
    }),
  ];
}

function buildExperience(data: ResumeData, accent: string): Paragraph[] {
  if (!data.experience?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Work Experience', accent)];
  data.experience.forEach((exp) => {
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: exp.company || '', bold: true, size: 22, color: ACCENT_COLOR, font: 'Calibri' }),
          new TextRun({
            text: `\t${formatDateRange(exp.startDate, exp.endDate, exp.current)}`,
            size: 18,
            color: MUTED_COLOR,
            font: 'Calibri',
          }),
        ],
      })
    );
    const titleParts = [exp.jobTitle, exp.location].filter(Boolean).join(' | ');
    if (titleParts) {
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: titleParts, italics: true, size: 20, color: MUTED_COLOR, font: 'Calibri' })],
        })
      );
    }
    (exp.bullets || []).filter((b) => b && b.trim()).forEach((b) => paras.push(bullet(b)));
  });
  return paras;
}

function buildProjects(data: ResumeData, accent: string): Paragraph[] {
  if (!data.projects?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Projects', accent)];
  data.projects.forEach((proj) => {
    paras.push(
      new Paragraph({
        spacing: { before: 120, after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: proj.name || '', bold: true, size: 22, color: ACCENT_COLOR, font: 'Calibri' }),
          new TextRun({
            text: `\t${formatDateRange(proj.startDate, proj.endDate)}`,
            size: 18,
            color: MUTED_COLOR,
            font: 'Calibri',
          }),
        ],
      })
    );
    if (proj.description) {
      paras.push(
        new Paragraph({
          spacing: { after: 60, line: 280 },
          alignment: AlignmentType.JUSTIFIED,
          children: richTextRuns(proj.description, { size: 20, color: TEXT_COLOR, font: 'Calibri' }),
        })
      );
    }
    if (proj.techStack?.length) {
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'Tech: ', bold: true, size: 18, color: MUTED_COLOR, font: 'Calibri' }),
            new TextRun({ text: proj.techStack.join(', '), size: 18, color: TEXT_COLOR, font: 'Calibri' }),
          ],
        })
      );
    }
    if (proj.url) {
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new ExternalHyperlink({
              link: buildSiteUrl(proj.url),
              children: [new TextRun({ text: proj.url, size: 18, color: '1F4E79', font: 'Calibri', style: 'Hyperlink' })],
            }),
          ],
        })
      );
    }
  });
  return paras;
}

function buildSkills(data: ResumeData, accent: string): Paragraph[] {
  if (!data.skills?.length) return [];
  const grouped: Record<string, string[]> = {};
  data.skills.forEach((s) => {
    const cat = normalizeSkillCategory(s.category);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s.name);
  });
  const paras: Paragraph[] = [sectionHeading('Technical Skills', accent)];
  Object.entries(grouped).forEach(([category, items]) => {
    paras.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${CATEGORY_LABELS[category] || category}: `, bold: true, size: 20, color: ACCENT_COLOR, font: 'Calibri' }),
          new TextRun({ text: items.join(', '), size: 20, color: TEXT_COLOR, font: 'Calibri' }),
        ],
      })
    );
  });
  return paras;
}

function buildEducation(data: ResumeData, accent: string): Paragraph[] {
  if (!data.education?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Education', accent)];
  data.education.forEach((edu) => {
    paras.push(
      new Paragraph({
        spacing: { before: 100, after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({
            text: `${edu.degree || ''}${edu.field ? ` ${edu.field}` : ''}`,
            bold: true,
            size: 22,
            color: ACCENT_COLOR,
            font: 'Calibri',
          }),
          new TextRun({
            text: `\t${formatDateRange(edu.startDate, edu.graduationDate)}`,
            size: 18,
            color: MUTED_COLOR,
            font: 'Calibri',
          }),
        ],
      })
    );
    const sub = [edu.institution, edu.location].filter(Boolean).join(' | ');
    if (sub) {
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: sub, size: 20, color: TEXT_COLOR, font: 'Calibri' })],
        })
      );
    }
    if (edu.gpa) {
      paras.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: `CGPA: ${edu.gpa}`, size: 18, color: MUTED_COLOR, font: 'Calibri' })],
        })
      );
    }
  });
  return paras;
}

function buildSiteUrl(rawInput: string): string {
  const raw = (rawInput || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
}

function formatMonthYear(raw: string | undefined | null): string {
  if (!raw) return '';
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!m) return s;
  const monthIdx = parseInt(m[2], 10) - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx < 0 || monthIdx > 11) return m[1];
  return `${months[monthIdx]} ${m[1]}`;
}

function buildCertifications(data: ResumeData, accent: string): Paragraph[] {
  if (!data.certifications?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Certifications', accent)];
  data.certifications.forEach((cert) => {
    const formattedDate = formatMonthYear(cert.date);
    // Cert name is the clickable element (with URL) — no separate "Verify" link.
    const titleChildren: any[] = [];
    if (cert.url) {
      titleChildren.push(
        new ExternalHyperlink({
          link: buildSiteUrl(cert.url),
          children: [new TextRun({ text: cert.name || '', bold: true, size: 20, color: accent, font: 'Calibri', style: 'Hyperlink' })],
        })
      );
    } else {
      titleChildren.push(new TextRun({ text: cert.name || '', bold: true, size: 20, color: ACCENT_COLOR, font: 'Calibri' }));
    }
    if (formattedDate) {
      titleChildren.push(new TextRun({ text: `\t${formattedDate}`, size: 18, color: MUTED_COLOR, font: 'Calibri' }));
    }
    paras.push(
      new Paragraph({
        spacing: { after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: titleChildren,
      })
    );
    // Issuer line (clean, no em-dash)
    const subChildren: any[] = [];
    if (cert.issuer) {
      subChildren.push(new TextRun({ text: cert.issuer, size: 18, color: MUTED_COLOR, font: 'Calibri' }));
    }
    if (cert.credentialId) {
      if (subChildren.length) subChildren.push(new TextRun({ text: '  ·  ', size: 18, color: MUTED_COLOR, font: 'Calibri' }));
      subChildren.push(new TextRun({ text: `ID ${cert.credentialId}`, size: 18, color: MUTED_COLOR, font: 'Calibri', italics: true }));
    }
    if (subChildren.length) {
      paras.push(new Paragraph({ spacing: { after: 60 }, children: subChildren }));
    }
  });
  return paras;
}

function buildLanguages(data: ResumeData, accent: string): Paragraph[] {
  if (!data.languages?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Languages', accent)];
  data.languages.forEach((lang) => {
    paras.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: lang.name || '', bold: true, size: 20, color: ACCENT_COLOR, font: 'Calibri' }),
          ...(lang.proficiency
            ? [new TextRun({ text: ` — ${lang.proficiency}`, size: 20, color: MUTED_COLOR, font: 'Calibri' })]
            : []),
        ],
      })
    );
  });
  return paras;
}

function buildVolunteer(data: ResumeData, accent: string): Paragraph[] {
  if (!data.volunteer?.length) return [];
  const paras: Paragraph[] = [sectionHeading('Volunteer Experience', accent)];
  data.volunteer.forEach((vol) => {
    paras.push(
      new Paragraph({
        spacing: { before: 100, after: 20 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: vol.role || '', bold: true, size: 22, color: ACCENT_COLOR, font: 'Calibri' }),
          new TextRun({
            text: `\t${formatDateRange(vol.startDate, vol.endDate, vol.current)}`,
            size: 18,
            color: MUTED_COLOR,
            font: 'Calibri',
          }),
        ],
      })
    );
    const sub = [vol.organization, vol.location].filter(Boolean).join(' | ');
    if (sub) {
      paras.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: sub, italics: true, size: 20, color: MUTED_COLOR, font: 'Calibri' })],
        })
      );
    }
    if (vol.description) {
      paras.push(
        new Paragraph({
          spacing: { after: 60, line: 280 },
          children: richTextRuns(vol.description, { size: 20, color: TEXT_COLOR, font: 'Calibri' }),
        })
      );
    }
  });
  return paras;
}

function buildCustomSections(data: ResumeData, accent: string): Paragraph[] {
  if (!data.customSections?.length) return [];
  const paras: Paragraph[] = [];
  data.customSections.forEach((section) => {
    paras.push(sectionHeading(section.title || 'Additional', accent));
    if (section.content) {
      const lines = String(section.content).split(/\r?\n/);
      lines.forEach((line) => {
        if (!line.trim()) return;
        paras.push(
          new Paragraph({
            spacing: { after: 60, line: 280 },
            children: richTextRuns(line, { size: 20, color: TEXT_COLOR, font: 'Calibri' }),
          })
        );
      });
    }
  });
  return paras;
}

function buildTwoColumnBody(resumeData: ResumeData, accent: string): Table {
  const leftChildren: Paragraph[] = [
    ...buildSkills(resumeData, accent),
    ...buildCertifications(resumeData, accent),
    ...buildEducation(resumeData, accent),
    ...buildLanguages(resumeData, accent),
    ...buildVolunteer(resumeData, accent),
  ];
  const rightChildren: Paragraph[] = [
    ...buildSummary(resumeData, accent),
    ...buildExperience(resumeData, accent),
    ...buildProjects(resumeData, accent),
    ...buildCustomSections(resumeData, accent),
  ];

  // Both cells need at least one paragraph
  if (leftChildren.length === 0) leftChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  if (rightChildren.length === 0) rightChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }));

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 100, left: 0, right: 200 },
            borders: cellBorders,
            children: leftChildren,
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 100, left: 200, right: 0 },
            borders: cellBorders,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

export class EnhancedDOCXService {
  static async generateDOCX(
    resumeData: ResumeData,
    templateId: string,
    customization: TemplateCustomization = DEFAULT_CUSTOMIZATION
  ): Promise<Buffer> {
    const accent = hexToDocx(customization?.primaryColor, ACCENT_COLOR);
    const resolved = resolveTemplateId(templateId);

    let children: (Paragraph | Table)[];
    if (resolved === 'modern-two-column') {
      children = [
        ...buildHeader(resumeData, accent),
        buildTwoColumnBody(resumeData, accent),
      ];
    } else {
      children = [
        ...buildHeader(resumeData, accent),
        ...buildSummary(resumeData, accent),
        ...buildExperience(resumeData, accent),
        ...buildProjects(resumeData, accent),
        ...buildSkills(resumeData, accent),
        ...buildEducation(resumeData, accent),
        ...buildCertifications(resumeData, accent),
        ...buildLanguages(resumeData, accent),
        ...buildVolunteer(resumeData, accent),
        ...buildCustomSections(resumeData, accent),
      ];
    }

    const doc = new Document({
      creator: 'JDsync',
      title: `${resumeData.personalInfo?.name || 'Resume'} - Resume`,
      description: 'Resume generated by JDsync',
      styles: {
        default: {
          document: { run: { font: 'Calibri', size: 22 } },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  static isValidDOCX(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;
    return (
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04
    );
  }

  static async generateDOCXFromHTML(_html: string): Promise<Buffer> {
    throw new Error('generateDOCXFromHTML is no longer supported. Use generateDOCX with ResumeData.');
  }
}
