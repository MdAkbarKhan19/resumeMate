import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { DEFAULT_CUSTOMIZATION } from '@/types/template';
import { EnhancedPDFService } from '@/lib/export/enhanced-pdf';

/**
 * Enhanced PDF Export Endpoint
 * Generates pixel-perfect PDF that matches the web preview exactly
 */
async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const resumeId = params.id;
    const userId = (request as any).user?.sub;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Verify ownership
    if (resume.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse JSON fields to ResumeData format
    const personalInfo = resume.personalInfo as any || {};
    const experience = (resume.experience as any) || [];
    const education = (resume.education as any) || [];
    const skills = (resume.skills as any) || [];
    const certifications = (resume.certifications as any) || [];
    const projects = (resume.projects as any) || [];

    const resumeData = {
      personalInfo: {
        name: personalInfo.name || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        location: personalInfo.location || '',
        linkedin: personalInfo.linkedin || undefined,
        portfolio: personalInfo.portfolio || undefined,
        github: personalInfo.github || undefined,
      },
      summary: resume.summary || '',
      experience: Array.isArray(experience) ? experience : [],
      education: Array.isArray(education) ? education : [],
      skills: Array.isArray(skills) ? skills : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      projects: Array.isArray(projects) ? projects : [],
      languages: [],
      volunteer: [],
    };

    // Get template and customization
    const templateId = resume.templateId || 'modern-two-column';
    const customization = resume.customization 
      ? (typeof resume.customization === 'object' 
          ? resume.customization 
          : JSON.parse(resume.customization as string))
      : DEFAULT_CUSTOMIZATION;

    // Generate PDF using enhanced service
    const pdfBuffer = await EnhancedPDFService.generatePDF(
      resumeData,
      templateId,
      customization as any
    );

    // Create filename
    const fileName = `${personalInfo.name?.replace(/\s+/g, '_') || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth((request: NextRequest, context: { user: any; params?: { id: string } }) => 
  handler(request, { params: context.params || { id: '' } })
);
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for PDF generation
