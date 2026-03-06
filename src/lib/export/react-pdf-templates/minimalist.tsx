/**
 * Minimalist PDF Template
 * Clean single-column design, black-and-white, elegant simplicity
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, ContactInfo, BulletPoint, DateRange, RichText } from './base';

export default function MinimalistPDF({ data, customization }: PDFTemplateProps) {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize);

  const styles = StyleSheet.create({
    page: {
      padding: spacing.page,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      fontSize: fs.body,
      lineHeight: 1.5,
    },
    header: {
      textAlign: 'center',
      marginBottom: spacing.section,
      paddingBottom: spacing.item,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    name: {
      fontSize: fs.name,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    title: {
      fontSize: fs.title,
      color: '#6b7280',
      marginBottom: 6,
    },
    contact: {
      fontSize: fs.tiny,
      color: '#6b7280',
    },
    section: {
      marginBottom: spacing.section,
    },
    sectionTitle: {
      fontSize: fs.sectionHeader,
      fontWeight: 'bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: '#d1d5db',
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    entryTitle: {
      fontSize: fs.body,
      fontWeight: 'bold',
      color: '#111827',
    },
    entrySubtitle: {
      fontSize: fs.small,
      color: '#6b7280',
      marginBottom: 4,
    },
    date: {
      fontSize: fs.tiny,
      color: '#9ca3af',
    },
    bodyText: {
      fontSize: fs.body,
      color: '#374151',
      lineHeight: 1.5,
      marginBottom: 4,
    },
    entry: {
      marginBottom: spacing.item + 2,
    },
    skillLine: {
      fontSize: fs.small,
      color: '#374151',
      marginBottom: 2,
    },
  });

  const contactItems: string[] = [];
  if (personalInfo.email) contactItems.push(personalInfo.email);
  if (personalInfo.phone) contactItems.push(personalInfo.phone);
  if (personalInfo.location) contactItems.push(personalInfo.location);
  if (personalInfo.linkedin) contactItems.push(personalInfo.linkedin);
  if (personalInfo.github) contactItems.push(personalInfo.github);
  if (personalInfo.portfolio) contactItems.push(personalInfo.portfolio);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
          {personalInfo.title && <Text style={styles.title}>{personalInfo.title}</Text>}
          <Text style={styles.contact}>{contactItems.join('  |  ')}</Text>
        </View>

        {/* Summary */}
        {summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUMMARY</Text>
            <RichText text={summary} fontSize={fs.body} color="#374151" lineHeight={1.5} />
          </View>
        ) : null}

        {/* Experience */}
        {experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.entry}>
                <View wrap={false}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{exp.jobTitle}</Text>
                    <Text style={styles.date}>
                      {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                    </Text>
                  </View>
                  <Text style={styles.entrySubtitle}>
                    {exp.company}{exp.location ? `, ${exp.location}` : ''}
                  </Text>
                </View>
                {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                  <BulletPoint key={i} text={bullet} fontSize={fs.small} boldColor="#111827" lineHeight={1.5} />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </Text>
                  <Text style={styles.date}>{edu.graduationDate}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <Text style={styles.skillLine}>
              {skills.map(s => s.name).join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Projects */}
        {projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {projects.map((proj) => (
              <View key={proj.id} style={styles.entry}>
                <View wrap={false}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  <RichText text={proj.description} fontSize={fs.body} color="#374151" lineHeight={1.5} />
                </View>
                {proj.techStack.length > 0 && (
                  <Text style={{ fontSize: fs.tiny, color: '#6b7280' }}>
                    Technologies: {proj.techStack.join(', ')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* Certifications */}
        {certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={{ marginBottom: 2 }} wrap={false}>
                <Text style={styles.skillLine}>
                  {cert.name} - {cert.issuer}{cert.date ? ` (${cert.date})` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Languages */}
        {languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LANGUAGES</Text>
            <Text style={styles.skillLine}>
              {languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Volunteer */}
        {volunteer.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VOLUNTEER</Text>
            {volunteer.map((vol) => (
              <View key={vol.id} style={styles.entry} wrap={false}>
                <Text style={styles.entryTitle}>{vol.role} at {vol.organization}</Text>
                {vol.description ? <Text style={styles.bodyText}>{vol.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
