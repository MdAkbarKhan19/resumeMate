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
      <div className="flex" style={{ minHeight: '100%', height: '100%' }}>
        {/* Left Column - Sidebar */}
        <div 
          className="w-[35%] p-6"
          style={{ 
            backgroundColor: colors.primary10,
            padding: `${spacing.marginY}px ${spacing.marginX}px`,
            minHeight: '100%',
          }}
        >
          {/* Contact Information */}
          <div className="mb-6">
            <h2 
              className="text-sm font-bold uppercase tracking-wider mb-3 pb-2"
              style={{ 
                borderBottom: `2px solid ${colors.primary}`,
                color: colors.text,
                fontFamily: fonts.heading
              }}
            >
              Contact
            </h2>
            <div className="space-y-2" style={{ color: colors.textSecondary, fontSize: '0.8rem', lineHeight: '1.3' }}>
              {data.personalInfo.email && (
                <div className="flex items-start">
                  <svg className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1 }}>{data.personalInfo.email}</span>
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-start">
                  <svg className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span style={{ flex: 1 }}>{data.personalInfo.phone}</span>
                </div>
              )}
              {data.personalInfo.location && (
                <div className="flex items-start">
                  <svg className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span style={{ flex: 1 }}>{data.personalInfo.location}</span>
                </div>
              )}
              {data.personalInfo.linkedin && (
                <div className="flex items-start">
                  <svg className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: colors.primary }}>
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', flex: 1, fontSize: '0.75rem' }}>{data.personalInfo.linkedin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Skills
              </h2>
              <div className="space-y-3">
                {/* Group skills by category */}
                {Object.entries(
                  data.skills.reduce((acc: Record<string, string[]>, skill: any) => {
                    const category = skill.category || 'Other';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(skill.name);
                    return acc;
                  }, {})
                ).map(([category, skills], index) => (
                  <div key={index}>
                    <div 
                      className="text-xs font-semibold mb-1"
                      style={{ color: colors.primary }}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: colors.primary20,
                            color: colors.textSecondary
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Certifications
              </h2>
              <div className="space-y-3">
                {data.certifications.map((cert, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-semibold" style={{ color: colors.text }}>{cert.name}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{cert.issuer}</div>
                    <div className="text-xs" style={{ color: colors.textSecondary }}>{cert.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-sm font-bold uppercase tracking-wider mb-3 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Languages
              </h2>
              <div className="space-y-2">
                {data.languages.map((lang, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium" style={{ color: colors.text }}>{lang.name}</span>
                    <span className="text-xs ml-2" style={{ color: colors.textSecondary }}>({lang.proficiency})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Main Content */}
        <div 
          className="w-[65%] p-6"
          style={{ 
            padding: `${spacing.marginY}px ${spacing.marginX}px`
          }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 
              className="text-3xl font-bold mb-1"
              style={{ 
                color: colors.text,
                fontFamily: fonts.heading
              }}
            >
              {data.personalInfo.name}
            </h1>
            {data.personalInfo.title && (
              <div 
                className="text-lg font-medium mb-2"
                style={{ color: colors.primary }}
              >
                {data.personalInfo.title}
              </div>
            )}
            {data.summary && (
              <p 
                className="text-sm leading-relaxed mt-3"
                style={{ color: colors.textSecondary }}
              >
                {data.summary}
              </p>
            )}
          </div>

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-lg font-bold uppercase tracking-wider mb-4 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Experience
              </h2>
              <div className="space-y-4">
                {data.experience.map((exp, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: colors.text }}>{exp.jobTitle}</h3>
                        <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>{exp.company}</div>
                      </div>
                      <div className="text-xs text-right" style={{ color: colors.textSecondary }}>
                        <div>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                        {exp.location && <div>{exp.location}</div>}
                      </div>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="list-disc list-outside ml-5 space-y-1 text-sm" style={{ color: colors.textSecondary }}>
                        {exp.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-lg font-bold uppercase tracking-wider mb-4 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Education
              </h2>
              <div className="space-y-3">
                {data.education.map((edu, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: colors.text }}>{edu.degree}</h3>
                        <div className="text-sm" style={{ color: colors.textSecondary }}>{edu.institution}</div>
                        {edu.gpa && <div className="text-xs" style={{ color: colors.textSecondary }}>GPA: {edu.gpa}</div>}
                      </div>
                      <div className="text-xs text-right" style={{ color: colors.textSecondary }}>
                        <div>{edu.graduationDate}</div>
                        {edu.location && <div>{edu.location}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-lg font-bold uppercase tracking-wider mb-4 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Projects
              </h2>
              <div className="space-y-3">
                {data.projects.map((project, index) => (
                  <div key={index}>
                    <h3 className="text-base font-semibold" style={{ color: colors.text }}>{project.name}</h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>{project.description}</p>
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                        <span className="font-medium">Technologies:</span> {project.techStack.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Experience */}
          {data.volunteer && data.volunteer.length > 0 && (
            <div className="mb-6">
              <h2 
                className="text-lg font-bold uppercase tracking-wider mb-4 pb-2"
                style={{ 
                  borderBottom: `2px solid ${colors.primary}`,
                  color: colors.text,
                  fontFamily: fonts.heading
                }}
              >
                Volunteer Experience
              </h2>
              <div className="space-y-4">
                {data.volunteer.map((vol, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: colors.text }}>{vol.role}</h3>
                        <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>{vol.organization}</div>
                      </div>
                      <div className="text-xs text-right" style={{ color: colors.textSecondary }}>
                        {vol.location && <div>{vol.location}</div>}
                        {(vol.startDate || vol.endDate) && (
                          <div>
                            {vol.startDate} - {vol.current ? 'Present' : vol.endDate}
                          </div>
                        )}
                      </div>
                    </div>
                    {vol.description && (
                      <p className="text-sm" style={{ color: colors.textSecondary }}>{vol.description}</p>
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
                <div key={index} className="mb-6">
                  <h2 
                    className="text-lg font-bold uppercase tracking-wider mb-4 pb-2"
                    style={{ 
                      borderBottom: `2px solid ${colors.primary}`,
                      color: colors.text,
                      fontFamily: fonts.heading
                    }}
                  >
                    {section.title}
                  </h2>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: colors.textSecondary }}>
                    {section.content}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
