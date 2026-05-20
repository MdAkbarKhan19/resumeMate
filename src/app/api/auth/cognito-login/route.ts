import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminInitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

const client = new CognitoIdentityProviderClient({ region });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    let authResult;
    try {
      const cmd = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      });
      authResult = await client.send(cmd);
    } catch (err: any) {
      // Fallback to ADMIN flow if USER_PASSWORD_AUTH isn't enabled on the app client
      if (err.name === 'InvalidParameterException' || err.name === 'NotAuthorizedException') {
        if (err.message?.includes('USER_PASSWORD_AUTH flow not enabled')) {
          const adminCmd = new AdminInitiateAuthCommand({
            AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
            UserPoolId: userPoolId,
            ClientId: clientId,
            AuthParameters: { USERNAME: email, PASSWORD: password },
          });
          authResult = await client.send(adminCmd);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (authResult.ChallengeName) {
      if (authResult.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return NextResponse.json(
          { success: false, error: { code: 'NEW_PASSWORD_REQUIRED', message: 'You must set a new password' } },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'CHALLENGE', message: `Auth challenge: ${authResult.ChallengeName}` } },
        { status: 400 }
      );
    }

    const tokens = authResult.AuthenticationResult;
    if (!tokens?.IdToken) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN', message: 'No token returned from Cognito' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        idToken: tokens.IdToken,
        accessToken: tokens.AccessToken,
        refreshToken: tokens.RefreshToken,
        expiresIn: tokens.ExpiresIn,
      },
    });
  } catch (err: any) {
    console.error('[cognito-login] error:', err.name, err.message);

    if (err.name === 'NotAuthorizedException') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' } },
        { status: 401 }
      );
    }
    if (err.name === 'UserNotFoundException') {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'No account found with this email' } },
        { status: 404 }
      );
    }
    if (err.name === 'UserNotConfirmedException') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIRMED', message: 'Please verify your email before signing in' } },
        { status: 403 }
      );
    }
    if (err.name === 'PasswordResetRequiredException') {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_RESET_REQUIRED', message: 'Password reset required' } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Login failed' } },
      { status: 500 }
    );
  }
}
