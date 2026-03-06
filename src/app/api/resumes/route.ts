import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schemas
const createResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  templateId: z.string().min(1, 'Template ID is required'),
  customization: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    fontFamily: z.enum(['Inter', 'Roboto', 'Georgia', 'Arial']).optional(),
    fontSize: z.number().optional(),
    spacing: z.enum(['compact', 'normal', 'spacious']).optional(),
    sectionOrder: z.array(z.string()).optional(),
  }).optional(),
  personalInfo: z.object({
    fullName: z.string().min(1),
    title: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
  }),
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
  awards: z.array(
    z.object({
      title: z.string(),
      issuer: z.string(),
      date: z.string().optional(),
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
});

// GET - List all resumes for authenticated user
async function handleListResumes(request: NextRequest, { user }: { user: any }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const order = searchParams.get('order') || 'desc';

    const skip = (page - 1) * limit;

    console.log('[ListResumes] userId:', user.id, 'page:', page, 'limit:', limit);

    const where: Prisma.ResumeWhereInput = {
      userId: user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { personalInfo: { path: ['fullName'], string_contains: search } },
        ],
      }),
    };

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          title: true,
          templateId: true,
          customization: true,
          personalInfo: true,
          summary: true,
          experience: true,
          education: true,
          skills: true,
          projects: true,
          certifications: true,
          // Removed template include - using code-based templates
          atsScore: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.resume.count({ where }),
    ]);

    console.log('[ListResumes] Found', total, 'resumes, returning', resumes.length, 'for page', page);

    return NextResponse.json({
      success: true,
      data: {
        resumes: resumes.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List resumes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch resumes',
        },
      },
      { status: 500 }
    );
  }
}

// POST - Create new resume
async function handleCreateResume(request: NextRequest, { user }: { user: any }) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createResumeSchema.safeParse(body);
    if (!validation.success) {
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

    // Check plan limits
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planType: true,
        resumesCreated: true,
        resumeCredits: true,
        subscriptionActive: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    // Check limits
    if (currentUser.planType === 'FREE' && currentUser.resumesCreated >= 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LIMIT_REACHED',
            message: 'Free plan allows only 1 resume. Please upgrade to create more.',
          },
        },
        { status: 403 }
      );
    }

    if (currentUser.planType === 'TIER1' && currentUser.resumeCredits <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREDITS_EXHAUSTED',
            message: 'You have used all your resume credits. Please purchase more.',
          },
        },
        { status: 403 }
      );
    }

    // Template validation removed - using code-based templates, not database templates

    // Create resume
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        templateId: data.templateId, // Use the template ID from request (e.g., 'modern-two-column')
        title: data.title,
        customization: data.customization as any,
        personalInfo: data.personalInfo as Prisma.JsonObject,
        summary: data.summary || null,
        experience: (data.experience || []) as Prisma.JsonArray,
        education: (data.education || []) as Prisma.JsonArray,
        skills: (data.skills || []) as Prisma.JsonArray,
        certifications: (data.certifications || []) as Prisma.JsonArray,
        projects: (data.projects || []) as Prisma.JsonArray,
        languages: (data.languages || []) as Prisma.JsonArray,
        volunteer: (data.volunteer || []) as Prisma.JsonArray,
        awards: (data.awards || []) as Prisma.JsonArray,
        customSections: (data.customSections || []) as Prisma.JsonArray,
        sectionOrder: (data.sectionOrder || []) as Prisma.JsonArray,
      },
      // Removed template include - using code-based templates
    });

    // Update user credits
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resumesCreated: { increment: 1 },
        ...(currentUser.planType === 'TIER1' && {
          resumeCredits: { decrement: 1 },
        }),
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'resume_created',
        resource: 'resume',
        resourceId: resume.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          resume: {
            ...resume,
            createdAt: resume.createdAt.toISOString(),
            updatedAt: resume.updatedAt.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create resume error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create resume',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleListResumes);
export const POST = withAuth(handleCreateResume);
