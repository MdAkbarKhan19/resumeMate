import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { jwtConfig } from '@/config';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    planType: string;
  };
}

// JWKS client for Cognito token verification with aggressive caching
const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
});

// In-memory cache for user data.
// NOTE: TTL is short on purpose. The cached user object is consumed by
// downstream entitlement checks (canCreateResume, canRunAtsOptimization, etc.)
// and stale plan data would block paid users right after upgrade. The
// entitlements module re-queries fresh for the gate itself, but a longer TTL
// here still risks confusing the UI which reads `planType` off the cached user.
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds — long enough to absorb burst traffic, short enough to refresh after upgrade

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  planType: true,
  resumesCreated: true,
  resumeCredits: true,
  subscriptionActive: true,
  subscriptionExpiry: true,
};

/**
 * Try to verify token as a local JWT (HS256) issued by our signup/login routes
 */
function verifyLocalToken(token: string): { userId: string; email: string; planType: string } | null {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as any;
    if (decoded.userId && decoded.email) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Try to verify token as a Cognito JWT (RS256)
 */
async function verifyCognitoToken(token: string): Promise<any | null> {
  try {
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, getKey as any, {
        algorithms: ['RS256'],
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Middleware to authenticate API requests
 * Supports both local JWT tokens (from /api/auth/login) and Cognito tokens
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'No authentication token provided',
      };
    }

    const token = authHeader.substring(7);

    if (token === 'test-token-bypass') {
      return {
        authenticated: false,
        error: 'Test mode is no longer supported. Please sign in.',
      };
    }

    // Try local JWT first (faster, no network call)
    const localPayload = verifyLocalToken(token);
    if (localPayload) {
      // Check cache
      const cached = userCache.get(localPayload.email);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return { authenticated: true, user: cached.user };
      }

      const user = await prisma.user.findUnique({
        where: { id: localPayload.userId },
        select: USER_SELECT,
      });

      if (!user) {
        return { authenticated: false, error: 'User not found' };
      }

      userCache.set(user.email, { user, timestamp: Date.now() });
      return { authenticated: true, user };
    }

    // Try Cognito JWT
    const cognitoPayload = await verifyCognitoToken(token);
    if (cognitoPayload) {
      const email = cognitoPayload.email as string;
      const cognitoUserId = cognitoPayload.sub as string;

      if (!email || !cognitoUserId) {
        return { authenticated: false, error: 'Invalid token payload' };
      }

      // Check cache
      const cached = userCache.get(email);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return { authenticated: true, user: cached.user };
      }

      // Fetch or create user
      let user = await prisma.user.findUnique({
        where: { email },
        select: USER_SELECT,
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            providerId: cognitoUserId,
            provider: 'EMAIL',
            emailVerified: true,
            planType: 'FREE',
            name: cognitoPayload.name || email.split('@')[0],
          },
          select: USER_SELECT,
        });
      }

      userCache.set(email, { user, timestamp: Date.now() });
      return { authenticated: true, user };
    }

    return { authenticated: false, error: 'Invalid or expired token' };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  );
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  );
}

/**
 * HOC to protect API routes
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: any; params?: T }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: T }): Promise<NextResponse> => {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    return handler(request, { user: auth.user, params: context?.params });
  };
}

