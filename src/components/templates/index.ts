import { Template } from '@/types';
import ModernTwoColumnTemplate from './ModernTwoColumn';
import MinimalistTemplate from './MinimalistTemplate';

// Aliases keep old saved templateIds rendering the closest supported template
// rather than silently falling back to Minimalist.
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

export const templates = {
  'modern-two-column': ModernTwoColumnTemplate,
  'minimalist': MinimalistTemplate,
} as const;

export function resolveTemplateId(templateId: string): 'modern-two-column' | 'minimalist' {
  return TEMPLATE_ALIASES[templateId] || 'minimalist';
}

export function getTemplateComponent(templateId: string) {
  return templates[resolveTemplateId(templateId)];
}

export const templateMetadata: Record<string, Omit<Template, 'htmlTemplate' | 'cssStyles'>> = {
  'modern-two-column': {
    id: 'modern-two-column',
    name: 'Modern Two-Column',
    description: 'A visually engaging template with a splash of color and two-column layout',
    category: 'MODERN',
    thumbnail: '/templates/modern-two-column.svg',
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
    thumbnail: '/templates/minimalist.svg',
    isActive: true,
    isPremium: false,
    usageCount: 0,
    rating: 4.9,
  },
};
