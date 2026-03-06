/**
 * React-PDF Base Styles and Shared Components
 * Common typography, spacing, and helper components used by all PDF templates
 */

import React from 'react';
import { StyleSheet, Text, View, Link } from '@react-pdf/renderer';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';

// ==========================================
// Shared types
// ==========================================

export interface PDFTemplateProps {
  data: ResumeData;
  customization?: TemplateCustomization;
}

// ==========================================
// Spacing helpers
// ==========================================

export function getSpacing(spacing?: 'compact' | 'normal' | 'spacious') {
  switch (spacing) {
    case 'compact':
      return { section: 8, item: 4, page: 24 };
    case 'spacious':
      return { section: 16, item: 8, page: 40 };
    default:
      return { section: 12, item: 6, page: 32 };
  }
}

export function getFontSize(base?: number) {
  const size = base || 11;
  return {
    name: size + 10,    // ~21pt
    title: size + 2,     // ~13pt
    sectionHeader: size + 1, // ~12pt
    body: size,          // ~11pt
    small: size - 1,     // ~10pt
    tiny: size - 2,      // ~9pt
  };
}

// ==========================================
// Hex color utilities
// ==========================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

export function hexWithOpacity(hex: string, opacity: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ==========================================
// Rich Text Parser (supports **bold** markers)
// ==========================================

/**
 * Parses text with **bold** markers into an array of segments.
 * Example: "Used **React** and **Node.js** for development"
 * → [{ text: "Used ", bold: false }, { text: "React", bold: true }, ...]
 */
function parseRichText(text: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add non-bold text before the match
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    // Add bold text
    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining non-bold text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  // If no markers were found, return the whole text as plain
  if (parts.length === 0) {
    parts.push({ text, bold: false });
  }

  return parts;
}

/**
 * RichText component that renders text with **bold** markers.
 * Use this for bullet points and any text that may contain bold keywords.
 */
export function RichText({
  text,
  fontSize,
  color,
  boldColor,
  fontFamily,
  boldFontFamily,
  lineHeight,
  style,
}: {
  text: string;
  fontSize?: number;
  color?: string;
  boldColor?: string;
  fontFamily?: string;
  boldFontFamily?: string;
  lineHeight?: number;
  style?: any;
}) {
  const size = fontSize || 10;
  const textColor = color || '#374151';
  const bColor = boldColor || '#111827';
  const font = fontFamily || 'Helvetica';
  const boldFont = boldFontFamily || 'Helvetica-Bold';

  const parts = parseRichText(text);

  // If no bold markers found, render as simple Text (more efficient)
  if (parts.length === 1 && !parts[0].bold) {
    return (
      <Text style={[{ fontSize: size, color: textColor, fontFamily: font, lineHeight: lineHeight || 1.45 }, style]}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={[{ fontSize: size, color: textColor, fontFamily: font, lineHeight: lineHeight || 1.45 }, style]}>
      {parts.map((part, i) =>
        part.bold ? (
          <Text key={i} style={{ fontFamily: boldFont, color: bColor }}>
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
    </Text>
  );
}

// ==========================================
// Shared Components
// ==========================================

export function SectionTitle({ title, color, fontSize }: { title: string; color?: string; fontSize?: number }) {
  return (
    <Text
      style={{
        fontSize: fontSize || 12,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
        color: color || '#111827',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        paddingBottom: 3,
        borderBottomWidth: 0.75,
        borderBottomColor: color || '#d1d5db',
      }}
    >
      {title}
    </Text>
  );
}

export function ContactInfo({
  personalInfo,
  color,
  fontSize,
  separator = ' | ',
}: {
  personalInfo: ResumeData['personalInfo'];
  color?: string;
  fontSize?: number;
  separator?: string;
}) {
  const items: string[] = [];
  if (personalInfo.email) items.push(personalInfo.email);
  if (personalInfo.phone) items.push(personalInfo.phone);
  if (personalInfo.location) items.push(personalInfo.location);
  if (personalInfo.linkedin) items.push(personalInfo.linkedin);
  if (personalInfo.github) items.push(personalInfo.github);
  if (personalInfo.portfolio) items.push(personalInfo.portfolio);

  return (
    <Text style={{ fontSize: fontSize || 9, color: color || '#6b7280' }}>
      {items.join(separator)}
    </Text>
  );
}

/**
 * BulletPoint with rich text support for **bold** keywords.
 */
export function BulletPoint({
  text,
  fontSize,
  color,
  boldColor,
  bulletChar,
  bulletColor,
  fontFamily,
  boldFontFamily,
  lineHeight,
}: {
  text: string;
  fontSize?: number;
  color?: string;
  boldColor?: string;
  bulletChar?: string;
  bulletColor?: string;
  fontFamily?: string;
  boldFontFamily?: string;
  lineHeight?: number;
}) {
  const size = fontSize || 10;
  const textColor = color || '#374151';
  const dotColor = bulletColor || textColor;
  const dot = bulletChar || '•';
  const lh = lineHeight || 1.45;

  return (
    <View style={{ flexDirection: 'row', marginBottom: 2.5, paddingLeft: 2 }}>
      <Text style={{ fontSize: size, color: dotColor, marginRight: 5, width: 8, lineHeight: lh, fontFamily: fontFamily || 'Helvetica' }}>
        {dot}
      </Text>
      <RichText
        text={text}
        fontSize={size}
        color={textColor}
        boldColor={boldColor}
        fontFamily={fontFamily}
        boldFontFamily={boldFontFamily}
        lineHeight={lh}
        style={{ flex: 1 }}
      />
    </View>
  );
}

export function DateRange({
  startDate,
  endDate,
  current,
  fontSize,
  color,
}: {
  startDate?: string;
  endDate?: string;
  current?: boolean;
  fontSize?: number;
  color?: string;
}) {
  let dateText = '';
  if (startDate) {
    dateText = startDate;
    if (current) {
      dateText += ' - Present';
    } else if (endDate) {
      dateText += ` - ${endDate}`;
    }
  } else if (endDate) {
    dateText = endDate;
  }

  if (!dateText) return null;

  return (
    <Text style={{ fontSize: fontSize || 9, color: color || '#9ca3af' }}>
      {dateText}
    </Text>
  );
}

export function SkillTags({
  skills,
  accentColor,
  fontSize,
}: {
  skills: ResumeData['skills'];
  accentColor?: string;
  fontSize?: number;
}) {
  const color = accentColor || '#2563eb';
  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const labels: Record<string, string> = {
    technical: 'Technical',
    soft: 'Soft Skills',
    language: 'Languages',
    tools: 'Tools',
  };

  return (
    <View>
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
          <Text style={{ fontSize: (fontSize || 9) + 0.5, fontFamily: 'Helvetica-Bold', color: '#6b7280', minWidth: 70, marginRight: 4 }}>
            {labels[category] || category}:
          </Text>
          <Text style={{ fontSize: fontSize || 9, color: '#374151', flex: 1 }}>
            {items.join(', ')}
          </Text>
        </View>
      ))}
    </View>
  );
}
