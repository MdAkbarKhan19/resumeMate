/**
 * Minimalist PDF Template
 * Clean single-column design, black-and-white, elegant simplicity
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import { PDFTemplateProps, getSpacing, getFontSize, BulletPoint, RichText } from './base';

const displayHandle = (raw: string) =>
  raw.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') || raw;

const formatMonthYear = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (!m) return s;
  const monthIdx = parseInt(m[2], 10) - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx < 0 || monthIdx > 11) return m[1];
  return `${months[monthIdx]} ${m[1]}`;
};

const buildSiteUrl = (rawInput: string): string => {
  const raw = (rawInput || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, '')}`;
};

const buildSocialUrl = (rawInput: string, domain: string, slugPath: string): string => {
  const raw = (rawInput || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower.startsWith(`${domain}/`) || lower.startsWith(`www.${domain}/`)) return `https://${raw}`;
  if (lower.includes(`${domain}/`)) return `https://${raw.replace(/^\/+/, '')}`;
  return `https://${domain}/${slugPath}${raw.replace(/^\/+/, '')}`;
};

export default function MinimalistPDF({ data, customization }: PDFTemplateProps) {
  const personalInfo = data.personalInfo || ({} as any);
  const summary = data.summary || '';
  const experience = data.experience || [];
  const education = data.education || [];
  const skills = data.skills || [];
  const certifications = data.certifications || [];
  const projects = data.projects || [];
  const languages = data.languages || [];
  const volunteer = data.volunteer || [];
  const spacing = getSpacing(customization?.spacing);
  const fs = getFontSize(customization?.fontSize as any);
  const primary = customization?.primaryColor || '#111827';

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
      borderBottomWidth: 0.75,
      borderBottomColor: primary,
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

  const contactItems: { text: string; href?: string }[] = [];
  if (personalInfo.email) contactItems.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.phone) contactItems.push({ text: personalInfo.phone });
  if (personalInfo.location) contactItems.push({ text: personalInfo.location });
  if (personalInfo.linkedin) contactItems.push({ text: displayHandle(personalInfo.linkedin), href: buildSocialUrl(personalInfo.linkedin, 'linkedin.com', 'in/') });
  if (personalInfo.github) contactItems.push({ text: displayHandle(personalInfo.github), href: buildSocialUrl(personalInfo.github, 'github.com', '') });
  if (personalInfo.portfolio) contactItems.push({ text: displayHandle(personalInfo.portfolio), href: buildSiteUrl(personalInfo.portfolio) });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name || 'Your Name'}</Text>
          {personalInfo.title && <Text style={styles.title}>{personalInfo.title}</Text>}
          <Text style={styles.contact}>
            {contactItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Text>  |  </Text>}
                {item.href ? (
                  <Link src={item.href} style={{ color: '#6b7280', textDecoration: 'none' }}>{item.text}</Link>
                ) : (
                  <Text>{item.text}</Text>
                )}
              </React.Fragment>
            ))}
          </Text>
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
            {certifications.map((cert) => {
              const formattedDate = formatMonthYear(cert.date);
              return (
                <View key={cert.id} style={{ marginBottom: 3 }} wrap={false}>
                  <Text style={styles.skillLine}>
                    {cert.url ? (
                      <Link
                        src={buildSiteUrl(cert.url)}
                        style={{ fontFamily: 'Helvetica-Bold', color: '#111827', textDecoration: 'underline' }}
                      >
                        {cert.name}
                      </Link>
                    ) : (
                      <Text style={{ fontFamily: 'Helvetica-Bold', color: '#111827' }}>{cert.name}</Text>
                    )}
                    {cert.issuer ? <Text>, {cert.issuer}</Text> : null}
                    {formattedDate ? <Text style={{ color: '#6b7280' }}>{`  ·  ${formattedDate}`}</Text> : null}
                  </Text>
                </View>
              );
            })}
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
