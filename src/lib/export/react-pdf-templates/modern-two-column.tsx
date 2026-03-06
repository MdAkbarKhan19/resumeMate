/**
 * Modern Two-Column PDF Template
 * Inspired by clean professional design with:
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
  const accent = customization?.primaryColor || '#B8D4E8';

  // Separate technical skills from soft skills
  const techSkills = skills.filter(s => !s.category || s.category === 'technical');
  const softSkills = skills.filter(s => s.category === 'soft');

  // Group tech skills by sub-category
  const techByCategory = techSkills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    tools: 'Tools & Platforms',
  };

  // Contact items
  const contactItems: string[] = [];
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.linkedin) {
    contactItems.push(personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, ''));
  }
  if (personalInfo.github) {
    contactItems.push(personalInfo.github.replace(/^https?:\/\/(www\.)?/, ''));
  }
  if (personalInfo.portfolio) {
    contactItems.push(personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ''));
  }

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      color: '#222222',
      fontSize: fs.body,
      lineHeight: 1.4,
    },

    // ---- HEADER ----
    headerBand: {
      backgroundColor: accent,
      paddingTop: 32,
      paddingBottom: 18,
      paddingHorizontal: 36,
      alignItems: 'center',
    },
    headerName: {
      fontSize: fs.name + 4,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      letterSpacing: 2,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: fs.body,
      color: '#333333',
      marginBottom: 12,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactItem: {
      fontSize: fs.tiny,
      color: '#333333',
    },
    contactSep: {
      fontSize: fs.tiny,
      color: '#666666',
      marginHorizontal: 6,
    },

    // ---- BODY (two columns) ----
    body: {
      flexDirection: 'row',
      flex: 1,
      paddingTop: 16,
      paddingHorizontal: 32,
      paddingBottom: 24,
    },
    leftCol: {
      width: '36%',
      paddingRight: 18,
    },
    rightCol: {
      width: '64%',
      paddingLeft: 18,
    },

    // ---- SECTION TITLES ----
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

    // ---- SKILLS ----
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

    // ---- CERTIFICATIONS ----
    certItem: {
      fontSize: fs.small,
      color: '#333333',
      marginBottom: 3,
      lineHeight: 1.4,
    },

    // ---- EDUCATION ----
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

    // ---- EXPERIENCE ----
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 1,
    },
    entryCompany: {
      fontFamily: 'Helvetica-Bold',
      fontSize: fs.body,
      color: '#1a1a1a',
    },
    entryDate: {
      fontSize: fs.tiny,
      color: '#444444',
      textAlign: 'right' as any,
      minWidth: 100,
    },
    entryPosition: {
      fontSize: fs.small,
      color: '#444444',
      marginBottom: 4,
    },
    entry: {
      marginBottom: 10,
    },

    // ---- LANGUAGES ----
    langItem: {
      fontSize: fs.small,
      color: '#333333',
      marginBottom: 2,
    },
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header Band - solid blue background */}
        <View style={styles.headerBand}>
          <Text style={styles.headerName}>
            {personalInfo.name || 'Your Name'}
          </Text>
          {personalInfo.title && (
            <Text style={styles.headerTitle}>{personalInfo.title}</Text>
          )}
          {contactItems.length > 0 && (
            <View style={styles.contactRow}>
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text style={styles.contactSep}>|</Text>}
                  <Text style={styles.contactItem}>{item}</Text>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Body - Two Columns */}
        <View style={styles.body}>
          {/* LEFT COLUMN */}
          <View style={styles.leftCol}>
            {/* Technical Skills */}
            {techSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Technical Skills</Text>
                {Object.entries(techByCategory).map(([category, items]) => (
                  <View key={category} style={styles.skillCategory}>
                    <Text style={styles.skillCatItems}>
                      <Text style={styles.skillCatLabel}>
                        {categoryLabels[category] || category}
                      </Text>
                      {': ' + items.join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Soft Skills - separate section */}
            {softSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Soft Skills</Text>
                <Text style={styles.skillCatItems}>
                  {softSkills.map(s => s.name).join(', ')}
                </Text>
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
                  <View key={edu.id} style={{ marginBottom: 6 }} wrap={false}>
                    <Text style={styles.eduDegree}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
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
                  <View key={vol.id} style={{ marginBottom: 4 }} wrap={false}>
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
                    <View wrap={false}>
                      <View style={styles.entryRow}>
                        <Text style={styles.entryCompany}>{exp.company}</Text>
                        <Text style={styles.entryDate}>
                          {exp.startDate}
                          {exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                        </Text>
                      </View>
                      <Text style={styles.entryPosition}>
                        {exp.jobTitle}
                        {exp.location ? `  |  ${exp.location}` : ''}
                      </Text>
                    </View>
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
                    <View wrap={false}>
                      <View style={styles.entryRow}>
                        <Text style={styles.entryCompany}>{proj.name}</Text>
                        {(proj.startDate || proj.endDate) && (
                          <Text style={styles.entryDate}>
                            {proj.startDate}{proj.endDate ? ` - ${proj.endDate}` : ''}
                          </Text>
                        )}
                      </View>
                      <RichText
                        text={proj.description}
                        fontSize={fs.small}
                        color="#333333"
                        lineHeight={1.5}
                        style={{ marginBottom: 2, textAlign: 'justify' }}
                      />
                    </View>
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
