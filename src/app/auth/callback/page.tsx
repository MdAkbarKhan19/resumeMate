'use client';

/**
 * OAuth post-login landing page.
 *
 * Cognito redirects the browser here after Google sign-in completes. Amplify
 * has already intercepted the `?code=...` in the URL and is exchanging it for
 * tokens. We just wait for the session to materialize, refresh the AuthContext
 * so it picks up the new user, and forward to /dashboard.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finalize() {
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');

        // Amplify needs a few hundred ms after the redirect to swap the code
        // for tokens. Poll with a short backoff so we redirect the instant
        // the session is ready rather than waiting a fixed delay.
        for (let attempt = 0; attempt < 12; attempt++) {
          if (cancelled) return;
          const session = await fetchAuthSession({ forceRefresh: attempt > 0 });
          if (session.tokens?.idToken) {
            // Stash the token so AuthContext.fetchUser picks it up.
            localStorage.setItem('token', session.tokens.idToken.toString());
            await refreshUser();
            router.replace('/dashboard');
            return;
          }
          await new Promise(r => setTimeout(r, 250));
        }

        setError('Sign-in did not complete. Please try again.');
      } catch (e) {
        console.error('OAuth callback failed:', e);
        setError('Sign-in failed. Please try again.');
      }
    }

    finalize();
    return () => { cancelled = true; };
  }, [refreshUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafc] px-4">
      <div className="text-center max-w-sm">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in problem</h1>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <a
              href="/auth/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Back to login
            </a>
          </>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-600">Finishing sign-in&hellip;</p>
          </>
        )}
      </div>
    </div>
  );
}
