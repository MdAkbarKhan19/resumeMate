/**
 * Executive PDF Template
 * Dark header, elegant serif typography, ideal for senior/executive roles
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, hexWithOpacity, BulletPoint, RichText } from './base';

export default function ExecutivePDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize);
  const accent = customization?.primaryColor || '#1e3a5f';

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Times-Roman',
      color: '#1f2937',
      fontSize: fs.body,
      lineHeight: 1.45,
    },
    header: {
      backgroundColor: '#1e293b',
      padding: '20 32 16 32',
      marginBottom: 14,
    },
    name: {
      fontSize: fs.name + 4,
      fontFamily: 'Times-Bold',
      color: '#ffffff',
      marginBottom: 3,
      letterSpacing: 1,
    },
    headerTitle: {
      fontSize: fs.title,
      color: '#94a3b8',
      fontFamily: 'Times-Italic',
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    contactItem: {
      fontSize: fs.tiny,
      color: '#cbd5e1',
      marginRight: 12,
    },
    body: {
      padding: '0 32',
    },
    section: {
      marginBottom: spacing.section,
    },
    sectionTitle: {
      fontSize: fs.sectionHeader,
      fontFamily: 'Times-Bold',
      color: '#1e293b',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1.5,
      borderBottomColor: '#1e293b',
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    bold: {
      fontFamily: 'Times-Bold',
      fontSize: fs.body,
      color: '#111827',
    },
    company: {
      fontSize: fs.small,
      fontFamily: 'Times-Italic',
      color: '#6b7280',
      marginBottom: 4,
    },
    date: {
      fontSize: fs.tiny,
      color: '#6b7280',
    },
    bodyText: {
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
      color: '#1e293b',
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
    twoColumn: {
      flexDirection: 'row',
      gap: 20,
    },
    column: {
      flex: 1,
    },
    skillCategory: {
      fontFamily: 'Times-Bold',
      fontSize: fs.small,
      color: '#1e293b',
      marginBottom: 2,
    },
    skillItems: {
      fontSize: fs.small,
      color: '#374151',
      marginBottom: 4,
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
    technical: 'Technical Skills',
    soft: 'Leadership & Soft Skills',
    language: 'Languages',
    tools: 'Tools & Platforms',
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Dark Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
          {personalInfo.title && <Text style={styles.headerTitle}>{personalInfo.title}</Text>}
          <View style={styles.contactRow}>
            {contactItems.map((item, i) => (
              <Text key={i} style={styles.contactItem}>{item}</Text>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {/* Summary */}
          {summary ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Executive Summary</Text>
              <RichText text={summary} fontSize={fs.body} color="#374151" fontFamily="Times-Roman" boldFontFamily="Times-Bold" lineHeight={1.5} style={{ textAlign: 'justify' }} />
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
                      bulletChar="■"
                      bulletColor="#1e293b"
                      fontFamily="Times-Roman"
                      boldFontFamily="Times-Bold"
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
              <Text style={styles.sectionTitle}>Core Competencies</Text>
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 4 }}>
                  <Text style={styles.skillCategory}>{categoryLabels[category] || category}</Text>
                  <Text style={styles.skillItems}>{items.join('  •  ')}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Projects */}
          {projects.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Projects</Text>
              {projects.map((proj) => (
                <View key={proj.id} style={styles.entry}>
                  <View wrap={false}>
                    <Text style={styles.bold}>{proj.name}</Text>
                    <RichText text={proj.description} fontSize={fs.body} color="#374151" fontFamily="Times-Roman" boldFontFamily="Times-Bold" lineHeight={1.5} />
                  </View>
                  {proj.techStack.length > 0 && (
                    <Text style={{ fontSize: fs.tiny, fontFamily: 'Times-Italic', color: '#6b7280' }}>
                      Technologies: {proj.techStack.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {/* Certifications + Languages side by side */}
          {(certifications.length > 0 || languages.length > 0) ? (
            <View style={styles.twoColumn}>
              {certifications.length > 0 ? (
                <View style={styles.column}>
                  <Text style={styles.sectionTitle}>Certifications</Text>
                  {certifications.map((cert) => (
                    <View key={cert.id} style={{ marginBottom: 3 }} wrap={false}>
                      <Text style={styles.bodyText}>
                        <Text style={styles.bold}>{cert.name}</Text> - {cert.issuer}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {languages.length > 0 ? (
                <View style={styles.column}>
                  <Text style={styles.sectionTitle}>Languages</Text>
                  {languages.map((lang) => (
                    <Text key={lang.id} style={{ fontSize: fs.small, marginBottom: 2 }}>
                      {lang.name}{lang.proficiency ? ` - ${lang.proficiency}` : ''}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Volunteer */}
          {volunteer.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Community Involvement</Text>
              {volunteer.map((vol) => (
                <View key={vol.id} style={styles.entry} wrap={false}>
                  <Text style={styles.bold}>{vol.role} at {vol.organization}</Text>
                  {vol.description ? <Text style={styles.bodyText}>{vol.description}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
