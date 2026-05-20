import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { S3Service } from '@/lib/aws/s3';
import { ResumeParserService } from '@/lib/resume/parser';
import { canCreateResume } from '@/lib/payment/entitlements';

export async function POST(request: NextRequest) {
  // Authenticate request
  const auth = await authenticateRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication required',
      },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = (formData.get('templateId') as string) || 'modern-two-column';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('Validation passed, starting parsing...');

    // Enforce plan limit BEFORE expensive S3 upload + parsing.
    const gate = await canCreateResume(auth.user.id);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: gate.code || 'LIMIT_REACHED',
            message: gate.reason || 'Resume limit reached on your current plan.',
            tier: gate.tier,
            used: gate.used,
            limit: gate.limit,
          },
        },
        { status: 403 },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3 (non-blocking - don't fail import if S3 is unavailable)
    try {
      const s3Key = await S3Service.uploadFile(buffer, file.name, file.type);
      console.log('Uploaded to S3:', s3Key);
    } catch (s3Error) {
      console.warn('S3 upload failed, continuing with parsing:', s3Error);
    }

    // Parse resume based on file type
    let parsedData: any;
    try {
      if (file.type === 'application/pdf') {
        parsedData = await ResumeParserService.parsePDF(buffer);
      } else {
        parsedData = await ResumeParserService.parseDOCX(buffer);
      }
      console.log('Parsing complete');
    } catch (parseError: any) {
      console.error('Parsing error:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse resume content',
        },
        { status: 500 }
      );
    }

    // Create resume in database
    const resume = await prisma.resume.create({
      data: {
        userId: auth.user.id,
        title: parsedData.personalInfo?.fullName || parsedData.personalInfo?.name || 'Imported Resume',
        templateId: templateId,
        personalInfo: parsedData.personalInfo || {},
        summary: parsedData.summary || '',
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        certifications: parsedData.certifications || [],
        languages: parsedData.languages || [],
        volunteer: parsedData.volunteer || [],
        awards: parsedData.awards || [],
        customSections: parsedData.customSections || [],
      },
    });

    console.log('Resume created:', resume.id);

    return NextResponse.json({
      success: true,
      data: {
        resume: {
          id: resume.id,
          title: resume.title,
        },
        parseMetadata: {
          confidence: parsedData.confidence || 0.8,
          warnings: parsedData.warnings || [],
        },
      },
    });
  } catch (error: any) {
    console.error('Error in resume upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Unknown error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
