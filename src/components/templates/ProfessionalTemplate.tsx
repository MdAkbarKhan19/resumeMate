import { ResumeData } from '@/types/resume';
import { TemplateProps, DEFAULT_CUSTOMIZATION, getSpacingValues, getColorScheme } from '@/types/template';

export default function ProfessionalTemplate({ 
  data, 
  customization = DEFAULT_CUSTOMIZATION,
  preview = false 
}: TemplateProps) {
  const colors = getColorScheme(customization?.primaryColor);
  const fonts = { heading: customization?.fontFamily || 'Inter', body: customization?.fontFamily || 'Inter' };
  const spacing = getSpacingValues(customization?.spacing);
  return (
    <div className="resume-template professional bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-gray-800 text-white p-8">
          <h1 className="text-4xl font-bold mb-2">
            {data.personalInfo.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {data.personalInfo.email && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {data.personalInfo.email}
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {data.personalInfo.phone}
              </div>
            )}
            {data.personalInfo.location && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {data.personalInfo.location}
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center text-xs">
                <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                {data.personalInfo.linkedin}
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Professional Summary */}
          {data.summary && (
            <div className="mb-8">
              <div className="flex items-center mb-3">
                <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Summary</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed pl-15">
                {data.summary}
              </p>
            </div>
          )}

          {/* Professional Experience */}
          {data.experience && data.experience.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Experience</h2>
              </div>
              <div className="pl-15 space-y-5">
                {data.experience.map((exp, index) => (
                  <div key={index} className="relative border-l-2 border-gray-300 pl-6">
                    <div className="absolute w-3 h-3 bg-gray-800 rounded-full -left-[7px] top-1"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{exp.jobTitle}</h3>
                        <div className="text-sm font-semibold text-gray-700">{exp.company}</div>
                        {exp.location && <div className="text-xs text-gray-600">{exp.location}</div>}
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </div>
                    </div>
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
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Education</h2>
              </div>
              <div className="pl-15 space-y-4">
                {data.education.map((edu, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{edu.degree}</h3>
                      <div className="text-sm text-gray-700">{edu.institution}</div>
                      {edu.location && <div className="text-xs text-gray-600">{edu.location}</div>}
                      {edu.gpa && <div className="text-sm text-gray-700 mt-1">GPA: {edu.gpa}</div>}
                      {edu.honors && <div className="text-sm text-gray-700 italic">{edu.honors}</div>}
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                      {edu.graduationDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Certifications - Side by side */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                  <h2 className="text-xl font-bold text-gray-900 uppercase">Skills</h2>
                </div>
                <div className="pl-15">
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                  <h2 className="text-xl font-bold text-gray-900 uppercase">Certifications</h2>
                </div>
                <div className="pl-15 space-y-2">
                  {data.certifications.map((cert, index) => (
                    <div key={index}>
                      <div className="text-sm font-semibold text-gray-900">{cert.name}</div>
                      <div className="text-xs text-gray-600">{cert.issuer} • {cert.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-12 bg-gray-800 mr-3"></div>
                <h2 className="text-xl font-bold text-gray-900 uppercase">Projects</h2>
              </div>
              <div className="pl-15 space-y-4">
                {data.projects.map((project, index) => (
                  <div key={index}>
                    <h3 className="text-base font-bold text-gray-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                          >
                            {tech}
                          </span>
                        ))}
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
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                Volunteer Experience
              </h2>
              <div className="space-y-4">
                {data.volunteer.map((vol, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{vol.role}</h3>
                        <div className="text-sm text-gray-700">{vol.organization}</div>
                      </div>
                      <div className="text-sm text-gray-600 text-right">
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
            </div>
          )}

          {/* Custom Sections */}
          {data.customSections && data.customSections.length > 0 && (
            <>
              {data.customSections.map((section, index) => (
                <div key={index} className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
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
      </div>
    </div>
  );
}
