import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { S3Service } from '@/lib/aws/s3';
import { ResumeParserService } from '@/lib/resume/parser';

// Force Node.js runtime (not Edge) for file uploads
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'working',
    message: 'Upload endpoint is alive!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
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

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const s3Key = await S3Service.uploadFile(buffer, file.name, file.type);

    let parsedData: any;
    try {
      if (file.type === 'application/pdf') {
        parsedData = await ResumeParserService.parsePDF(buffer);
      } else {
        parsedData = await ResumeParserService.parseDOCX(buffer);
      }
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse resume content' },
        { status: 500 }
      );
    }

    const resume = await prisma.resume.create({
      data: {
        userId: auth.user.id,
        title: parsedData.personalInfo?.name || 'Imported Resume',
        templateId: templateId,
        personalInfo: parsedData.personalInfo || {},
        summary: parsedData.summary || '',
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        projects: parsedData.projects || [],
        certifications: parsedData.certifications || [],
        languages: parsedData.languages || [],
        awards: parsedData.awards || [],
        customSections: parsedData.customSections || [],
      },
    });

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
    console.error('Error in upload:', error);
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
