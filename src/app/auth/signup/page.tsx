'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp, signIn, resendSignUpCode, type SignUpInput } from 'aws-amplify/auth';
import '../../../lib/amplify-config';

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const signUpInput: SignUpInput = {
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            name: formData.name,
          },
          autoSignIn: true,
        },
      };

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput);

      console.log('Sign up result:', { isSignUpComplete, userId, nextStep });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('verify');
      } else if (nextStep.signUpStep === 'DONE') {
        // Auto sign in
        await signIn({
          username: formData.email,
          password: formData.password,
        });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      // If user exists but never confirmed, resend OTP and jump to verify
      // (common case: previous signup attempt where OTP email never arrived)
      if (err.name === 'UsernameExistsException') {
        try {
          await resendSignUpCode({ username: formData.email });
          setStep('verify');
          setError('');
        } catch (resendErr: any) {
          // If resend fails because account is already confirmed,
          // user should sign in instead.
          if (resendErr.name === 'InvalidParameterException' ||
              resendErr.message?.toLowerCase().includes('already confirmed')) {
            setError('Account already exists. Please sign in instead.');
          } else {
            setError(resendErr.message || 'Account exists but we could not resend the code. Try signing in.');
          }
        }
      } else {
        setError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: formData.email,
        confirmationCode: verificationCode,
      });

      if (isSignUpComplete) {
        // Auto sign in after verification
        await signIn({
          username: formData.email,
          password: formData.password,
        });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await resendSignUpCode({ username: formData.email });
      // 60-second cooldown to prevent spam
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:grid lg:grid-cols-2">
      {/* Left Panel - Colorful Illustration (hidden on mobile) */}
      <div className="hidden lg:flex bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 min-h-screen flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Animated sparkle orbs */}
        <div className="relative mb-10">
          <div className="relative">
            {/* Central icon */}
            <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 2v6h6" />
              </svg>
              {/* Sparkle on top-right of icon */}
              <svg className="absolute -top-2 -right-2 w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" />
              </svg>
            </div>

            {/* Orbiting dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-orbit">
                <div className="w-3 h-3 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-orbit-reverse">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-orbit-slow">
                <div className="w-2 h-2 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" />
              </div>
            </div>
          </div>
        </div>

        <h2 className="relative text-2xl font-bold text-white mb-3 text-center">Create Your Account</h2>
        <p className="relative text-violet-200 text-center max-w-xs">Join thousands building AI-powered resumes</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fafafc]">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold gradient-text-brand">
              ResumeMate
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {step === 'signup' ? 'Create your account' : 'Verify your email'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {step === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </>
              ) : (
                <>We sent a verification code to {formData.email}</>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Sign Up Form */}
          {step === 'signup' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                    placeholder="Min 8 characters, with uppercase, lowercase, number & symbol"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Must contain: uppercase, lowercase, number, and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                    placeholder="Re-enter your password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400">Or continue with</span>
                  </div>
                </div>

                {/* Social Sign In (Coming Soon) */}
                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          )}

          {/* Verification Form */}
          {step === 'verify' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Enter the 6-digit code we sent to your email
                </p>
              </div>

              <form onSubmit={handleVerification} className="space-y-6">
                {/* Verification Code */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                    placeholder="000000"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Didn't receive the code? Resend"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
