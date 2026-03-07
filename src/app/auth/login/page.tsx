'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, fetchAuthSession, type SignInInput } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';
import '../../../lib/amplify-config';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('');

  // Check if redirected due to session expiry
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session-expired') {
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signInInput: SignInInput = {
        username: formData.email,
        password: formData.password,
      };

      const { isSignedIn, nextStep } = await signIn(signInInput);

      console.log('[Login] Sign in result:', { isSignedIn, nextStep });

      if (isSignedIn) {
        console.log('[Login] Sign in successful, establishing session...');

        // Wait for Cognito to establish session, then verify it
        let sessionEstablished = false;
        let retries = 5;

        while (retries > 0 && !sessionEstablished) {
          try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const session = await fetchAuthSession({ forceRefresh: true });

            if (session.tokens && session.tokens.idToken) {
              console.log('[Login] Session established successfully');
              sessionEstablished = true;

              // Store token immediately
              const idToken = session.tokens.idToken.toString();
              localStorage.setItem('token', idToken);

              // Now refresh user context
              await refreshUser();
              console.log('[Login] User loaded, redirecting to dashboard');
              router.replace('/dashboard');
              return;
            }
          } catch (sessionErr: any) {
            console.log(`[Login] Session not ready yet, retry ${6 - retries}/5:`, sessionErr.message);
            retries--;
          }
        }

        if (!sessionEstablished) {
          console.error('[Login] Failed to establish session after retries');
          setError('Sign in successful but session setup failed. Please try refreshing the page.');
        }
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        setError('Please verify your email before signing in');
        router.push('/auth/signup');
      }
    } catch (err: any) {
      console.error('[Login] Error:', err);

      if (err.name === 'UserAlreadyAuthenticatedException') {
        console.log('[Login] User already authenticated, refreshing...');
        // User is already signed in, refresh and redirect
        await refreshUser();
        router.replace('/dashboard');
        return;
      } else if (err.name === 'UserNotFoundException') {
        setError('No account found with this email');
      } else if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full">
        {/* Aurora background effect */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative text-center mb-8">
          <Link href="/" className="text-3xl font-bold gradient-text-brand">
            ResumeMate
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-cyan-400 hover:text-cyan-300">
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Session Expired Message */}
        {sessionExpiredMessage && (
          <div className="relative mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-sm flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{sessionExpiredMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="relative mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-elevated p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-cyan-500 border-white/20 bg-white/[0.04] rounded focus:ring-cyan-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-400">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_rgba(0,212,255,0.15)]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/[0.04] text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Social Sign In (Coming Soon) */}
            <div className="mt-6">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-xl text-slate-400 bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google (Coming Soon)
              </button>
            </div>
          </div>
        </div>

        {/* Additional Links */}
        <div className="relative mt-6 text-center text-sm text-slate-500">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-primary flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 border-t-transparent"></div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
