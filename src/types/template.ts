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
    thumbnail: '/templates/modern-two-column.png',
    category: 'modern',
    atsCompliant: true,
    columns: 2,
    colorful: true,
  },
  'minimalist-single': {
    id: 'minimalist-single',
    name: 'Minimalist Single-Column',
    description: 'Clean, simple design focused on content. Ideal for any industry.',
    thumbnail: '/templates/minimalist-single.png',
    category: 'minimal',
    atsCompliant: true,
    columns: 1,
    colorful: false,
  },
  'professional-corporate': {
    id: 'professional-corporate',
    name: 'Professional Corporate',
    description: 'Traditional corporate format with subtle styling. Great for formal industries.',
    thumbnail: '/templates/professional-corporate.png',
    category: 'professional',
    atsCompliant: true,
    columns: 1,
    colorful: false,
  },
  'creative-ats': {
    id: 'creative-ats',
    name: 'Creative ATS-Optimized',
    description: 'Design-forward with colorful accents while maintaining ATS readability.',
    thumbnail: '/templates/creative-ats.png',
    category: 'creative',
    atsCompliant: true,
    columns: 1,
    colorful: true,
  },
};

export const DEFAULT_CUSTOMIZATION: TemplateCustomization = {
  primaryColor: '#3B82F6',
  accentColor: '#60A5FA',
  fontFamily: 'Inter',
  fontSize: 11,
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
