import { ResumeData } from '@/types/resume';
import { TemplateProps, DEFAULT_CUSTOMIZATION, getSpacingValues, getColorScheme } from '@/types/template';

export default function MinimalistTemplate({ 
  data, 
  customization = DEFAULT_CUSTOMIZATION,
  preview = false 
}: TemplateProps) {
  const colors = getColorScheme(customization?.primaryColor);
  const fonts = { heading: customization?.fontFamily || 'Inter', body: customization?.fontFamily || 'Inter' };
  const spacing = getSpacingValues(customization?.spacing);

  return (
    <div 
      className={`resume-template minimalist bg-white ${preview ? 'shadow-lg' : ''}`}
      style={{
        fontFamily: fonts.body,
        fontSize: `${spacing.fontSize}pt`,
        width: preview ? '100%' : '8.5in',
        minHeight: preview ? 'auto' : '11in',
        padding: `${spacing.marginY}px ${spacing.marginX}px`,
        color: colors.text
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-6" style={{ borderBottom: `1px solid ${colors.text}` }}>
        <h1 
          className="text-4xl font-bold mb-3"
          style={{ 
            fontFamily: fonts.heading,
            color: colors.text
          }}
        >
          {data.personalInfo.name}
        </h1>
        {data.personalInfo.title && (
          <div 
            className="text-lg font-medium mb-3"
            style={{ color: colors.primary }}
          >
            {data.personalInfo.title}
          </div>
        )}
        <div className="flex justify-center items-center flex-wrap gap-4 text-sm" style={{ color: colors.textSecondary }}>
          {data.personalInfo.email && (
            <span>{data.personalInfo.email}</span>
          )}
          {data.personalInfo.phone && (
            <>
              {data.personalInfo.email && <span>•</span>}
              <span>{data.personalInfo.phone}</span>
            </>
          )}
          {data.personalInfo.location && (
            <>
              {(data.personalInfo.email || data.personalInfo.phone) && <span>•</span>}
              <span>{data.personalInfo.location}</span>
            </>
          )}
          {data.personalInfo.linkedin && (
            <>
              {(data.personalInfo.email || data.personalInfo.phone || data.personalInfo.location) && <span>•</span>}
              <span className="text-xs">{data.personalInfo.linkedin}</span>
            </>
          )}
        </div>
      </div>

        {/* Professional Summary */}
        {data.summary && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Professional Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {data.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{exp.jobTitle}</h3>
                      <div className="text-sm font-semibold text-gray-700">{exp.company}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </div>
                  </div>
                  {exp.location && (
                    <div className="text-sm text-gray-600 mb-2">{exp.location}</div>
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1.5 text-sm text-gray-700">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="leading-relaxed">{bullet}</li>
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
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Education
            </h2>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{edu.degree}</h3>
                      <div className="text-sm text-gray-700">{edu.institution}</div>
                    </div>
                    <div className="text-sm text-gray-600">{edu.graduationDate}</div>
                  </div>
                  {edu.location && (
                    <div className="text-sm text-gray-600">{edu.location}</div>
                  )}
                  {edu.gpa && (
                    <div className="text-sm text-gray-600">GPA: {edu.gpa}</div>
                  )}
                  {edu.honors && (
                    <div className="text-sm text-gray-700 italic">{edu.honors}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Skills
            </h2>
            <div className="space-y-3">
              {/* Group skills by category */}
              {Object.entries(
                data.skills.reduce((acc: Record<string, string[]>, skill) => {
                  const category = skill.category || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(skill.name);
                  return acc;
                }, {})
              ).map(([category, skillNames]) => (
                <div key={category}>
                  <span className="text-sm font-semibold text-gray-900 capitalize">
                    {category.charAt(0).toUpperCase() + category.slice(1)} Skills:
                  </span>
                  <span className="text-sm text-gray-700 ml-2">
                    {skillNames.join(' • ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Certifications
            </h2>
            <div className="space-y-2">
              {data.certifications.map((cert, index) => (
                <div key={index} className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{cert.name}</span>
                    <span className="text-sm text-gray-600"> - {cert.issuer}</span>
                  </div>
                  <div className="text-sm text-gray-600">{cert.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Projects
            </h2>
            <div className="space-y-4">
              {data.projects.map((project, index) => (
                <div key={index}>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-700 mb-1">{project.description}</p>
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold">Technologies:</span> {project.techStack.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Languages
            </h2>
            <div className="text-sm text-gray-700">
              {data.languages.map((lang, index) => (
                <span key={index}>
                  {lang.name} ({lang.proficiency})
                  {index < data.languages.length - 1 && ' • '}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Volunteer Experience */}
        {data.volunteer && data.volunteer.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Volunteer Experience
            </h2>
            {data.volunteer.map((vol, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{vol.role}</h3>
                    <div className="text-gray-700">{vol.organization}</div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {vol.location && <div>{vol.location}</div>}
                    {(vol.startDate || vol.endDate) && (
                      <div>
                        {vol.startDate} - {vol.current ? 'Present' : vol.endDate}
                      </div>
                    )}
                  </div>
                </div>
                {vol.description && (
                  <p className="text-sm text-gray-700">{vol.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Custom Sections */}
        {data.customSections && data.customSections.length > 0 && (
          <>
            {data.customSections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  {section.title}
                </h2>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            ))}
          </>
        )}
    </div>
  );
}
