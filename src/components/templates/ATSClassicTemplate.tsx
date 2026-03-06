/**
 * ATS Classic Template
 * Maximum ATS parseability - single column, no colors, standard fonts
 * Designed to pass all automated screening systems
 */
'use client';

import React from 'react';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization } from '@/types/template';

interface ATSClassicTemplateProps {
  data: ResumeData;
  customization?: TemplateCustomization;
}

const ATSClassicTemplate: React.FC<ATSClassicTemplateProps> = ({ data }) => {
  const { personalInfo, summary, experience, education, skills, certifications, projects, languages, volunteer } = data;

  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="resume-template ats-classic bg-white" style={{ fontFamily: 'Arial, Helvetica, sans-serif', width: '210mm', minHeight: '297mm', padding: '20mm 18mm', color: '#000', fontSize: '11pt', lineHeight: '1.35' }}>

      {/* Header - Name centered, contact info on one line */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {personalInfo.name || 'Your Name'}
        </h1>
        {personalInfo.title && (
          <p style={{ fontSize: '12pt', margin: '0 0 6px 0', color: '#333' }}>{personalInfo.title}</p>
        )}
        <p style={{ fontSize: '9.5pt', margin: 0, color: '#444' }}>
          {[
            personalInfo.email,
            personalInfo.phone,
            personalInfo.location,
            personalInfo.linkedin,
            personalInfo.github,
            personalInfo.portfolio,
          ].filter(Boolean).join(' | ')}
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1.5px solid #000', margin: '10px 0' }} />

      {/* Summary */}
      {summary && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            PROFESSIONAL SUMMARY
          </h2>
          <p style={{ margin: 0, fontSize: '10.5pt' }}>{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            EXPERIENCE
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '11pt' }}>{exp.jobTitle}</strong>
                <span style={{ fontSize: '9.5pt', color: '#444' }}>
                  {exp.startDate}{exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <em style={{ fontSize: '10.5pt', color: '#333' }}>{exp.company}</em>
                {exp.location && <span style={{ fontSize: '9.5pt', color: '#555' }}>{exp.location}</span>}
              </div>
              {exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                  {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                    <li key={i} style={{ fontSize: '10.5pt', marginBottom: '2px' }}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            EDUCATION
          </h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '11pt' }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</strong>
                <span style={{ fontSize: '9.5pt', color: '#444' }}>{edu.graduationDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <em style={{ fontSize: '10.5pt', color: '#333' }}>{edu.institution}</em>
                {edu.gpa && <span style={{ fontSize: '9.5pt' }}>GPA: {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            SKILLS
          </h2>
          {Object.entries(skillsByCategory).map(([category, items]) => (
            <p key={category} style={{ margin: '0 0 3px 0', fontSize: '10.5pt' }}>
              <strong style={{ textTransform: 'capitalize' }}>{category}:</strong> {items.join(', ')}
            </p>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            PROJECTS
          </h2>
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <strong style={{ fontSize: '11pt' }}>{proj.name}</strong>
              {proj.url && <span style={{ fontSize: '9pt', color: '#444', marginLeft: '8px' }}>{proj.url}</span>}
              <p style={{ margin: '2px 0', fontSize: '10.5pt' }}>{proj.description}</p>
              {proj.techStack.length > 0 && (
                <p style={{ margin: '2px 0', fontSize: '9.5pt', color: '#444' }}>Technologies: {proj.techStack.join(', ')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            CERTIFICATIONS
          </h2>
          {certifications.map((cert) => (
            <p key={cert.id} style={{ margin: '0 0 3px 0', fontSize: '10.5pt' }}>
              <strong>{cert.name}</strong> - {cert.issuer}{cert.date ? ` (${cert.date})` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            LANGUAGES
          </h2>
          <p style={{ margin: 0, fontSize: '10.5pt' }}>
            {languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(', ')}
          </p>
        </div>
      )}

      {/* Volunteer */}
      {volunteer.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
            VOLUNTEER EXPERIENCE
          </h2>
          {volunteer.map((vol) => (
            <div key={vol.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '11pt' }}>{vol.role}</strong>
                <span style={{ fontSize: '9.5pt', color: '#444' }}>
                  {vol.startDate}{vol.endDate ? ` - ${vol.endDate}` : vol.current ? ' - Present' : ''}
                </span>
              </div>
              <em style={{ fontSize: '10.5pt', color: '#333' }}>{vol.organization}</em>
              {vol.description && <p style={{ margin: '2px 0', fontSize: '10.5pt' }}>{vol.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ATSClassicTemplate;
