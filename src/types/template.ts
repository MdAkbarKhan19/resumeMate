import { ResumeData } from './resume';

export interface TemplateCustomization {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: 'Inter' | 'Roboto' | 'Georgia' | 'Arial';
  fontSize?: number;
  spacing?: 'compact' | 'normal' | 'spacious';
  sectionOrder?: string[];
}

export interface TemplateProps {
  data: ResumeData;
  customization?: TemplateCustomization;
  preview?: boolean; // true = web preview, false = PDF export
  /**
   * When true the template renders the `rm-watermark-host` class on its
   * root, which causes the watermark CSS injected by the PDF generator
   * to draw a tiled overlay across the whole page. Used for free-tier
   * downloads — paid downloads pass `false` (the default).
   */
  watermark?: boolean;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'modern' | 'minimal' | 'professional' | 'creative';
  atsCompliant: boolean;
  columns: 1 | 2;
  colorful: boolean;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  'modern-two-column': {
    id: 'modern-two-column',
    name: 'Modern Two-Column',
    description: 'Eye-catching design with colored header and sidebar. Perfect for creative professionals.',
    thumbnail: '/templates/modern-two-column.svg',
    category: 'modern',
    atsCompliant: true,
    columns: 2,
    colorful: true,
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist Single-Column',
    description: 'Clean, simple design focused on content. Ideal for any industry.',
    thumbnail: '/templates/minimalist.svg',
    category: 'minimal',
    atsCompliant: true,
    columns: 1,
    colorful: false,
  },
};

export const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  primaryColor: '#3B82F6',
  accentColor: '#60A5FA',
  fontFamily: 'Inter',
  // fontSize intentionally omitted — defaults to auto-fit based on content
  // density. The slider in the customization panel writes a number here only
  // when the user explicitly overrides.
  spacing: 'normal',
};

// Helper to get spacing values
export function getSpacingValues(spacing: 'compact' | 'normal' | 'spacious' = 'normal') {
  const spacingMap = {
    compact: { marginX: 32, marginY: 32, fontSize: 10 },
    normal: { marginX: 48, marginY: 48, fontSize: 11 },
    spacious: { marginX: 64, marginY: 64, fontSize: 12 },
  };
  return spacingMap[spacing];
}

/**
 * Estimate content density and return the ideal base font size in pt so the
 * resume fills one page nicely without overflowing.
 *
 * Signal: total word count across all dynamic content (summary, bullets,
 * project descriptions, custom sections). Education/skills/cert *headers*
 * are roughly constant per item so they're not double-counted.
 *
 * Thresholds tuned to standard US Letter, 0.75" margins, one-page resume:
 *   <  250 words  → 12pt  (sparse — junior / first-job resumes)
 *   250–450       → 11pt  (normal)
 *   450–650       → 10.5pt (busy mid-career)
 *   650–900       → 10pt  (dense senior)
 *   >  900 words  → 9.5pt  (very dense — try to fit one page)
 */
export function computeAutoFitFontSize(data?: any): number {
  if (!data || typeof data !== 'object') return 11;

  const wordsIn = (s: any): number => {
    if (typeof s !== 'string') return 0;
    return s.trim().split(/\s+/).filter(Boolean).length;
  };

  let words = 0;
  words += wordsIn(data.summary);

  if (Array.isArray(data.experience)) {
    data.experience.forEach((exp: any) => {
      (exp?.bullets || exp?.achievements || []).forEach((b: any) => { words += wordsIn(b); });
      words += wordsIn(exp?.description);
    });
  }

  if (Array.isArray(data.projects)) {
    data.projects.forEach((p: any) => { words += wordsIn(p?.description); });
  }

  if (Array.isArray(data.volunteer)) {
    data.volunteer.forEach((v: any) => { words += wordsIn(v?.description); });
  }

  if (Array.isArray(data.customSections)) {
    data.customSections.forEach((s: any) => { words += wordsIn(s?.content); });
  }

  // Also count item *headers* coarsely — a resume with 8 jobs and short bullets
  // still has a lot of vertical space taken by titles/companies/dates.
  const itemHeaders =
    (data.experience?.length || 0) * 8 +     // ~8 words per role header line
    (data.education?.length || 0) * 6 +
    (data.projects?.length || 0) * 6 +
    (data.certifications?.length || 0) * 4 +
    (data.volunteer?.length || 0) * 6;
  words += itemHeaders;

  if (words < 250) return 12;
  if (words < 450) return 11;
  if (words < 650) return 10.5;
  if (words < 900) return 10;
  return 9.5;
}

/**
 * Resolve the effective base font size (in pt).
 *   1. If customization.fontSize is explicitly set → use it (manual override).
 *   2. Else if `data` is supplied → compute auto-fit from content density.
 *   3. Else → fall back to the spacing preset's fontSize.
 * Clamped to 9–14pt so the user can't break the one-page layout.
 *
 * Templates should derive every other text size *relative* to this base so
 * the whole resume scales proportionally when the value changes.
 */
export function getBaseFontSize(customization?: TemplateCustomization, data?: any): number {
  const fromCustom = typeof customization?.fontSize === 'number' ? customization.fontSize : undefined;
  const fromAuto = data != null ? computeAutoFitFontSize(data) : undefined;
  const fromSpacing = getSpacingValues(customization?.spacing).fontSize;
  const raw = fromCustom ?? fromAuto ?? fromSpacing;
  return Math.min(14, Math.max(9, raw));
}

// Helper to convert hex color to rgba with opacity
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Helper to get color scheme
export function getColorScheme(primaryColor: string = '#3B82F6') {
  return {
    primary: primaryColor,
    primary10: hexToRgba(primaryColor, 0.1),
    primary20: hexToRgba(primaryColor, 0.2),
    text: '#1F2937', // gray-800
    textSecondary: '#4B5563', // gray-600
  };
}
