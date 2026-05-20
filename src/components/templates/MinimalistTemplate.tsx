import { ResumeData } from '@/types/resume';
import { TemplateProps, DEFAULT_CUSTOMIZATION, getSpacingValues, getColorScheme, getBaseFontSize } from '@/types/template';

export default function MinimalistTemplate({
  data,
  customization = DEFAULT_CUSTOMIZATION,
  preview = false,
  watermark = false,
}: TemplateProps) {
  const colors = getColorScheme(customization?.primaryColor);
  const fonts = { heading: customization?.fontFamily || 'Inter', body: customization?.fontFamily || 'Inter' };
  // Copy spacing (getSpacingValues returns a shared object reference) and
  // override fontSize from auto-fit (or the user's explicit slider value).
  // Passing `data` lets getBaseFontSize compute the ideal size from the
  // resume's content density when the user hasn't overridden manually.
  const baseFs = getBaseFontSize(customization, data);
  const spacing = { ...getSpacingValues(customization?.spacing), fontSize: baseFs };

  const formatBullet = (bullet: string) => {
    return bullet.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  };

  const sectionSpacing = spacing.fontSize >= 12 ? 32 : spacing.fontSize >= 11 ? 28 : 22;
  const itemSpacing = spacing.fontSize >= 12 ? 22 : spacing.fontSize >= 11 ? 18 : 14;

  // URL builders: handle raw strings that may or may not contain protocol/domain
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

  const contactItems: { text: string; href?: string }[] = [];
  if (data.personalInfo.email) contactItems.push({ text: data.personalInfo.email, href: `mailto:${data.personalInfo.email}` });
  if (data.personalInfo.phone) contactItems.push({ text: data.personalInfo.phone, href: `tel:${data.personalInfo.phone.replace(/\s/g, '')}` });
  if (data.personalInfo.location) contactItems.push({ text: data.personalInfo.location });
  if (data.personalInfo.linkedin) contactItems.push({ text: displayHandle(data.personalInfo.linkedin), href: buildSocialUrl(data.personalInfo.linkedin, 'linkedin.com', 'in/') });
  if (data.personalInfo.portfolio) contactItems.push({ text: displayHandle(data.personalInfo.portfolio), href: buildSiteUrl(data.personalInfo.portfolio) });
  if (data.personalInfo.github) contactItems.push({ text: displayHandle(data.personalInfo.github), href: buildSocialUrl(data.personalInfo.github, 'github.com', '') });

  const sectionHeaderStyle: React.CSSProperties = {
    fontFamily: fonts.heading,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: colors.text,
    paddingBottom: '8px',
    borderBottom: `1px solid ${colors.primary}`,
    marginBottom: `${itemSpacing}px`,
  };

  const skillCategories = data.skills
    ? Object.entries(
        data.skills.reduce((acc: Record<string, string[]>, skill) => {
          const category = skill.category || 'other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(skill.name);
          return acc;
        }, {})
      )
    : [];

  const categoryLabels: Record<string, string> = {
    technical: 'Technical',
    soft: 'Soft Skills',
    language: 'Languages',
    tools: 'Tools & Platforms',
    other: 'Other',
  };

  return (
    <div
      className={`resume-template minimalist bg-white ${preview ? 'shadow-lg' : ''} ${watermark ? 'rm-watermark-host' : ''}`}
      style={{
        fontFamily: fonts.body,
        fontSize: `${spacing.fontSize}pt`,
        width: preview ? '100%' : '8.5in',
        minHeight: preview ? 'auto' : '11in',
        padding: `${spacing.marginY}px ${spacing.marginX}px`,
        color: colors.text,
        lineHeight: 1.7,
        WebkitFontSmoothing: 'antialiased',
      }}
    >

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: '28px',
            fontWeight: 300,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: colors.text,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {data.personalInfo.name}
        </h1>

        {data.personalInfo.title && (
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '1px',
              color: colors.primary,
              marginTop: '8px',
            }}
          >
            {data.personalInfo.title}
          </div>
        )}

        {contactItems.length > 0 && (
          <div
            style={{
              fontSize: '9px',
              color: colors.textSecondary,
              marginTop: '14px',
              letterSpacing: '0.5px',
              lineHeight: 1.8,
            }}
          >
            {contactItems.map((item, i) => (
              <span key={i}>
                {i > 0 && (
                  <span
                    style={{
                      margin: '0 10px',
                      opacity: 0.4,
                    }}
                  >
                    |
                  </span>
                )}
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{item.text}</a>
                ) : (
                  <span>{item.text}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Header divider */}
      <div
        style={{
          borderBottom: `1px solid ${colors.text}`,
          opacity: 0.2,
          marginBottom: `${sectionSpacing}px`,
        }}
      />

      {/* ── Summary ── */}
      {data.summary && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Summary</h2>
          <p
            style={{
              fontSize: `${spacing.fontSize}pt`,
              color: colors.textSecondary,
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            {data.summary}
          </p>
        </div>
      )}

      {/* ── Experience ── */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Experience</h2>

          {data.experience.map((exp, index) => (
            <div
              key={exp.id || index}
              style={{
                marginBottom: index < data.experience.length - 1 ? `${itemSpacing}px` : 0,
              }}
            >
              {/* Title row: job title left, dates right */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: `${spacing.fontSize + 1}pt`,
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {exp.jobTitle}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: colors.textSecondary,
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                >
                  {exp.startDate} &mdash; {exp.current ? 'Present' : exp.endDate}
                </span>
              </div>

              {/* Company and location */}
              <div
                style={{
                  fontSize: `${spacing.fontSize}pt`,
                  color: colors.textSecondary,
                  marginTop: '2px',
                }}
              >
                {exp.company}
                {exp.location && (
                  <span style={{ opacity: 0.7 }}> &middot; {exp.location}</span>
                )}
              </div>

              {/* Bullets */}
              {exp.bullets && exp.bullets.length > 0 && (
                <ul
                  style={{
                    margin: '8px 0 0 0',
                    paddingLeft: '18px',
                    listStyleType: 'disc',
                  }}
                >
                  {exp.bullets.map((bullet, bi) => (
                    <li
                      key={bi}
                      style={{
                        fontSize: `${spacing.fontSize}pt`,
                        color: colors.textSecondary,
                        lineHeight: 1.75,
                        paddingLeft: '4px',
                        marginBottom: '3px',
                      }}
                      dangerouslySetInnerHTML={{ __html: formatBullet(bullet) }}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Education ── */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Education</h2>

          {data.education.map((edu, index) => (
            <div
              key={edu.id || index}
              style={{
                marginBottom: index < data.education.length - 1 ? `${itemSpacing}px` : 0,
              }}
            >
              {/* Degree + date */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: `${spacing.fontSize + 1}pt`,
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {edu.degree}
                  {edu.field && (
                    <span style={{ fontWeight: 400 }}> in {edu.field}</span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: colors.textSecondary,
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                >
                  {edu.startDate && `${edu.startDate} \u2014 `}{edu.graduationDate}
                </span>
              </div>

              {/* Institution */}
              <div
                style={{
                  fontSize: `${spacing.fontSize}pt`,
                  color: colors.textSecondary,
                  marginTop: '2px',
                }}
              >
                {edu.institution}
                {edu.location && (
                  <span style={{ opacity: 0.7 }}> &middot; {edu.location}</span>
                )}
              </div>

              {/* GPA / Honors */}
              {(edu.gpa || edu.honors) && (
                <div
                  style={{
                    fontSize: `${spacing.fontSize - 1}pt`,
                    color: colors.textSecondary,
                    marginTop: '4px',
                    lineHeight: 1.7,
                  }}
                >
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  {edu.gpa && edu.honors && <span> &middot; </span>}
                  {edu.honors && <span style={{ fontStyle: 'italic' }}>{edu.honors}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Skills ── */}
      {skillCategories.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Skills</h2>

          <div style={{ lineHeight: 2 }}>
            {skillCategories.map(([category, skillNames], index) => (
              <div
                key={category}
                style={{
                  fontSize: `${spacing.fontSize}pt`,
                  marginBottom: index < skillCategories.length - 1 ? '6px' : 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {categoryLabels[category] || category}:
                </span>
                <span
                  style={{
                    color: colors.textSecondary,
                    marginLeft: '8px',
                  }}
                >
                  {(skillNames as string[]).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ── */}
      {data.certifications && data.certifications.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Certifications</h2>

          {data.certifications.map((cert, index) => {
            const formattedDate = formatMonthYear(cert.date);
            const formattedExpiry = formatMonthYear(cert.expiryDate);
            return (
              <div
                key={cert.id || index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: index < data.certifications.length - 1 ? '8px' : 0,
                }}
              >
                <div style={{ fontSize: `${spacing.fontSize}pt` }}>
                  {/* Cert name is the hyperlink when a URL exists \u2014 no separate "Verify" text */}
                  {cert.url ? (
                    <a
                      href={buildSiteUrl(cert.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontWeight: 600,
                        color: colors.text,
                        textDecoration: 'none',
                        borderBottom: `1px solid ${colors.primary}`,
                      }}
                    >
                      {cert.name}
                    </a>
                  ) : (
                    <span style={{ fontWeight: 600, color: colors.text }}>{cert.name}</span>
                  )}
                  {cert.issuer && (
                    <span style={{ color: colors.textSecondary }}>, {cert.issuer}</span>
                  )}
                  {cert.credentialId && (
                    <span
                      style={{
                        fontSize: `${spacing.fontSize - 1}pt`,
                        color: colors.textSecondary,
                        opacity: 0.7,
                        marginLeft: '8px',
                      }}
                    >
                      ID: {cert.credentialId}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    color: colors.textSecondary,
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}
                >
                  {formattedDate}
                  {formattedExpiry && ` \u2013 ${formattedExpiry}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Projects ── */}
      {data.projects && data.projects.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Projects</h2>

          {data.projects.map((project, index) => (
            <div
              key={project.id || index}
              style={{
                marginBottom: index < data.projects.length - 1 ? `${itemSpacing}px` : 0,
              }}
            >
              {/* Project name + optional dates */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: `${spacing.fontSize + 1}pt`,
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {project.name}
                  {project.url && (
                    <a
                      href={buildSiteUrl(project.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontWeight: 400,
                        fontSize: `${spacing.fontSize - 1}pt`,
                        color: colors.primary,
                        marginLeft: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      {displayHandle(project.url)}
                    </a>
                  )}
                </span>
                {(project.startDate || project.endDate) && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: colors.textSecondary,
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      marginLeft: '16px',
                    }}
                  >
                    {project.startDate}{project.endDate && ` \u2014 ${project.endDate}`}
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: `${spacing.fontSize}pt`,
                  color: colors.textSecondary,
                  lineHeight: 1.75,
                  margin: '4px 0 0 0',
                }}
                dangerouslySetInnerHTML={{ __html: formatBullet(project.description) }}
              />

              {/* Tech stack */}
              {project.techStack && project.techStack.length > 0 && (
                <div
                  style={{
                    fontSize: `${spacing.fontSize - 1}pt`,
                    color: colors.textSecondary,
                    marginTop: '4px',
                    opacity: 0.8,
                  }}
                >
                  {project.techStack.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Languages ── */}
      {data.languages && data.languages.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Languages</h2>

          <div
            style={{
              fontSize: `${spacing.fontSize}pt`,
              color: colors.textSecondary,
              lineHeight: 2,
            }}
          >
            {data.languages.map((lang, index) => (
              <span key={lang.id || index}>
                {index > 0 && (
                  <span style={{ margin: '0 8px', opacity: 0.35 }}>|</span>
                )}
                <span style={{ fontWeight: 600, color: colors.text }}>{lang.name}</span>
                <span style={{ marginLeft: '4px', opacity: 0.8 }}>({lang.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Volunteer Experience ── */}
      {data.volunteer && data.volunteer.length > 0 && (
        <div style={{ marginBottom: `${sectionSpacing}px` }}>
          <h2 style={sectionHeaderStyle}>Volunteer Experience</h2>

          {data.volunteer.map((vol, index) => (
            <div
              key={vol.id || index}
              style={{
                marginBottom: index < data.volunteer.length - 1 ? `${itemSpacing}px` : 0,
              }}
            >
              {/* Role + dates */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: `${spacing.fontSize + 1}pt`,
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {vol.role}
                </span>
                {(vol.startDate || vol.endDate) && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: colors.textSecondary,
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      marginLeft: '16px',
                    }}
                  >
                    {vol.startDate} &mdash; {vol.current ? 'Present' : vol.endDate}
                  </span>
                )}
              </div>

              {/* Organization + location */}
              <div
                style={{
                  fontSize: `${spacing.fontSize}pt`,
                  color: colors.textSecondary,
                  marginTop: '2px',
                }}
              >
                {vol.organization}
                {vol.location && (
                  <span style={{ opacity: 0.7 }}> &middot; {vol.location}</span>
                )}
              </div>

              {/* Description */}
              {vol.description && (
                <p
                  style={{
                    fontSize: `${spacing.fontSize}pt`,
                    color: colors.textSecondary,
                    lineHeight: 1.75,
                    margin: '6px 0 0 0',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatBullet(vol.description) }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Custom Sections ── */}
      {data.customSections && data.customSections.length > 0 &&
        data.customSections.map((section, index) => (
          <div
            key={section.id || index}
            style={{ marginBottom: `${sectionSpacing}px` }}
          >
            <h2 style={sectionHeaderStyle}>{section.title}</h2>
            <div
              style={{
                fontSize: `${spacing.fontSize}pt`,
                color: colors.textSecondary,
                lineHeight: 1.85,
                whiteSpace: 'pre-wrap',
              }}
              dangerouslySetInnerHTML={{ __html: formatBullet(section.content) }}
            />
          </div>
        ))
      }
    </div>
  );
}
