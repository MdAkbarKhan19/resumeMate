import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { DEFAULT_CUSTOMIZATION } from '@/types/template';
import { EnhancedDOCXService } from '@/lib/export/enhanced-docx';

async function handler(
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
): Promise<NextResponse> {
  try {
    const resumeId = params.id;
    const userId = user?.sub || user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const personalInfo = resume.personalInfo as any || {};
    const experience = (resume.experience as any) || [];
    const education = (resume.education as any) || [];
    const skills = (resume.skills as any) || [];
    const certifications = (resume.certifications as any) || [];
    const projects = (resume.projects as any) || [];
    const languages = (resume.languages as any) || [];
    const volunteer = ((resume as any).volunteer as any) || [];
    const customSections = ((resume as any).customSections as any) || [];

    const normalizeSkillCat = (c: string | undefined): string => {
      if (!c) return 'technical';
      const cat = c.toLowerCase().trim();
      if (/^(soft|interpersonal|leadership|communication)/.test(cat) || cat.includes('soft skill')) return 'soft';
      if (/^(language|spoken)/.test(cat) && !cat.includes('programming')) return 'language';
      if (/(tool|platform|software|devops|cloud|database|operating)/.test(cat)) return 'tools';
      return 'technical';
    };

    const normalizedSkills = Array.isArray(skills)
      ? skills.flatMap((skill: any) => {
          if (skill.items && Array.isArray(skill.items)) {
            return skill.items.map((item: string) => ({
              id: String(Math.random()),
              name: item,
              category: normalizeSkillCat(skill.category),
            }));
          }
          if (skill.keywords && Array.isArray(skill.keywords)) {
            return skill.keywords.map((keyword: string) => ({
              id: String(Math.random()),
              name: keyword,
              category: normalizeSkillCat(skill.category),
            }));
          }
          return {
            id: skill.id || String(Math.random()),
            name: skill.name || skill.skill || '',
            category: normalizeSkillCat(skill.category),
          };
        })
      : [];

    // Normalize experience data: map DB fields to template fields
    const normalizedExperience = Array.isArray(experience) 
      ? experience.map((exp: any) => ({
          id: exp.id || String(Math.random()),
          jobTitle: exp.jobTitle || exp.position || '',  // Map position -> jobTitle
          company: exp.company || '',
          location: exp.location || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          current: exp.current || false,
          bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
        }))
      : [];

    // Normalize education data: map DB fields to template fields
    const normalizedEducation = Array.isArray(education)
      ? education.map((edu: any) => ({
          id: edu.id || String(Math.random()),
          degree: edu.degree || '',
          institution: edu.institution || '',
          field: edu.field || '',
          location: edu.location || '',
          startDate: edu.startDate || '',
          graduationDate: edu.graduationDate || edu.endDate || '',  // Map endDate -> graduationDate
          gpa: edu.gpa || '',
        }))
      : [];

    // Normalize projects data: map DB fields to template fields
    const normalizedProjects = Array.isArray(projects)
      ? projects.map((proj: any) => ({
          id: proj.id || String(Math.random()),
          name: proj.name || '',
          description: proj.description || '',
          techStack: Array.isArray(proj.technologies) 
            ? proj.technologies  // Map technologies -> techStack
            : Array.isArray(proj.techStack) 
            ? proj.techStack 
            : [],
          url: proj.url || '',
          startDate: proj.startDate || '',
          endDate: proj.endDate || '',
        }))
      : [];

    // Normalize certifications data
    const normalizedCertifications = Array.isArray(certifications)
      ? certifications.map((cert: any) => ({
          id: cert.id || String(Math.random()),
          name: cert.name || '',
          issuer: cert.issuer || '',
          date: cert.date || '',
          expiryDate: cert.expiryDate || '',
          credentialId: cert.credentialId || '',
          url: cert.url || '',
        }))
      : [];

    // Normalize languages data
    const normalizedLanguages = Array.isArray(languages)
      ? languages.map((lang: any) => ({
          id: lang.id || String(Math.random()),
          name: lang.name || '',
          proficiency: lang.proficiency || '',
        }))
      : [];

    const resumeData = {
      personalInfo: {
        name: personalInfo.name || personalInfo.fullName || '',
        title: personalInfo.title || '',  // Professional title/designation
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        location: personalInfo.location || '',
        linkedin: personalInfo.linkedin || undefined,
        portfolio: personalInfo.portfolio || personalInfo.website || undefined,
        github: personalInfo.github || undefined,
      },
      summary: resume.summary || '',
      experience: normalizedExperience,
      education: normalizedEducation,
      skills: normalizedSkills,
      certifications: normalizedCertifications,
      projects: normalizedProjects,
      languages: normalizedLanguages,
      volunteer: Array.isArray(volunteer)
        ? volunteer.map((vol: any) => ({
            id: vol.id || String(Math.random()),
            role: vol.role || '',
            organization: vol.organization || '',
            location: vol.location || '',
            startDate: vol.startDate || '',
            endDate: vol.endDate || '',
            current: vol.current || false,
            description: vol.description || '',
          }))
        : [],
      customSections: Array.isArray(customSections) ? customSections : [],
    };

    const templateId = resume.templateId || 'modern-two-column';
    const customization = resume.customization 
      ? (typeof resume.customization === 'object' 
          ? resume.customization 
          : JSON.parse(resume.customization as string))
      : DEFAULT_CUSTOMIZATION;

    const docxBuffer = await EnhancedDOCXService.generateDOCX(
      resumeData,
      templateId,
      customization as any
    );

    if (!EnhancedDOCXService.isValidDOCX(docxBuffer)) {
      throw new Error('Generated DOCX file is invalid');
    }

    const fileName = `${personalInfo.name?.replace(/\s+/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.docx`;

    return new NextResponse(docxBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': docxBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate DOCX',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth((request: NextRequest, context: { user: any; params?: { id: string } }) => 
  handler(request, { params: context.params || { id: '' }, user: context.user })
);
export const dynamic = 'force-dynamic';
export const maxDuration = 60;