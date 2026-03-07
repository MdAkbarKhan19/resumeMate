'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useResumes } from '@/hooks/useResumes';
import { Button, Card, CardHeader, CardTitle, CardContent, PageLoading } from '@/components/ui';
import { formatDate, getScoreColor, getScoreBgColor } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { resumes, isLoading: resumesLoading, total, error: resumesError } = useResumes(1, 5, isAuthenticated);

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard] Component state:', {
      resumesLoading,
      resumesError: resumesError?.message || null,
      resumesCount: resumes?.length,
      resumes,
      total,
      authLoading,
      isAuthenticated,
      user: user ? { email: user.email, plan: user.planType } : null
    });
  }, [resumes, resumesLoading, resumesError, total, authLoading, isAuthenticated, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[Dashboard] Not authenticated, redirecting to login');
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading only while checking auth
  if (authLoading) {
    return <PageLoading text="Loading..." />;
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Show loading for resumes
  if (resumesLoading) {
    return <PageLoading text="Loading your resumes..." />;
  }

  const recentResumes = resumes?.slice(0, 3) || [];
  const creditsRemaining = user.planType === 'TIER2' && user.subscriptionActive
    ? '∞'
    : user.resumeCredits;

  return (
    <div className="min-h-screen bg-surface-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-2 text-slate-400">
            Here's an overview of your resume building activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Resumes */}
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Resumes</p>
                  <p className="text-3xl font-bold text-white mt-2">{total}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits Remaining */}
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Credits Left</p>
                  <p className="text-3xl font-bold text-white mt-2">{creditsRemaining}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Current Plan</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {user.planType === 'FREE' && 'Free'}
                    {user.planType === 'TIER1' && 'Tier 1'}
                    {user.planType === 'TIER2' && 'Tier 2'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-violet-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Subscription</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {user.subscriptionActive ? 'Active' : 'Inactive'}
                  </p>
                  {user.subscriptionExpiry && user.subscriptionActive && (
                    <p className="text-xs text-slate-500 mt-1">
                      Until {formatDate(user.subscriptionExpiry)}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${user.subscriptionActive ? 'bg-emerald-500/10' : 'bg-slate-500/10'} rounded-lg flex items-center justify-center`}>
                  <svg
                    className={`w-6 h-6 ${user.subscriptionActive ? 'text-emerald-400' : 'text-slate-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/builder">
                <Button variant="primary" size="lg" className="w-full" leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }>
                  Create New Resume
                </Button>
              </Link>

              <Link href="/dashboard/resumes">
                <Button variant="outline" size="lg" className="w-full" leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                }>
                  View All Resumes
                </Button>
              </Link>

              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full" leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }>
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ATS Optimization - Main Feature CTA */}
        <Card className="mb-8 bg-gradient-to-r from-cyan-600/80 to-violet-600/80 backdrop-blur-xl border border-white/[0.08] text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">ATS Resume Optimizer</h3>
                <p className="text-cyan-100/80 mt-1">
                  Paste a job description, get your ATS score, and auto-enhance your resume to match
                </p>
              </div>
              {recentResumes.length > 0 ? (
                <Link href={`/builder/ats?resumeId=${recentResumes[0].id}`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-cyan-600 border-white hover:bg-cyan-50 font-semibold"
                  >
                    Optimize Resume
                  </Button>
                </Link>
              ) : (
                <Link href="/builder">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-cyan-600 border-white hover:bg-cyan-50 font-semibold"
                  >
                    Create Resume First
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Resumes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Resumes</CardTitle>
              <Link href="/dashboard/resumes">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {resumesLoading ? (
              <div className="text-center py-8 text-slate-500">Loading resumes...</div>
            ) : resumesError ? (
              <div className="text-center py-8 text-rose-400">
                <p className="text-sm">Failed to load resumes. Try refreshing the page.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                  Refresh
                </Button>
              </div>
            ) : recentResumes.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-white">No resumes</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Get started by creating your first resume.
                </p>
                <div className="mt-6">
                  <Link href="/builder">
                    <Button variant="primary">Create Resume</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.06] hover:border-cyan-500/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{resume.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Last updated: {formatDate(resume.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {resume.atsScore !== null && (
                          <div className={`px-3 py-1 rounded-full ${getScoreBgColor(resume.atsScore)}`}>
                            <span className={`text-sm font-medium ${getScoreColor(resume.atsScore)}`}>
                              ATS: {resume.atsScore}%
                            </span>
                          </div>
                        )}
                        <Link href={`/builder?id=${resume.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/builder/ats?resumeId=${resume.id}`}>
                          <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                            ATS Optimize
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Resume Details Preview */}
                    {resume.personalInfo && (
                      <div className="border-t border-white/[0.06] pt-3 mt-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium text-slate-400">Name:</span>
                            <span className="text-slate-500 ml-2">
                              {resume.personalInfo.fullName || 'Not provided'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400">Email:</span>
                            <span className="text-slate-500 ml-2">
                              {resume.personalInfo.email || 'Not provided'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400">Phone:</span>
                            <span className="text-slate-500 ml-2">
                              {resume.personalInfo.phone || 'Not provided'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-400">Location:</span>
                            <span className="text-slate-500 ml-2">
                              {resume.personalInfo.location || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {resume.template && (
                          <div className="mt-2 text-xs">
                            <span className="font-medium text-slate-400">Template:</span>
                            <span className="text-slate-500 ml-2">{resume.template.name}</span>
                          </div>
                        )}

                        {/* Section Summary with Counts */}
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <div className="flex items-center flex-wrap gap-3 text-xs text-slate-400">
                            {resume.experience && resume.experience.length > 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">{resume.experience.length}</span>
                                <span className="ml-1">experience{resume.experience.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {resume.education && resume.education.length > 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v7m0-7l-9-5m9 12l9-5m-9-7V3" />
                                </svg>
                                <span className="font-medium">{resume.education.length}</span>
                                <span className="ml-1">education{resume.education.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {resume.skills && resume.skills.length > 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span className="font-medium">{resume.skills.length}</span>
                                <span className="ml-1">skill{resume.skills.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {resume.projects && resume.projects.length > 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="font-medium">{resume.projects.length}</span>
                                <span className="ml-1">project{resume.projects.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {resume.certifications && resume.certifications.length > 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{resume.certifications.length}</span>
                                <span className="ml-1">certification{resume.certifications.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Show preview of first experience if available */}
                          {resume.experience && resume.experience.length > 0 && resume.experience[0].jobTitle && (
                            <div className="mt-2 text-xs text-slate-500">
                              Latest: {resume.experience[0].jobTitle}
                              {resume.experience[0].company && ` at ${resume.experience[0].company}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
