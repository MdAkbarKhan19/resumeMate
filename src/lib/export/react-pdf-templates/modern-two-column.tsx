/**
 * Modern Two-Column PDF Template
 * - Light blue header banner with centered name/title/contacts
 * - Two-column body: left sidebar (skills, certs, education) + right main (summary, experience)
 * - Bold keywords in bullet points via **markers**
 * - Skills grouped by bold category name + comma-separated items
 * - Thin separator lines under section titles
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Link } from '@react-pdf/renderer';
import { PDFTemplateProps, getFontSize, BulletPoint, RichText } from './base';
import { ResumeData } from '@/types/resume';

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

export default function ModernTwoColumnPDF({ data, customization }: PDFTemplateProps) {
  const personalInfo = data.personalInfo || ({} as ResumeData['personalInfo']);
  const summary = data.summary || '';
  const experience = data.experience || [];
  const education = data.education || [];
  const skills = data.skills || [];
  const certifications = data.certifications || [];
  const projects = data.projects || [];
  const languages = data.languages || [];
  const volunteer = data.volunteer || [];
  const fs = getFontSize(customization?.fontSize as any);

  const normalizeCat = (c: string | undefined): string => {
    if (!c) return 'technical';
    const cat = c.toLowerCase().trim();
    if (/^(soft|interpersonal|leadership|communication)/.test(cat) || cat.includes('soft skill')) return 'soft';
    if (/^(language|spoken)/.test(cat) && !cat.includes('programming')) return 'language';
    if (/(tool|platform|software|devops|cloud|database|operating)/.test(cat)) return 'tools';
    return 'technical';
  };

  // Group ALL skills by normalized category
  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = normalizeCat(s.category);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    tools: 'Tools & Platforms',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const primary = customization?.primaryColor || '#2563eb';

  // Soft tinted header derived from primary color
  const headerBg = (() => {
    const hex = primary.replace('#', '');
    if (hex.length !== 6) return '#d5e5f0';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const mix = (c: number) => Math.round(c * 0.15 + 255 * 0.85);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  })();

  // Contact items - rendered as clickable Link elements
  const contactParts: { text: string; href?: string }[] = [];
  if (personalInfo.phone) contactParts.push({ text: personalInfo.phone });
  if (personalInfo.email) contactParts.push({ text: personalInfo.email, href: `mailto:${personalInfo.email}` });
  if (personalInfo.linkedin) {
    contactParts.push({ text: displayHandle(personalInfo.linkedin), href: buildSocialUrl(personalInfo.linkedin, 'linkedin.com', 'in/') });
  }
  if (personalInfo.github) {
    contactParts.push({ text: displayHandle(personalInfo.github), href: buildSocialUrl(personalInfo.github, 'github.com', '') });
  }
  if (personalInfo.portfolio) {
    contactParts.push({ text: displayHandle(personalInfo.portfolio), href: buildSiteUrl(personalInfo.portfolio) });
  }
  if (personalInfo.location) {
    contactParts.push({ text: personalInfo.location });
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
      backgroundColor: headerBg,
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
      borderBottomColor: primary,
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
              {contactParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text>{'  |  '}</Text>}
                  {part.href ? (
                    <Link src={part.href} style={{ color: '#333333', textDecoration: 'none' }}>{part.text}</Link>
                  ) : (
                    <Text>{part.text}</Text>
                  )}
                </React.Fragment>
              ))}
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

            {/* Certifications — name is the hyperlink (no "Verify" text), date formatted */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => {
                  const formattedDate = formatMonthYear(cert.date);
                  return (
                    <View key={cert.id} style={{ marginBottom: 6 }}>
                      {cert.url ? (
                        <Link
                          src={buildSiteUrl(cert.url)}
                          style={{ fontSize: fs.small, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', textDecoration: 'underline' }}
                        >
                          {cert.name}
                        </Link>
                      ) : (
                        <Text style={{ fontSize: fs.small, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' }}>{cert.name}</Text>
                      )}
                      {(cert.issuer || formattedDate) && (
                        <Text style={{ fontSize: fs.tiny, color: '#666666' }}>
                          {cert.issuer}
                          {cert.issuer && formattedDate ? '  ·  ' : ''}
                          {formattedDate}
                        </Text>
                      )}
                      {cert.credentialId ? (
                        <Text style={{ fontSize: fs.tiny, color: '#888888' }}>ID: {cert.credentialId}</Text>
                      ) : null}
                    </View>
                  );
                })}
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
                      <Text style={styles.entryTitle}>
                        {proj.name}
                        {proj.url ? (
                          <>
                            <Text>  </Text>
                            <Link src={buildSiteUrl(proj.url)} style={{ color: primary, fontSize: fs.tiny, textDecoration: 'none' }}>↗ Link</Link>
                          </>
                        ) : null}
                      </Text>
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
