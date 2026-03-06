/**
 * Professional PDF Template
 * Traditional corporate format with subtle accent colors and clean section dividers
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, hexWithOpacity, BulletPoint, RichText } from './base';

export default function ProfessionalPDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize);
  const accent = customization?.primaryColor || '#1e40af';

  const styles = StyleSheet.create({
    page: {
      padding: 32,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      fontSize: fs.body,
      lineHeight: 1.45,
    },
    header: {
      borderBottomWidth: 2,
      borderBottomColor: accent,
      paddingBottom: 10,
      marginBottom: 14,
    },
    name: {
      fontSize: fs.name,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      marginBottom: 3,
    },
    title: {
      fontSize: fs.title,
      color: '#4b5563',
      marginBottom: 6,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    contactItem: {
      fontSize: fs.tiny,
      color: '#6b7280',
      marginRight: 10,
    },
    section: {
      marginBottom: spacing.section,
    },
    sectionTitle: {
      fontSize: fs.sectionHeader,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: hexWithOpacity(accent, 0.3),
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    bold: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.body,
      color: '#111827',
    },
    company: {
      fontSize: fs.small,
      color: '#6b7280',
      marginBottom: 4,
    },
    date: {
      fontSize: fs.tiny,
      color: '#9ca3af',
    },
    body: {
      fontSize: fs.body,
      color: '#374151',
      lineHeight: 1.5,
      marginBottom: 4,
    },
    bullet: {
      flexDirection: 'row',
      marginBottom: 2,
      paddingLeft: 8,
    },
    bulletDot: {
      fontSize: fs.small,
      color: accent,
      marginRight: 6,
      width: 8,
    },
    bulletText: {
      fontSize: fs.small,
      color: '#374151',
      flex: 1,
      lineHeight: 1.45,
    },
    entry: {
      marginBottom: 8,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 3,
    },
    skillCategory: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.small,
      color: '#4b5563',
      minWidth: 100,
      marginRight: 6,
    },
    skillItems: {
      fontSize: fs.small,
      color: '#374151',
      flex: 1,
    },
  });

  const contactItems: string[] = [];
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.location) contactItems.push(personalInfo.location);
  if (personalInfo.linkedin) contactItems.push(personalInfo.linkedin);
  if (personalInfo.github) contactItems.push(personalInfo.github);
  if (personalInfo.portfolio) contactItems.push(personalInfo.portfolio);

  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    soft: 'Soft Skills',
    language: 'Languages',
    tools: 'Tools',
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
          {personalInfo.title && <Text style={styles.title}>{personalInfo.title}</Text>}
          <View style={styles.contactRow}>
            {contactItems.map((item, i) => (
              <Text key={i} style={styles.contactItem}>{item}</Text>
            ))}
          </View>
        </View>

        {/* Summary */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <RichText text={summary} fontSize={fs.body} color="#374151" lineHeight={1.5} style={{ textAlign: 'justify' }} />
          </View>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry}>
                <View wrap={false}>
                  <View style={styles.entryRow}>
                    <Text style={styles.bold}>{exp.jobTitle}</Text>
                    <Text style={styles.date}>
                      {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                    </Text>
                  </View>
                  <Text style={styles.company}>
                    {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                  </Text>
                </View>
                {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                  <BulletPoint
                    key={i}
                    text={bullet}
                    fontSize={fs.small}
                    color="#374151"
                    boldColor="#111827"
                    bulletChar="▸"
                    bulletColor={accent}
                    lineHeight={1.5}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entry} wrap={false}>
                <View style={styles.entryRow}>
                  <Text style={styles.bold}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</Text>
                  <Text style={styles.date}>{edu.graduationDate}</Text>
                </View>
                <Text style={styles.company}>
                  {edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {Object.entries(skillsByCategory).map(([category, items]) => (
              <View key={category} style={styles.skillsRow}>
                <Text style={styles.skillCategory}>{categoryLabels[category] || category}:</Text>
                <Text style={styles.skillItems}>{items.join(', ')}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.entry}>
                <View wrap={false}>
                  <Text style={styles.bold}>{proj.name}</Text>
                  <RichText text={proj.description} fontSize={fs.small} color="#374151" lineHeight={1.5} />
                </View>
                {proj.techStack.length > 0 && (
                  <Text style={{ fontSize: fs.tiny, color: '#6b7280' }}>
                    Tech: {proj.techStack.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={{ marginBottom: 3 }} wrap={false}>
                <Text style={styles.body}>
                  <Text style={styles.bold}>{cert.name}</Text> - {cert.issuer}
                  {cert.date ? ` (${cert.date})` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Languages + Volunteer */}
        {languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.body}>
              {languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
            </Text>
          </View>
        ) : null}

        {volunteer.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volunteer Experience</Text>
            {volunteer.map((vol) => (
              <View key={vol.id} style={styles.entry} wrap={false}>
                <Text style={styles.bold}>{vol.role} at {vol.organization}</Text>
                {vol.description ? <Text style={styles.body}>{vol.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
