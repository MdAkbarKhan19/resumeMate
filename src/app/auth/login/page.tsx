'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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

  // Check if redirected due to session expiry, or back from a password reset.
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session-expired') {
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    }
    if (searchParams.get('reset') === 'success') {
      setSessionExpiredMessage('Password reset successful. Please log in with your new password.');
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
      // Wipe any stale Amplify state from prior attempts
      Object.keys(localStorage).forEach((k) => {
        if (k === 'amplify-auto-sign-in' || k.startsWith('CognitoIdentityServiceProvider.')) {
          localStorage.removeItem(k);
        }
      });

      const res = await fetch('/api/auth/cognito-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const code = json?.error?.code;
        if (code === 'NOT_CONFIRMED') {
          setError('Please verify your email before signing in');
          router.push('/auth/signup');
          return;
        }
        setError(json?.error?.message || 'Failed to sign in. Please try again.');
        return;
      }

      localStorage.setItem('token', json.data.idToken);
      if (json.data.refreshToken) {
        localStorage.setItem('refreshToken', json.data.refreshToken);
      }
      await refreshUser();
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">
      {/* LEFT PANEL - Illustration (hidden on mobile) */}
      <div className="hidden lg:flex bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 min-h-screen flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />

        {/* Agent character card */}
        <div className="relative w-40 h-40 mb-10">
          {/* Central card with sparkle icon */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
          </div>

          {/* Orbiting dot - pink */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-orbit">
              <div className="w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
            </div>
          </div>

          {/* Orbiting dot - amber */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-orbit-reverse">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
            </div>
          </div>

          {/* Orbiting dot - sky */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-orbit-slow">
              <div className="w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
            </div>
          </div>
        </div>

        {/* Text below the agent character */}
        <h3 className="text-2xl font-bold text-white text-center">Your AI Resume Agent</h3>
        <p className="mt-2 text-indigo-200 text-center max-w-xs">Let me help you craft the perfect resume</p>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fafafc]">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold gradient-text-brand">
              JDsync
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Session Expired Message */}
          {sessionExpiredMessage && (
            <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-600 px-4 py-3 rounded-xl text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{sessionExpiredMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
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
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="Enter your password"
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 border-gray-300 bg-white rounded focus:ring-indigo-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-500">
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-gray-400 bg-[#fafafc]">Or continue with</span>
                </div>
              </div>

              {/* Social Sign In */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={async () => {
                    const { signInWithRedirect } = await import('aws-amplify/auth');
                    try {
                      await signInWithRedirect({ provider: 'Google' });
                    } catch (err) {
                      console.error('Google sign-in failed', err);
                      setError('Google sign-in failed. Please try again.');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafc] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 border-t-transparent"></div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
