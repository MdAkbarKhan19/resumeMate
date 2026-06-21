import { ResumeData } from '@/types/resume';
import { TemplateProps, DEFAULT_CUSTOMIZATION, getBaseFontSize } from '@/types/template';

export default function ModernTwoColumnTemplate({
  data,
  customization = DEFAULT_CUSTOMIZATION,
  preview = false,
  watermark = false,
}: TemplateProps) {
  const fonts = { heading: customization?.fontFamily || 'Inter', body: customization?.fontFamily || 'Inter' };

  // Base font size in pt, driven by the customization slider (with the spacing
  // preset as fallback). All template element sizes scale relative to this so
  // the slider actually has an effect end-to-end in both preview and PDF.
  //
  // Implementation: r(px) takes the original-design size in px (built at
  // 11pt baseline) and scales it proportionally. At baseFs=11 nothing changes;
  // at baseFs=13 every element is ~18% larger; at baseFs=9 ~18% smaller.
  // The result stays in px units so existing layout math (line-height,
  // padding, etc.) is untouched.
  const baseFs = getBaseFontSize(customization, data);
  const r = (px: number) => `${((px * baseFs) / 11).toFixed(1)}px`;

  // Spacing density preset (compact / normal / spacious). Drives the vertical
  // rhythm — paddings, section gaps, entry gaps — so the slider has a real,
  // IDENTICAL effect in both the live preview and the downloaded PDF (both
  // render this same component). Previously `spacing` was a no-op.
  const spacingScale = ({ compact: 0.82, normal: 1, spacious: 1.2 } as const)[customization?.spacing ?? 'normal'] ?? 1;
  const sp = (px: number) => `${(px * spacingScale).toFixed(1)}px`;
  const sectionGap = sp(20);
  const fs = {
    base: baseFs,
    tiny: r(9),
    small: r(9.5),
    smallEntry: r(10),
    entryHeader: r(10.5),
    entryTitle: r(11),
    body: r(11),
    sub: r(12),
    section: r(13.5),
    name: r(30),
    micro: r(8.5),
  };

  // Normalize AI-emitted category names (e.g. "Programming Languages") into one of the 4 buckets
  const normalizeCat = (c: string | undefined): string => {
    if (!c) return 'technical';
    const cat = c.toLowerCase().trim();
    if (/^(soft|interpersonal|leadership|communication)/.test(cat) || cat.includes('soft skill')) return 'soft';
    if (/^(language|spoken)/.test(cat) && !cat.includes('programming')) return 'language';
    if (/(tool|platform|software|devops|cloud|database|operating)/.test(cat)) return 'tools';
    return 'technical';
  };

  // Group skills by normalized category
  const skillsByCategory = data.skills?.reduce((acc: Record<string, string[]>, skill: any) => {
    const category = normalizeCat(skill.category);
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill.name);
    return acc;
  }, {}) || {};

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    tools: 'Tools & Platforms',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Build a proper absolute URL for social links.
  //  - If the value already contains the domain (with or without protocol/www), preserve it.
  //  - Otherwise the value is just a handle/slug — prepend the canonical path.
  const buildSocialUrl = (rawInput: string, domain: string, slugPath: string): string => {
    const raw = (rawInput || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const lower = raw.toLowerCase();
    if (lower.startsWith(`${domain}/`) || lower.startsWith(`www.${domain}/`)) return `https://${raw}`;
    if (lower.includes(`${domain}/`)) return `https://${raw.replace(/^\/+/, '')}`;
    return `https://${domain}/${slugPath}${raw.replace(/^\/+/, '')}`;
  };

  const buildSiteUrl = (rawInput: string): string => {
    const raw = (rawInput || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw.replace(/^\/+/, '')}`;
  };

  // Strip protocol/www and trailing slash for display
  const displayHandle = (raw: string) =>
    raw.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') || raw;

  // "2023-12" -> "Dec 2023". Pass-through for already-human dates.
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

  // Contact items with icon identifiers
  const contactItems: { icon: string; value: string; href?: string }[] = [];
  if (data.personalInfo.phone) contactItems.push({ icon: 'phone', value: data.personalInfo.phone, href: `tel:${data.personalInfo.phone.replace(/\s/g, '')}` });
  if (data.personalInfo.email) contactItems.push({ icon: 'email', value: data.personalInfo.email, href: `mailto:${data.personalInfo.email}` });
  if (data.personalInfo.linkedin) {
    const raw = data.personalInfo.linkedin;
    contactItems.push({ icon: 'linkedin', value: displayHandle(raw), href: buildSocialUrl(raw, 'linkedin.com', 'in/') });
  }
  if (data.personalInfo.github) {
    const raw = data.personalInfo.github;
    contactItems.push({ icon: 'github', value: displayHandle(raw), href: buildSocialUrl(raw, 'github.com', '') });
  }
  if (data.personalInfo.portfolio) {
    const raw = data.personalInfo.portfolio;
    contactItems.push({ icon: 'portfolio', value: raw.replace(/^https?:\/\//, ''), href: buildSiteUrl(raw) });
  }
  if (data.personalInfo.location) {
    contactItems.push({ icon: 'location', value: data.personalInfo.location });
  }

  // SVG icon paths for contact items
  const iconPaths: Record<string, string> = {
    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    portfolio: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  };

  // LinkedIn and GitHub use filled SVGs
  const linkedinIcon = (
    <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="#333333" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );

  const githubIcon = (
    <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="#333333" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );

  const getIcon = (iconName: string) => {
    if (iconName === 'linkedin') return linkedinIcon;
    if (iconName === 'github') return githubIcon;
    const path = iconPaths[iconName];
    if (!path) return null;
    return (
      <svg style={{ width: '10px', height: '10px', flexShrink: 0 }} fill="none" stroke="#333333" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    );
  };

  // Derive a soft header tint from the primary color (10% opacity)
  const primary = customization?.primaryColor || '#2563eb';
  const headerBg = (() => {
    const hex = primary.replace('#', '');
    if (hex.length !== 6) return '#d5e5f0';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Mix with white at 85% white / 15% color for a soft tint
    const mix = (c: number) => Math.round(c * 0.15 + 255 * 0.85);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  })();

  // Shared section title style — underline uses the primary color
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: fs.section,
    fontWeight: 700,
    color: '#1a1a1a',
    fontFamily: fonts.heading,
    paddingBottom: '5px',
    borderBottom: `1.5px solid ${primary}`,
    margin: `0 0 ${sp(10)} 0`,
  };

  return (
    <div
      className={`resume-template modern-two-column bg-white ${preview ? 'shadow-lg' : ''} ${watermark ? 'rm-watermark-host' : ''}`}
      style={{
        fontFamily: fonts.body,
        fontSize: fs.body,
        width: preview ? '100%' : '8.5in',
        minHeight: preview ? 'auto' : '11in',
      }}
    >
      {/* ===== HEADER BAND ===== */}
      <div
        style={{
          backgroundColor: headerBg,
          padding: `${sp(32)} 36px ${sp(20)} 36px`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: fs.name,
            fontWeight: 300,
            color: '#1a1a1a',
            fontFamily: fonts.heading,
            letterSpacing: '2px',
            margin: '0 0 4px 0',
          }}
        >
          {data.personalInfo.name}
        </h1>
        {data.personalInfo.title && (
          <div
            style={{
              fontSize: fs.sub,
              color: '#444444',
              marginBottom: '16px',
              fontWeight: 400,
              letterSpacing: '0.5px',
            }}
          >
            {data.personalInfo.title}
          </div>
        )}

        {/* Contact Row with icons */}
        {contactItems.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px 16px',
              fontSize: fs.small,
              color: '#333333',
              lineHeight: '1.6',
            }}
          >
            {contactItems.map((item, index) => (
              <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {getIcon(item.icon)}
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: '#333333', textDecoration: 'none' }}>{item.value}</a>
                ) : (
                  <span>{item.value}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== BODY - TWO COLUMNS ===== */}
      <div
        style={{
          display: 'flex',
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          margin: '0',
          minHeight: 'calc(100% - 110px)',
        }}
      >
        {/* LEFT COLUMN - Sidebar */}
        <div
          style={{
            width: '35%',
            padding: `${sp(20)} 16px ${sp(20)} 22px`,
            borderRight: '1px solid #e0e0e0',
          }}
        >
          {/* Technical Skills */}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Technical Skills</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp(7) }}>
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category} style={{ fontSize: fs.small, lineHeight: '1.55', color: '#333333' }}>
                    <span style={{ fontWeight: 700, color: '#1a1a1a' }}>
                      {getCategoryLabel(category)}
                    </span>
                    {': '}
                    {skills.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Certifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp(8) }}>
                {data.certifications.map((cert, index) => {
                  const certHref = cert.url ? buildSiteUrl(cert.url) : '';
                  const formattedDate = formatMonthYear(cert.date);
                  return (
                    <div key={index} style={{ lineHeight: '1.4', color: '#333333' }}>
                      {/* Title — clickable when a URL exists, no separate "Verify" link */}
                      {certHref ? (
                        <a
                          href={certHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: fs.smallEntry, fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', borderBottom: `1px solid ${primary}` }}
                        >
                          {cert.name}
                        </a>
                      ) : (
                        <span style={{ fontSize: fs.smallEntry, fontWeight: 700, color: '#1a1a1a' }}>{cert.name}</span>
                      )}
                      {/* Issuer · Date — single bullet separator, no em-dashes, formatted date */}
                      {(cert.issuer || formattedDate) && (
                        <div style={{ fontSize: fs.tiny, color: '#666666', marginTop: '1px' }}>
                          {cert.issuer}
                          {cert.issuer && formattedDate ? ' · ' : ''}
                          {formattedDate}
                        </div>
                      )}
                      {cert.credentialId && (
                        <div style={{ fontSize: fs.micro, color: '#888888' }}>ID: {cert.credentialId}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Education</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp(8) }}>
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <div style={{ fontSize: fs.entryHeader, fontWeight: 700, color: '#1a1a1a', lineHeight: '1.4' }}>
                      {edu.degree}{edu.field ? ` ${edu.field}` : ''}
                    </div>
                    <div style={{ fontSize: fs.small, color: '#444444', lineHeight: '1.4' }}>
                      {edu.institution}
                    </div>
                    <div style={{ fontSize: fs.tiny, color: '#666666', lineHeight: '1.4' }}>
                      {edu.location && `${edu.location} | `}{edu.startDate ? `${edu.startDate} - ` : ''}{edu.graduationDate}
                    </div>
                    {edu.gpa && (
                      <div style={{ fontSize: fs.tiny, color: '#666666' }}>CGPA: {edu.gpa}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Languages</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {data.languages.map((lang, index) => (
                  <div key={index} style={{ fontSize: fs.small, color: '#333333' }}>
                    <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{lang.name}</span>
                    {lang.proficiency && (
                      <span style={{ color: '#666666' }}> ({lang.proficiency})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer */}
          {data.volunteer && data.volunteer.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Volunteer</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.volunteer.map((vol, index) => (
                  <div key={index}>
                    <div style={{ fontSize: fs.smallEntry, fontWeight: 700, color: '#1a1a1a' }}>{vol.role}</div>
                    <div style={{ fontSize: fs.small, color: '#444444' }}>{vol.organization}</div>
                    {vol.description && (
                      <div style={{ fontSize: fs.tiny, color: '#666666', marginTop: '2px' }}>{vol.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Sections */}
          {data.customSections && data.customSections.length > 0 && (
            <>
              {data.customSections.map((section, index) => (
                <div key={index} style={{ marginBottom: sectionGap }}>
                  <h2 style={sectionTitleStyle}>{section.title}</h2>
                  <div style={{ fontSize: fs.small, color: '#333333', whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                    {section.content}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* RIGHT COLUMN - Main Content */}
        <div
          style={{
            width: '65%',
            padding: `${sp(20)} 22px ${sp(20)} 20px`,
          }}
        >
          {/* Profile Summary */}
          {data.summary && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Profile Summary</h2>
              <p
                style={{
                  fontSize: fs.small,
                  lineHeight: '1.6',
                  color: '#333333',
                  textAlign: 'justify',
                  margin: 0,
                }}
              >
                {data.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Work Experience</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp(14) }}>
                {data.experience.map((exp, index) => (
                  <div key={index}>
                    {/* Company + Date row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                      <div style={{ fontSize: fs.entryTitle, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>
                        {exp.company}
                      </div>
                      <div style={{ fontSize: fs.tiny, color: '#444444', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {/* Job Title */}
                    <div style={{ fontSize: fs.small, color: '#555555', marginBottom: '5px', fontStyle: 'italic' }}>
                      {exp.jobTitle}
                      {exp.location && ` | ${exp.location}`}
                    </div>
                    {/* Bullets */}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: '0', paddingLeft: '15px', listStyleType: 'disc' }}>
                        {exp.bullets.filter(b => b.trim()).map((bullet, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            style={{
                              fontSize: fs.small,
                              lineHeight: '1.55',
                              color: '#333333',
                              marginBottom: '3px',
                              textAlign: 'justify',
                            }}
                            dangerouslySetInnerHTML={{
                              __html: bullet.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div style={{ marginBottom: sectionGap }}>
              <h2 style={sectionTitleStyle}>Projects</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp(12) }}>
                {data.projects.map((project, index) => (
                  <div key={index}>
                    {/* Project Name + Link + Date row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <div style={{ fontSize: fs.entryTitle, fontWeight: 700, color: '#1a1a1a', flex: 1 }}>
                        {project.name}
                        {project.url && (
                          <a
                            href={buildSiteUrl(project.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: fs.tiny, fontWeight: 400, color: primary, textDecoration: 'none', marginLeft: '6px' }}
                          >
                            ↗ Link
                          </a>
                        )}
                      </div>
                      {(project.startDate || project.endDate) && (
                        <div style={{ fontSize: fs.tiny, color: '#444444', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                          {project.startDate}{project.endDate ? ` - ${project.endDate}` : ''}
                        </div>
                      )}
                    </div>
                    {/* Description */}
                    <p
                      style={{
                        fontSize: fs.small,
                        lineHeight: '1.55',
                        color: '#333333',
                        margin: '3px 0',
                        textAlign: 'justify',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: project.description.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      }}
                    />
                    {/* Tech Stack */}
                    {project.techStack && project.techStack.length > 0 && (
                      <div style={{ fontSize: fs.tiny, color: '#666666', marginTop: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#444444' }}>Tech: </span>
                        {project.techStack.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
