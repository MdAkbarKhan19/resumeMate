/**
 * Executive Template
 * Professional dark header, subtle design, ideal for senior/executive roles
 * Single-column body for ATS compatibility with elegant styling
 */
'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization } from '@/types/template';

interface ExecutiveTemplateProps {
  data: ResumeData;
  customization?: TemplateCustomization;
}

const ExecutiveTemplate: React.FC<ExecutiveTemplateProps> = ({ data, customization }) => {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;
  const accentColor = customization?.primaryColor || '#1a365d';

  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="resume-template executive bg-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", width: '210mm', minHeight: '297mm', color: '#1a1a1a', fontSize: '10.5pt', lineHeight: '1.4' }}>

      {/* Dark Header */}
      <div style={{ background: accentColor, color: '#fff', padding: '28px 24mm 22px', marginBottom: '0' }}>
        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
          {personalInfo.name || 'Your Name'}
        </h1>
        {personalInfo.title && (
          <p style={{ fontSize: '13pt', margin: '0 0 12px 0', opacity: 0.9, fontStyle: 'italic' }}>{personalInfo.title}</p>
        )}
        <div style={{ fontSize: '9pt', opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          {personalInfo.github && <span>{personalInfo.github}</span>}
          {personalInfo.portfolio && <span>{personalInfo.portfolio}</span>}
        </div>
      </div>

      <div style={{ padding: '16px 24mm 20mm' }}>

        {/* Summary */}
        {summary && (
          <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: `2px solid ${accentColor}` }}>
            <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic', color: '#333', lineHeight: '1.5' }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
              Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: '11.5pt', fontWeight: 'bold', margin: 0, color: '#111' }}>{exp.jobTitle}</h3>
                  <span style={{ fontSize: '9pt', color: '#666', whiteSpace: 'nowrap' }}>
                    {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                  </span>
                </div>
                <p style={{ margin: '1px 0 4px', fontSize: '10pt', color: '#555' }}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ''}
                </p>
                {exp.bullets.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyle: 'disc' }}>
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <li key={i} style={{ fontSize: '10pt', marginBottom: '2px', color: '#222' }}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
              Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '11pt' }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</strong>
                  <span style={{ fontSize: '9pt', color: '#666' }}>{edu.graduationDate}</span>
                </div>
                <p style={{ margin: '1px 0', fontSize: '10pt', color: '#555' }}>
                  {edu.institution}{edu.gpa ? ` - GPA: ${edu.gpa}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
              Skills & Expertise
            </h2>
            {Object.entries(skillsByCategory).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'capitalize', color: '#333' }}>{category}: </span>
                <span style={{ fontSize: '10pt' }}>
                  {items.map((item, i) => (
                    <span key={i}>
                      <span style={{ display: 'inline-block', padding: '1px 8px', margin: '2px 3px', background: '#f0f4f8', borderRadius: '3px', fontSize: '9.5pt' }}>{item}</span>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
              Key Projects
            </h2>
            {projects.map((proj) => (
              <div key={proj.id} style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '10.5pt' }}>{proj.name}</strong>
                <p style={{ margin: '2px 0', fontSize: '10pt', color: '#333' }}>{proj.description}</p>
                {proj.techStack.length > 0 && (
                  <p style={{ margin: '2px 0', fontSize: '9pt', color: '#666' }}>{proj.techStack.join(' / ')}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
              Certifications
            </h2>
            {certifications.map((cert) => (
              <p key={cert.id} style={{ margin: '0 0 4px', fontSize: '10pt' }}>
                <strong>{cert.name}</strong> - {cert.issuer}{cert.date ? ` (${cert.date})` : ''}
              </p>
            ))}
          </div>
        )}

        {/* Languages + Volunteer */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {languages.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
                Languages
              </h2>
              {languages.map((lang) => (
                <p key={lang.id} style={{ margin: '0 0 2px', fontSize: '10pt' }}>
                  {lang.name}{lang.proficiency ? ` - ${lang.proficiency}` : ''}
                </p>
              ))}
            </div>
          )}
          {volunteer.length > 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '13pt', fontWeight: 'bold', color: accentColor, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: `1px solid #ddd`, paddingBottom: '4px' }}>
                Community
              </h2>
              {volunteer.map((vol) => (
                <p key={vol.id} style={{ margin: '0 0 4px', fontSize: '10pt' }}>
                  <strong>{vol.role}</strong> at {vol.organization}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
