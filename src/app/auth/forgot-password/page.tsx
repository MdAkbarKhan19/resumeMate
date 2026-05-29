'use client';

/**
 * Forgot-password flow (Cognito via Amplify).
 *
 * Step 1: user enters email → resetPassword() emails a 6-digit code.
 * Step 2: user enters the code + a new password → confirmResetPassword().
 * On success we route to /auth/login with a success flag.
 *
 * Note: Google-only accounts have no Cognito password. Cognito returns a
 * generic response either way (it won't reveal whether the email exists),
 * so we always advance to step 2 after a successful resetPassword call.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { resetPassword } = await import('aws-amplify/auth');
      await resetPassword({ username: email.trim().toLowerCase() });
      setInfo('We sent a reset code to your email. Enter it below with your new password.');
      setStep('confirm');
    } catch (err: any) {
      // LimitExceededException / network etc.
      if (err?.name === 'LimitExceededException') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (err?.name === 'UserNotFoundException') {
        // Don't leak account existence — advance anyway.
        setInfo('If an account exists for that email, a reset code has been sent.');
        setStep('confirm');
      } else {
        setError(err?.message || 'Could not start password reset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { confirmResetPassword } = await import('aws-amplify/auth');
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
        newPassword,
      });
      router.replace('/auth/login?reset=success');
    } catch (err: any) {
      if (err?.name === 'CodeMismatchException') {
        setError('That code is incorrect. Double-check the email and try again.');
      } else if (err?.name === 'ExpiredCodeException') {
        setError('That code has expired. Request a new one.');
      } else if (err?.name === 'InvalidPasswordException') {
        setError('Password must be 8+ chars with upper, lower, number, and a symbol.');
      } else {
        setError(err?.message || 'Could not reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fafafc]">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold gradient-text-brand">
            JDsync
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {step === 'request' ? 'Reset your password' : 'Enter reset code'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {step === 'request'
              ? "Enter your email and we'll send you a reset code."
              : 'Check your inbox for the 6-digit code.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm">
            {info}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 tracking-widest"
                  placeholder="123456"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('request'); setError(''); setInfo(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Remembered it?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
