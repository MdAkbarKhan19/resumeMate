import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        provider: true,
        planType: true,
        resumesCreated: true,
        resumeCredits: true,
        subscriptionActive: true,
        subscriptionExpiry: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Check if user used OAuth
    if (user.provider !== 'EMAIL' || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OAUTH_USER',
            message: `This account uses ${user.provider} login. Please sign in with ${user.provider}.`,
          },
        },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      planType: user.planType,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          createdAt: userWithoutPassword.createdAt.toISOString(),
          subscriptionExpiry: userWithoutPassword.subscriptionExpiry?.toISOString(),
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}
