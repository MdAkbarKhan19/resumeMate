import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { ResumeParserService } from '@/lib/resume/parser';
import { S3Service } from '@/lib/aws/s3';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

// Validation schemas
const parseResumeSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

async function handlePOST(request: NextRequest, { user }: { user: any }) {
  console.log('🚀 Parse API called - User:', user?.email || user?.id);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;

    console.log('📄 File received:', file?.name, 'Template:', templateId);

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'Resume file is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate template ID
    try {
      parseResumeSchema.parse({ templateId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.errors[0].message,
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF and DOCX files are supported',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must be less than 10MB',
          },
        },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, starting parsing...');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const s3Key = await S3Service.uploadFile(buffer, file.name, file.type);
    console.log('☁️ Uploaded to S3:', s3Key);

    // Parse resume based on file type
    let parsedData: any;
    try {
      if (file.type === 'application/pdf') {
        parsedData = await ResumeParserService.parsePDF(buffer);
      } else {
        parsedData = await ResumeParserService.parseDOCX(buffer);
      }
      console.log('📊 Parsing complete:', parsedData.metadata);
    } catch (parseError) {
      console.error('❌ Parsing error:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSING_ERROR',
            message: 'Failed to parse resume content',
            details: parseError instanceof Error ? parseError.message : 'Unknown error',
          },
        },
        { status: 500 }
      );
    }

    // Create resume data object
    const resumeData: any = {
      userId: user.id,
      title: parsedData.personalInfo?.name || 'Imported Resume',
      templateId: templateId,
      s3Key: s3Key,
      
      // Personal Info
      fullName: parsedData.personalInfo?.name || '',
      email: parsedData.personalInfo?.email || '',
      phone: parsedData.personalInfo?.phone || '',
      location: parsedData.personalInfo?.location || '',
      linkedin: parsedData.personalInfo?.linkedin || null,
      github: parsedData.personalInfo?.github || null,
      website: parsedData.personalInfo?.website || null,
      
      // Professional Summary
      summary: parsedData.summary || '',
      
      // Skills
      skills: parsedData.skills || [],
      
      // Work Experience
      experience: parsedData.experience || [],
      
      // Education
      education: parsedData.education || [],
      
      // Projects (new section)
      projects: parsedData.projects || [],
      
      // Certifications (new section)
      certifications: parsedData.certifications || [],
      
      // Languages (new section)
      languages: parsedData.languages || [],
      
      // Volunteer Work (new section)
      volunteer: parsedData.volunteer || [],
      
      // Awards (new section)
      awards: parsedData.awards || [],
      
      // Publications (new section)
      publications: parsedData.publications || [],
      
      // Custom Sections (new section)
      customSections: parsedData.customSections || [],
      
      // Metadata
      metadata: {
        imported: true,
        originalFileName: file.name,
        importDate: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        parsingMetadata: parsedData.metadata,
      },
    };

    console.log('💾 Creating resume in database...');

    // Save to database
    const resume = await prisma.resume.create({
      data: resumeData,
    });

    console.log('✅ Resume created:', resume.id);

    return NextResponse.json({
      success: true,
      data: {
        resumeId: resume.id,
        parsedData: {
          personalInfo: parsedData.personalInfo,
          summary: parsedData.summary,
          experience: parsedData.experience,
          education: parsedData.education,
          skills: parsedData.skills,
          projects: parsedData.projects,
          certifications: parsedData.certifications,
          languages: parsedData.languages,
          volunteer: parsedData.volunteer,
          awards: parsedData.awards,
          publications: parsedData.publications,
          customSections: parsedData.customSections,
        },
        metadata: parsedData.metadata,
      },
    });
  } catch (error) {
    console.error('❌ Parse API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

// Export POST directly (auth checked inside)
export async function POST(request: NextRequest) {
  // Authenticate request
  const auth = await authenticateRequest(request);
  
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: auth.error || 'Authentication required',
        },
      },
      { status: 401 }
    );
  }

  // Call the handler with authenticated user
  return handlePOST(request, { user: auth.user });
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/parse',
    methods: ['POST'],
    description: 'Resume parsing endpoint',
  });
}
