/**
 * Tech Modern Template
 * Clean modern design with subtle left accent bar
 * Skills as grouped tags, GitHub/portfolio prominent
 * Ideal for tech/developer roles
 */
'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization } from '@/types/template';

interface TechModernTemplateProps {
  data: ResumeData;
  customization?: TemplateCustomization;
}

const TechModernTemplate: React.FC<TechModernTemplateProps> = ({ data, customization }) => {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const accentColor = customization?.primaryColor || '#2563eb';

  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  const categoryLabels: Record<string, string> = {
    technical: 'Languages & Frameworks',
    tools: 'Tools & Platforms',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  return (
    <div className="resume-template tech-modern bg-white" style={{ fontFamily: "'Source Sans Pro', 'Segoe UI', sans-serif", width: '210mm', minHeight: '297mm', color: '#1f2937', fontSize: '10.5pt', lineHeight: '1.45' }}>

      {/* Header with accent bar */}
      <div style={{ display: 'flex', borderBottom: `3px solid ${accentColor}` }}>
        <div style={{ width: '4px', background: accentColor }} />
        <div style={{ flex: 1, padding: '20px 22mm 16px 18mm' }}>
          <h1 style={{ fontSize: '22pt', fontWeight: '700', margin: '0 0 4px 0', color: '#111827' }}>
            {personalInfo.name || 'Your Name'}
          </h1>
          {personalInfo.title && (
            <p style={{ fontSize: '13pt', margin: '0 0 10px 0', color: accentColor, fontWeight: '500' }}>{personalInfo.title}</p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '9pt', color: '#6b7280' }}>
            {personalInfo.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{personalInfo.email}</span>
            )}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.github && (
              <span style={{ color: accentColor, fontWeight: '600' }}>{personalInfo.github}</span>
            )}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
            {personalInfo.portfolio && (
              <span style={{ color: accentColor, fontWeight: '600' }}>{personalInfo.portfolio}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 22mm 20mm 18mm' }}>

        {/* Summary */}
        {summary && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '10.5pt', color: '#374151', lineHeight: '1.55' }}>{summary}</p>
          </div>
        )}

        {/* Skills - Tag style */}
        {skills.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
              Technical Skills
            </h2>
            {Object.entries(skillsByCategory).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '9.5pt', fontWeight: '600', color: '#6b7280', display: 'inline-block', minWidth: '140px' }}>
                  {categoryLabels[category] || category}:
                </span>
                <span>
                  {items.map((item, i) => (
                    <span key={i} style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      margin: '2px 3px',
                      background: `${accentColor}10`,
                      border: `1px solid ${accentColor}30`,
                      borderRadius: '4px',
                      fontSize: '9pt',
                      color: '#1f2937',
                    }}>
                      {item}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
              Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: `2px solid #e5e7eb` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: '11pt', fontWeight: '700', margin: 0, color: '#111827' }}>{exp.jobTitle}</h3>
                  <span style={{ fontSize: '9pt', color: '#9ca3af', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                  </span>
                </div>
                <p style={{ margin: '1px 0 5px', fontSize: '10pt', color: '#6b7280' }}>
                  {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                </p>
                {exp.bullets.length > 0 && (
                  <ul style={{ margin: '0', paddingLeft: '16px', listStyle: 'none' }}>
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <li key={i} style={{ fontSize: '10pt', marginBottom: '3px', color: '#374151', position: 'relative', paddingLeft: '12px' }}>
                        <span style={{ position: 'absolute', left: 0, color: accentColor, fontWeight: 'bold' }}>&#8250;</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
              Projects
            </h2>
            {projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: '10px', paddingLeft: '12px', borderLeft: `2px solid #e5e7eb` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <strong style={{ fontSize: '10.5pt' }}>{proj.name}</strong>
                  {proj.url && <span style={{ fontSize: '8.5pt', color: accentColor }}>{proj.url}</span>}
                </div>
                <p style={{ margin: '2px 0', fontSize: '10pt', color: '#4b5563' }}>{proj.description}</p>
                {proj.techStack.length > 0 && (
                  <div style={{ marginTop: '3px' }}>
                    {proj.techStack.map((tech, i) => (
                      <span key={i} style={{
                        display: 'inline-block', padding: '1px 6px', margin: '1px 2px',
                        background: '#f3f4f6', borderRadius: '3px', fontSize: '8.5pt', color: '#4b5563',
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
              Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: '6px', paddingLeft: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '10.5pt' }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</strong>
                  <span style={{ fontSize: '9pt', color: '#9ca3af', fontFamily: 'monospace' }}>{edu.graduationDate}</span>
                </div>
                <p style={{ margin: '1px 0', fontSize: '10pt', color: '#6b7280' }}>
                  {edu.institution}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Certifications + Languages row */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {certifications.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
                Certifications
              </h2>
              {certifications.map((cert) => (
                <p key={cert.id} style={{ margin: '0 0 3px', fontSize: '10pt', paddingLeft: '12px' }}>
                  <strong>{cert.name}</strong> - {cert.issuer}
                </p>
              ))}
            </div>
          )}
          {languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
                Languages
              </h2>
              {languages.map((lang) => (
                <p key={lang.id} style={{ margin: '0 0 2px', fontSize: '10pt', paddingLeft: '12px' }}>
                  {lang.name}{lang.proficiency ? ` - ${lang.proficiency}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Volunteer */}
        {volunteer.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <h2 style={{ fontSize: '11.5pt', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '3px', height: '16px', background: accentColor, display: 'inline-block', borderRadius: '2px' }} />
              Volunteer
            </h2>
            {volunteer.map((vol) => (
              <p key={vol.id} style={{ margin: '0 0 3px', fontSize: '10pt', paddingLeft: '12px' }}>
                <strong>{vol.role}</strong> at {vol.organization}
                {vol.description ? ` - ${vol.description}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechModernTemplate;
