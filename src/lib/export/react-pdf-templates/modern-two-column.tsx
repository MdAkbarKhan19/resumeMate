/**
 * Modern Two-Column PDF Template
 * - Light blue header banner with centered name/title/contacts
 * - Two-column body: left sidebar (skills, certs, education) + right main (summary, experience)
 * - Bold keywords in bullet points via **markers**
 * - Skills grouped by bold category name + comma-separated items
 * - Thin separator lines under section titles
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getFontSize, BulletPoint, RichText } from './base';

export default function ModernTwoColumnPDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const fs = getFontSize(customization?.fontSize);

  // Group ALL skills by category
  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Languages',
    tools: 'Automation Tools',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Contact items - plain text, no unicode icons
  const contactParts: string[] = [];
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.linkedin) {
    const raw = personalInfo.linkedin;
    contactParts.push(raw.replace(/^https?:\/\/(www\.)?/, '').replace(/^linkedin\.com\/in\//, '').replace(/\/$/, '') || raw);
  }
  if (personalInfo.github) {
    const raw = personalInfo.github;
    contactParts.push(raw.replace(/^https?:\/\/(www\.)?/, '').replace(/^github\.com\//, '').replace(/\/$/, '') || raw);
  }
  if (personalInfo.portfolio) {
    contactParts.push(personalInfo.portfolio.replace(/^https?:\/\//, ''));
  }
  if (personalInfo.location) {
    contactParts.push(personalInfo.location);
  }

  const PAGE_H_PAD = 32;
  const PAGE_V_PAD = 28;

  const styles = StyleSheet.create({
    /* Page padding applies to EVERY page including page 2+ */
    page: {
      fontFamily: 'Helvetica',
      color: '#222222',
      fontSize: fs.body,
      lineHeight: 1.4,
      paddingHorizontal: PAGE_H_PAD,
      paddingTop: PAGE_V_PAD,
      paddingBottom: PAGE_V_PAD,
    },

    /* Header uses negative margins to go full-width and flush-top on page 1 */
    headerBand: {
      backgroundColor: '#d5e5f0',
      paddingTop: 30,
      paddingBottom: 18,
      paddingHorizontal: 40,
      alignItems: 'center',
      marginHorizontal: -PAGE_H_PAD,
      marginTop: -PAGE_V_PAD,
    },
    headerName: {
      fontSize: fs.name + 2,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: fs.body,
      color: '#444444',
      marginBottom: 14,
    },
    contactText: {
      fontSize: fs.tiny,
      color: '#333333',
      textAlign: 'center',
    },

    /* Body - two column layout */
    body: {
      flexDirection: 'row',
      flex: 1,
      paddingTop: 14,
    },
    leftCol: {
      width: '35%',
      paddingRight: 14,
      borderRightWidth: 0.75,
      borderRightColor: '#dddddd',
    },
    rightCol: {
      width: '65%',
      paddingLeft: 16,
    },

    /* Section titles */
    sectionTitle: {
      fontSize: fs.title - 1,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 6,
      paddingBottom: 4,
      borderBottomWidth: 0.75,
      borderBottomColor: '#cccccc',
    },
    section: {
      marginBottom: 14,
    },

    /* Skills */
    skillCategory: {
      marginBottom: 4,
    },
    skillCatLabel: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.small,
      color: '#1a1a1a',
    },
    skillCatItems: {
      fontSize: fs.small,
      color: '#333333',
      lineHeight: 1.5,
    },

    /* Certifications */
    certItem: {
      fontSize: fs.small,
      color: '#333333',
      marginBottom: 3,
      lineHeight: 1.4,
    },

    /* Education */
    eduDegree: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.small,
      color: '#1a1a1a',
    },
    eduInstitution: {
      fontSize: fs.tiny,
      color: '#444444',
      marginBottom: 1,
    },
    eduDetails: {
      fontSize: fs.tiny,
      color: '#666666',
      marginBottom: 6,
    },

    /* Experience / Entry rows */
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
      width: '100%',
    },
    entryTitle: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.body,
      color: '#1a1a1a',
      flex: 1,
      paddingRight: 8,
    },
    entryDate: {
      fontSize: fs.tiny,
      color: '#444444',
      textAlign: 'right' as any,
      flexShrink: 0,
    },
    entrySubtitle: {
      fontSize: fs.small,
      color: '#444444',
      marginBottom: 4,
    },
    entry: {
      marginBottom: 12,
    },

    /* Languages */
    langItem: {
      fontSize: fs.small,
      color: '#333333',
      marginBottom: 2,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* ===== HEADER BAND (full width, no page margins) ===== */}
        <View style={styles.headerBand} fixed={false}>
          <Text style={styles.headerName}>
            {personalInfo.name || 'Your Name'}
          </Text>
          {personalInfo.title && (
            <Text style={styles.headerTitle}>{personalInfo.title}</Text>
          )}
          {contactParts.length > 0 && (
            <Text style={styles.contactText}>
              {contactParts.join('  |  ')}
            </Text>
          )}
        </View>

        {/* ===== BODY - Two Columns (with page-level padding for all pages) ===== */}
        <View style={styles.body}>
          {/* LEFT COLUMN */}
          <View style={styles.leftCol}>
            {/* Technical Skills */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Technical Skills</Text>
                {Object.entries(skillsByCategory).map(([category, items]) => (
                  <View key={category} style={styles.skillCategory}>
                    <Text style={styles.skillCatItems}>
                      <Text style={styles.skillCatLabel}>
                        {getCategoryLabel(category)}
                      </Text>
                      {': ' + items.join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <Text key={cert.id} style={styles.certItem}>
                    {cert.name}
                    {cert.issuer ? ` | ${cert.issuer}` : ''}
                  </Text>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={{ marginBottom: 6 }}>
                    <Text style={styles.eduDegree}>
                      {edu.degree}{edu.field ? ` ${edu.field}` : ''}
                    </Text>
                    <Text style={styles.eduInstitution}>
                      {edu.institution}
                    </Text>
                    <Text style={styles.eduDetails}>
                      {edu.location ? `${edu.location} | ` : ''}
                      {edu.graduationDate}
                      {edu.gpa ? `\nCGPA: ${edu.gpa}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang) => (
                  <Text key={lang.id} style={styles.langItem}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{lang.name}</Text>
                    {lang.proficiency ? (
                      <Text style={{ color: '#666666' }}>{`: ${lang.proficiency}`}</Text>
                    ) : null}
                  </Text>
                ))}
              </View>
            )}

            {/* Volunteer */}
            {volunteer.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Volunteer</Text>
                {volunteer.map((vol) => (
                  <View key={vol.id} style={{ marginBottom: 4 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: fs.small, color: '#1a1a1a' }}>
                      {vol.role}
                    </Text>
                    <Text style={{ fontSize: fs.tiny, color: '#444444' }}>
                      {vol.organization}
                    </Text>
                    {vol.description && (
                      <Text style={{ fontSize: fs.tiny, color: '#666666', marginTop: 1 }}>
                        {vol.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.rightCol}>
            {/* Profile Summary */}
            {summary ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Summary</Text>
                <RichText
                  text={summary}
                  fontSize={fs.small}
                  color="#333333"
                  lineHeight={1.55}
                  style={{ textAlign: 'justify' }}
                />
              </View>
            ) : null}

            {/* Work Experience */}
            {experience.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.entry}>
                    {/* Company + Date row (wrap=false so title+date stay together) */}
                    <View style={styles.entryRow} wrap={false}>
                      <Text style={styles.entryTitle}>{exp.company}</Text>
                      <Text style={styles.entryDate}>
                        {exp.startDate}
                        {exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                      </Text>
                    </View>
                    {/* Job Title */}
                    <Text style={styles.entrySubtitle}>
                      {exp.jobTitle}
                      {exp.location ? `  |  ${exp.location}` : ''}
                    </Text>
                    {/* Bullets - can wrap across pages naturally */}
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <BulletPoint
                        key={i}
                        text={bullet}
                        fontSize={fs.small}
                        color="#333333"
                        boldColor="#1a1a1a"
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
                <Text style={styles.sectionTitle}>Projects</Text>
                {projects.map((proj) => (
                  <View key={proj.id} style={styles.entry}>
                    {/* Project Name + Date row */}
                    <View style={styles.entryRow} wrap={false}>
                      <Text style={styles.entryTitle}>{proj.name}</Text>
                      {(proj.startDate || proj.endDate) && (
                        <Text style={styles.entryDate}>
                          {proj.startDate}{proj.endDate ? ` - ${proj.endDate}` : ''}
                        </Text>
                      )}
                    </View>
                    {/* Description - flows naturally, no wrap={false} */}
                    <RichText
                      text={proj.description}
                      fontSize={fs.small}
                      color="#333333"
                      lineHeight={1.5}
                      style={{ marginBottom: 2, textAlign: 'justify' }}
                    />
                    {proj.techStack.length > 0 && (
                      <Text style={{ fontSize: fs.tiny, color: '#666666', marginTop: 2 }}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', color: '#444444' }}>Tech: </Text>
                        {proj.techStack.join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
