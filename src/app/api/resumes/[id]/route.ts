import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schema
const updateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  templateId: z.string().optional(),
  customization: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.union([z.number(), z.string()]).optional(),
    spacing: z.string().optional(),
    sectionOrder: z.array(z.string()).optional(),
  }).passthrough().optional(),
  personalInfo: z.object({
    fullName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional().or(z.literal('')),
    website: z.string().optional().or(z.literal('')),
    github: z.string().optional().or(z.literal('')),
  }).optional(),
  summary: z.string().optional(),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      bullets: z.array(z.string()),
    })
  ).optional(),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      gpa: z.string().optional(),
    })
  ).optional(),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    })
  ).optional(),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      date: z.string().optional(),
      expiryDate: z.string().optional(),
      credentialId: z.string().optional(),
      url: z.string().optional().or(z.literal('')),
    })
  ).optional(),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()).optional(),
      url: z.string().optional().or(z.literal('')),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ).optional(),
  languages: z.array(
    z.object({
      name: z.string(),
      proficiency: z.string(),
    })
  ).optional(),
  volunteer: z.array(
    z.object({
      role: z.string(),
      organization: z.string(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.string().optional(),
    })
  ).optional(),
  customSections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
    })
  ).optional(),
  sectionOrder: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      title: z.string(),
      enabled: z.boolean(),
    })
  ).optional(),
  atsScore: z.number().min(0).max(100).optional(),
});

// GET - Get single resume
async function getResume(
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
      // Removed template include - using code-based templates
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_NOT_FOUND',
            message: 'Resume not found',
          },
        },
        { status: 404 }
      );
    }

    // Check ownership
    if (resume.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this resume',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        resume: {
          ...resume,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch resume',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH - Update resume
async function updateResume(
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) {
  try {
    const body = await request.json();
    
    console.log('📝 Received resume update request:', JSON.stringify(body, null, 2));

    // Validate input
    const validation = updateResumeSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid resume data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check resume exists and ownership
    const existingResume = await prisma.resume.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingResume) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_NOT_FOUND',
            message: 'Resume not found',
          },
        },
        { status: 404 }
      );
    }

    if (existingResume.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this resume',
          },
        },
        { status: 403 }
      );
    }

    // Template ID validation removed - using code-based templates, not database templates

    // Update resume - build update object with only provided fields
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.personalInfo !== undefined) updateData.personalInfo = data.personalInfo;
    if (data.customization !== undefined) updateData.customization = data.customization;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.projects !== undefined) updateData.projects = data.projects;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.volunteer !== undefined) updateData.volunteer = data.volunteer;
    if (data.customSections !== undefined) updateData.customSections = data.customSections;
    if (data.sectionOrder !== undefined) updateData.sectionOrder = data.sectionOrder;
    if (data.atsScore !== undefined) updateData.atsScore = data.atsScore;

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: updateData,
      // Removed template include - using code-based templates
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'resume_updated',
        resource: 'resume',
        resourceId: resume.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        resume: {
          ...resume,
          createdAt: resume.createdAt.toISOString(),
          updatedAt: resume.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update resume',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete resume
async function deleteResume(
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) {
  try {
    // Check resume exists and ownership
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
      select: { userId: true, title: true },
    });

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESUME_NOT_FOUND',
            message: 'Resume not found',
          },
        },
        { status: 404 }
      );
    }

    if (resume.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this resume',
          },
        },
        { status: 403 }
      );
    }

    // Delete resume (cascade will delete related records)
    await prisma.resume.delete({
      where: { id: params.id },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'resume_deleted',
        resource: 'resume',
        resourceId: params.id,
        metadata: { title: resume.title } as Prisma.JsonObject,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Resume deleted successfully',
      },
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete resume',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth((request: NextRequest, context: { user: any; params?: { id: string } }) =>
  getResume(request, { params: context.params || { id: '' }, user: context.user })
);

export const PATCH = withAuth((request: NextRequest, context: { user: any; params?: { id: string } }) =>
  updateResume(request, { params: context.params || { id: '' }, user: context.user })
);

export const DELETE = withAuth((request: NextRequest, context: { user: any; params?: { id: string } }) =>
  deleteResume(request, { params: context.params || { id: '' }, user: context.user })
);
