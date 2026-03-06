/**
 * Tech Modern PDF Template
 * Clean modern design with left accent bar, skill tags, monospace dates
 * Ideal for tech/developer roles
 * Supports **bold** keyword markers in bullet points via RichText/BulletPoint
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, hexWithOpacity, BulletPoint, RichText } from './base';

export default function TechModernPDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize);
  const accent = customization?.primaryColor || '#2563eb';

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      color: '#1f2937',
      fontSize: fs.body,
      lineHeight: 1.45,
    },
    headerContainer: {
      flexDirection: 'row',
      borderBottomWidth: 3,
      borderBottomColor: accent,
    },
    accentBar: {
      width: 4,
      backgroundColor: accent,
    },
    headerContent: {
      flex: 1,
      padding: '18 32 14 24',
    },
    name: {
      fontSize: fs.name + 2,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 3,
    },
    headerTitle: {
      fontSize: fs.title,
      color: accent,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    contactItem: {
      fontSize: fs.tiny,
      color: '#6b7280',
      marginRight: 12,
    },
    contactAccent: {
      fontSize: fs.tiny,
      color: accent,
      fontFamily: 'Helvetica-Bold',
      marginRight: 12,
    },
    body: {
      padding: '12 32 20 24',
    },
    section: {
      marginBottom: spacing.section + 2,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionAccent: {
      width: 3,
      height: 14,
      backgroundColor: accent,
      borderRadius: 1,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: fs.sectionHeader,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 1,
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
      fontFamily: 'Courier',
    },
    entry: {
      marginBottom: 10,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: '#e5e7eb',
    },
    skillRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    skillCatLabel: {
      fontSize: fs.small,
      fontFamily: 'Helvetica-Bold',
      color: '#6b7280',
      minWidth: 110,
      marginRight: 6,
    },
    skillTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flex: 1,
    },
    skillTag: {
      fontSize: fs.tiny,
      color: '#1f2937',
      backgroundColor: hexWithOpacity(accent, 0.08),
      borderWidth: 0.5,
      borderColor: hexWithOpacity(accent, 0.2),
      borderRadius: 3,
      padding: '2 8',
      marginRight: 4,
      marginBottom: 3,
    },
    techTag: {
      fontSize: 7.5,
      color: '#4b5563',
      backgroundColor: '#f3f4f6',
      borderRadius: 2,
      padding: '1 5',
      marginRight: 3,
      marginBottom: 2,
    },
    twoColumn: {
      flexDirection: 'row',
      gap: 16,
    },
    column: {
      flex: 1,
    },
  });

  const categoryLabels: Record<string, string> = {
    technical: 'Languages & Frameworks',
    tools: 'Tools & Platforms',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with accent bar */}
        <View style={styles.headerContainer}>
          <View style={styles.accentBar} />
          <View style={styles.headerContent}>
            <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
            {personalInfo.title && <Text style={styles.headerTitle}>{personalInfo.title}</Text>}
            <View style={styles.contactRow}>
              {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
              {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
              {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
              {personalInfo.github && <Text style={styles.contactAccent}>{personalInfo.github}</Text>}
              {personalInfo.linkedin && <Text style={styles.contactItem}>{personalInfo.linkedin}</Text>}
              {personalInfo.portfolio && <Text style={styles.contactAccent}>{personalInfo.portfolio}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Summary */}
          {summary ? (
            <View style={styles.section}>
              <RichText
                text={summary}
                fontSize={fs.body}
                color="#374151"
                lineHeight={1.55}
              />
            </View>
          ) : null}

          {/* Skills - Tag style */}
          {skills.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Technical Skills</Text>
              </View>
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <View key={category} style={styles.skillRow}>
                  <Text style={styles.skillCatLabel}>{categoryLabels[category] || category}:</Text>
                  <View style={styles.skillTagsContainer}>
                    {items.map((item, i) => (
                      <Text key={i} style={styles.skillTag}>{item}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Experience */}
          {experience.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
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
                      bulletChar="›"
                      bulletColor={accent}
                      lineHeight={1.5}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {/* Projects */}
          {projects.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Projects</Text>
              </View>
              {projects.map((proj) => (
                <View key={proj.id} style={styles.entry}>
                  <View wrap={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.bold}>{proj.name}</Text>
                      {proj.url && <Text style={{ fontSize: fs.tiny, color: accent }}>{proj.url}</Text>}
                    </View>
                    <RichText
                      text={proj.description}
                      fontSize={fs.small}
                      color="#4b5563"
                      lineHeight={1.5}
                      style={{ marginBottom: 3 }}
                    />
                  </View>
                  {proj.techStack.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {proj.techStack.map((tech, i) => (
                        <Text key={i} style={styles.techTag}>{tech}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {/* Education */}
          {education.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              {education.map((edu) => (
                <View key={edu.id} style={{ marginBottom: 4, paddingLeft: 10 }} wrap={false}>
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

          {/* Certifications + Languages */}
          {(certifications.length > 0 || languages.length > 0) ? (
            <View style={styles.twoColumn}>
              {certifications.length > 0 ? (
                <View style={styles.column}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>Certifications</Text>
                  </View>
                  {certifications.map((cert) => (
                    <Text key={cert.id} style={{ fontSize: fs.small, paddingLeft: 10, marginBottom: 2 }}>
                      <Text style={{ fontFamily: 'Helvetica-Bold' }}>{cert.name}</Text> - {cert.issuer}
                    </Text>
                  ))}
                </View>
              ) : null}
              {languages.length > 0 ? (
                <View style={styles.column}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionAccent} />
                    <Text style={styles.sectionTitle}>Languages</Text>
                  </View>
                  {languages.map((lang) => (
                    <Text key={lang.id} style={{ fontSize: fs.small, paddingLeft: 10, marginBottom: 2 }}>
                      {lang.name}{lang.proficiency ? ` - ${lang.proficiency}` : ''}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Volunteer */}
          {volunteer.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Volunteer</Text>
              </View>
              {volunteer.map((vol) => (
                <Text key={vol.id} style={{ fontSize: fs.small, paddingLeft: 10, marginBottom: 2 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{vol.role}</Text> at {vol.organization}
                  {vol.description ? ` - ${vol.description}` : ''}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
