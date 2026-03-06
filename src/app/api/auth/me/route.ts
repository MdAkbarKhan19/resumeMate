import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';

async function handler(request: NextRequest, { user }: { user: any }) {
  try {
    // Fetch fresh user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        planType: true,
        resumesCreated: true,
        resumeCredits: true,
        subscriptionActive: true,
        subscriptionExpiry: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
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

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...currentUser,
          createdAt: currentUser.createdAt.toISOString(),
          lastLogin: currentUser.lastLogin?.toISOString(),
          subscriptionExpiry: currentUser.subscriptionExpiry?.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
