import { ResumeData } from '@/types/resume';
import { TemplateProps, DEFAULT_CUSTOMIZATION, getSpacingValues, getColorScheme } from '@/types/template';

export default function ModernTwoColumnTemplate({
  data,
  customization = DEFAULT_CUSTOMIZATION,
  preview = false
}: TemplateProps) {
  const colors = getColorScheme(customization?.primaryColor);
  const fonts = { heading: customization?.fontFamily || 'Inter', body: customization?.fontFamily || 'Inter' };
  const spacing = getSpacingValues(customization?.spacing);

  // Group skills by category
  const skillsByCategory = data.skills?.reduce((acc: Record<string, string[]>, skill: any) => {
    const category = skill.category || 'technical';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill.name);
    return acc;
  }, {}) || {};

  const categoryLabels: Record<string, string> = {
    technical: 'Languages',
    tools: 'Automation Tools',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Contact items - plain text with pipe separators, no hyperlinks
  const contactParts: string[] = [];
  if (data.personalInfo.phone) contactParts.push(data.personalInfo.phone);
  if (data.personalInfo.email) contactParts.push(data.personalInfo.email);
  if (data.personalInfo.linkedin) {
    const raw = data.personalInfo.linkedin;
    contactParts.push(raw.replace(/^https?:\/\/(www\.)?/, '').replace(/^linkedin\.com\/in\//, '').replace(/\/$/, '') || raw);
  }
  if (data.personalInfo.github) {
    const raw = data.personalInfo.github;
    contactParts.push(raw.replace(/^https?:\/\/(www\.)?/, '').replace(/^github\.com\//, '').replace(/\/$/, '') || raw);
  }
  if (data.personalInfo.portfolio) {
    contactParts.push(data.personalInfo.portfolio.replace(/^https?:\/\//, ''));
  }
  if (data.personalInfo.location) {
    contactParts.push(data.personalInfo.location);
  }

  // Shared section title style
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1a1a',
    fontFamily: fonts.heading,
    paddingBottom: '6px',
    borderBottom: '1.5px solid #cccccc',
    margin: '0 0 8px 0',
  };

  return (
    <div
      className={`resume-template modern-two-column bg-white ${preview ? 'shadow-lg' : ''}`}
      style={{
        fontFamily: fonts.body,
        fontSize: `${spacing.fontSize}pt`,
        width: preview ? '100%' : '8.5in',
        minHeight: preview ? 'auto' : '11in',
        height: preview ? 'auto' : '11in',
      }}
    >
      {/* ===== HEADER BAND ===== */}
      <div
        style={{
          backgroundColor: '#d5e5f0',
          padding: '30px 36px 18px 36px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: '#1a1a1a',
            fontFamily: fonts.heading,
            letterSpacing: '1.5px',
            margin: '0 0 10px 0',
          }}
        >
          {data.personalInfo.name}
        </h1>
        {data.personalInfo.title && (
          <div
            style={{
              fontSize: '13px',
              color: '#444444',
              marginBottom: '16px',
              fontWeight: 400,
            }}
          >
            {data.personalInfo.title}
          </div>
        )}

        {/* Contact Row - clean pipe-separated text */}
        {contactParts.length > 0 && (
          <div
            style={{
              fontSize: '10px',
              color: '#333333',
              lineHeight: '1.6',
            }}
          >
            {contactParts.join('  |  ')}
          </div>
        )}
      </div>

      {/* ===== BODY - TWO COLUMNS ===== */}
      <div
        style={{
          display: 'flex',
          border: '1px solid #e0e0e0',
          margin: '0',
          minHeight: 'calc(100% - 110px)',
        }}
      >
        {/* LEFT COLUMN - Sidebar */}
        <div
          style={{
            width: '35%',
            padding: '20px 16px 20px 20px',
            borderRight: '1px solid #e0e0e0',
          }}
        >
          {/* Technical Skills */}
          {data.skills && data.skills.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Technical Skills</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category} style={{ fontSize: '10px', lineHeight: '1.5', color: '#333333' }}>
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
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Certifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.certifications.map((cert, index) => (
                  <div key={index} style={{ fontSize: '10px', lineHeight: '1.4', color: '#333333' }}>
                    {cert.name}
                    {cert.issuer ? ` | ${cert.issuer}` : ''}
                    {cert.url && (
                      <span style={{ color: colors.primary, marginLeft: '4px' }}>
                        | <span style={{ color: colors.primary, textDecoration: 'underline' }}>Link</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Education</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1a1a1a', lineHeight: '1.4' }}>
                      {edu.degree}{edu.field ? ` ${edu.field}` : ''}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444444', lineHeight: '1.4' }}>
                      {edu.institution}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#666666', lineHeight: '1.4' }}>
                      {edu.location && `${edu.location} | `}{edu.startDate ? `${edu.startDate} - ` : ''}{edu.graduationDate}
                    </div>
                    {edu.gpa && (
                      <div style={{ fontSize: '9.5px', color: '#666666' }}>CGPA: {edu.gpa}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Languages</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {data.languages.map((lang, index) => (
                  <div key={index} style={{ fontSize: '10px', color: '#333333' }}>
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
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Volunteer</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.volunteer.map((vol, index) => (
                  <div key={index}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#1a1a1a' }}>{vol.role}</div>
                    <div style={{ fontSize: '10px', color: '#444444' }}>{vol.organization}</div>
                    {vol.description && (
                      <div style={{ fontSize: '9.5px', color: '#666666', marginTop: '2px' }}>{vol.description}</div>
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
                <div key={index} style={{ marginBottom: '18px' }}>
                  <h2 style={sectionTitleStyle}>{section.title}</h2>
                  <div style={{ fontSize: '10px', color: '#333333', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
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
            padding: '20px 20px 20px 18px',
          }}
        >
          {/* Profile Summary */}
          {data.summary && (
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Profile Summary</h2>
              <p
                style={{
                  fontSize: '10px',
                  lineHeight: '1.55',
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
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Work Experience</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.experience.map((exp, index) => (
                  <div key={index}>
                    {/* Company + Date row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1a1a', flex: 1 }}>
                        {exp.company}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#444444', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
                    {/* Job Title */}
                    <div style={{ fontSize: '10px', color: '#444444', marginBottom: '4px' }}>
                      {exp.jobTitle}
                      {exp.location && ` | ${exp.location}`}
                    </div>
                    {/* Bullets */}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: '0', paddingLeft: '16px', listStyleType: 'disc' }}>
                        {exp.bullets.filter(b => b.trim()).map((bullet, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            style={{
                              fontSize: '10px',
                              lineHeight: '1.5',
                              color: '#333333',
                              marginBottom: '2px',
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
            <div style={{ marginBottom: '18px' }}>
              <h2 style={sectionTitleStyle}>Projects</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.projects.map((project, index) => (
                  <div key={index}>
                    {/* Project Name + Date row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1a1a1a', flex: 1 }}>
                        {project.name}
                      </div>
                      {(project.startDate || project.endDate) && (
                        <div style={{ fontSize: '9.5px', color: '#444444', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px' }}>
                          {project.startDate}{project.endDate ? ` - ${project.endDate}` : ''}
                        </div>
                      )}
                    </div>
                    {/* Description */}
                    <p
                      style={{
                        fontSize: '10px',
                        lineHeight: '1.5',
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
                      <div style={{ fontSize: '9.5px', color: '#666666', marginTop: '2px' }}>
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
