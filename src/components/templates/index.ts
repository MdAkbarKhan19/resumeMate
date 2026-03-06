import { ResumeData, Template } from '@/types';
import ModernTwoColumnTemplate from './ModernTwoColumn';
import MinimalistTemplate from './MinimalistTemplate';
import ProfessionalTemplate from './ProfessionalTemplate';
import ATSClassicTemplate from './ATSClassicTemplate';
import ExecutiveTemplate from './ExecutiveTemplate';
import TechModernTemplate from './TechModernTemplate';

export const templates = {
  'modern-two-column': ModernTwoColumnTemplate,
  'minimalist': MinimalistTemplate,
  'professional': ProfessionalTemplate,
  'ats-classic': ATSClassicTemplate,
  'executive': ExecutiveTemplate,
  'tech-modern': TechModernTemplate,
};

export function getTemplateComponent(templateId: string) {
  return templates[templateId as keyof typeof templates] || MinimalistTemplate;
}

export const templateMetadata: Record<string, Omit<Template, 'htmlTemplate' | 'cssStyles'>> = {
  'modern-two-column': {
    id: 'modern-two-column',
    name: 'Modern Two-Column',
    description: 'A visually engaging template with a splash of color and two-column layout',
    category: 'MODERN',
    thumbnail: '/templates/modern-two-column.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.8,
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist Single-Column',
    description: 'A simple, elegant design with black-and-white color scheme',
    category: 'MINIMALIST',
    thumbnail: '/templates/minimalist.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.9,
  },
  'professional': {
    id: 'professional',
    name: 'Professional Corporate',
    description: 'A traditional look with clear section separators',
    category: 'PROFESSIONAL',
    thumbnail: '/templates/professional.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.7,
  },
  'ats-classic': {
    id: 'ats-classic',
    name: 'ATS Classic',
    description: 'Maximum ATS compatibility - single column, standard fonts, no colors. Passes all automated screening systems.',
    category: 'PROFESSIONAL',
    thumbnail: '/templates/ats-classic.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.9,
  },
  'executive': {
    id: 'executive',
    name: 'Executive',
    description: 'Professional dark header with elegant serif typography. Ideal for senior and executive-level positions.',
    category: 'PROFESSIONAL',
    thumbnail: '/templates/executive.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.8,
  },
  'tech-modern': {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Clean modern design with accent bar and skill tags. Perfect for software engineers and tech professionals.',
    category: 'MODERN',
    thumbnail: '/templates/tech-modern.png',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.8,
  },
};
