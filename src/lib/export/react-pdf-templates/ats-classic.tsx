/**
 * ATS Classic PDF Template
 * Maximum ATS compatibility: single column, no colors, standard fonts
 * Designed to pass all automated screening systems
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, BulletPoint, RichText } from './base';

export default function ATSClassicPDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize);

  const styles = StyleSheet.create({
    page: {
      padding: 36,
      fontFamily: 'Times-Roman',
      color: '#000000',
      fontSize: fs.body,
      lineHeight: 1.4,
    },
    header: {
      textAlign: 'center',
      marginBottom: 12,
    },
    name: {
      fontSize: fs.name + 2,
      fontFamily: 'Times-Bold',
      color: '#000000',
      marginBottom: 4,
    },
    contact: {
      fontSize: fs.small,
      color: '#000000',
    },
    sectionTitle: {
      fontSize: fs.sectionHeader,
      fontFamily: 'Times-Bold',
      textTransform: 'uppercase',
      borderBottomWidth: 1,
      borderBottomColor: '#000000',
      paddingBottom: 2,
      marginBottom: 6,
      marginTop: 10,
    },
    entryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    bold: {
      fontFamily: 'Times-Bold',
      fontSize: fs.body,
    },
    italic: {
      fontFamily: 'Times-Italic',
      fontSize: fs.small,
    },
    body: {
      fontSize: fs.body,
      lineHeight: 1.4,
      marginBottom: 2,
    },
    bullet: {
      flexDirection: 'row',
      marginBottom: 2,
      paddingLeft: 12,
    },
    bulletDot: {
      fontSize: fs.body,
      marginRight: 6,
      width: 8,
    },
    bulletText: {
      fontSize: fs.body,
      flex: 1,
      lineHeight: 1.4,
    },
    entry: {
      marginBottom: 8,
    },
    date: {
      fontSize: fs.small,
      color: '#000000',
    },
    skillsText: {
      fontSize: fs.body,
      lineHeight: 1.5,
    },
  });

  const contactParts: string[] = [];
  if (personalInfo.email) contactParts.push(personalInfo.email);
  if (personalInfo.phone) contactParts.push(personalInfo.phone);
  if (personalInfo.location) contactParts.push(personalInfo.location);
  if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);
  if (personalInfo.github) contactParts.push(personalInfo.github);
  if (personalInfo.portfolio) contactParts.push(personalInfo.portfolio);

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    language: 'Languages',
    tools: 'Tools & Platforms',
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'YOUR NAME'}</Text>
          {personalInfo.title && (
            <Text style={{ fontSize: fs.title, marginBottom: 4 }}>{personalInfo.title}</Text>
          )}
          <Text style={styles.contact}>{contactParts.join('  |  ')}</Text>
        </View>

        {/* Summary */}
        {summary ? (
          <View>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <RichText text={summary} fontSize={fs.body} color="#000000" fontFamily="Times-Roman" boldFontFamily="Times-Bold" lineHeight={1.4} />
          </View>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>PROFESSIONAL EXPERIENCE</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry}>
                <View wrap={false}>
                  <View style={styles.entryRow}>
                    <Text style={styles.bold}>{exp.jobTitle}</Text>
                    <Text style={styles.date}>
                      {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                    </Text>
                  </View>
                  <Text style={styles.italic}>
                    {exp.company}{exp.location ? `, ${exp.location}` : ''}
                  </Text>
                </View>
                {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                  <BulletPoint
                    key={i}
                    text={bullet}
                    fontSize={fs.body}
                    color="#000000"
                    boldColor="#000000"
                    fontFamily="Times-Roman"
                    boldFontFamily="Times-Bold"
                    lineHeight={1.4}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {education.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entry} wrap={false}>
                <View style={styles.entryRow}>
                  <Text style={styles.bold}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </Text>
                  <Text style={styles.date}>{edu.graduationDate}</Text>
                </View>
                <Text style={styles.italic}>
                  {edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {skills.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            {Object.entries(skillsByCategory).map(([category, items]) => (
              <View key={category} style={{ marginBottom: 3 }}>
                <Text style={styles.skillsText}>
                  <Text style={styles.bold}>{categoryLabels[category] || category}: </Text>
                  {items.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {projects.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.entry}>
                <View wrap={false}>
                  <Text style={styles.bold}>{proj.name}</Text>
                  <RichText text={proj.description} fontSize={fs.body} color="#000000" fontFamily="Times-Roman" boldFontFamily="Times-Bold" lineHeight={1.4} />
                </View>
                {proj.techStack.length > 0 && (
                  <Text style={styles.italic}>Technologies: {proj.techStack.join(', ')}</Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {certifications.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={{ marginBottom: 2 }} wrap={false}>
                <Text style={styles.body}>
                  <Text style={styles.bold}>{cert.name}</Text> - {cert.issuer}
                  {cert.date ? ` (${cert.date})` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Languages */}
        {languages.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>LANGUAGES</Text>
            <Text style={styles.body}>
              {languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Volunteer */}
        {volunteer.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>VOLUNTEER EXPERIENCE</Text>
            {volunteer.map((vol) => (
              <View key={vol.id} style={styles.entry}>
                <View wrap={false}>
                  <View style={styles.entryRow}>
                    <Text style={styles.bold}>{vol.role}</Text>
                    <Text style={styles.date}>
                      {vol.startDate}{vol.endDate ? ` - ${vol.endDate}` : vol.current ? ' - Present' : ''}
                    </Text>
                  </View>
                  <Text style={styles.italic}>{vol.organization}</Text>
                </View>
                {vol.description ? <Text style={styles.body}>{vol.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
