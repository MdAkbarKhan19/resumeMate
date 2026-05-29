// AWS Amplify Configuration
import { Amplify } from 'aws-amplify';

// During SSR/build NEXT_PUBLIC_APP_URL may be unset; fall back to the
// production origin so amplify-config doesn't error before render.
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://jdsync.com';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      loginWith: {
        email: true,
        // Hosted UI OAuth — used by signInWithRedirect({ provider: 'Google' }).
        // Cognito redirects back to one of redirectSignIn URLs after Google auth.
        oauth: {
          domain: 'auth.jdsync.com',
          scopes: ['email', 'openid', 'profile'] as ('email' | 'openid' | 'profile')[],
          redirectSignIn: [`${APP_ORIGIN}/auth/callback`, `${APP_ORIGIN}/`],
          redirectSignOut: [`${APP_ORIGIN}/`],
          responseType: 'code' as const,
        },
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
