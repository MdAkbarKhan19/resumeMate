'use client';

import Link from 'next/link';
import { HomeRedirect } from '@/components/HomeRedirect';

export default function Home() {
  return (
    <HomeRedirect>
      <div className="min-h-screen">
        {/* ═══════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════ */}
        <section className="aurora-bg dot-grid relative min-h-[90vh] flex items-center">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left column: copy + CTAs */}
              <div>
                {/* Agent status indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] mb-8">
                  <span className="agent-dot-active" />
                  <span className="text-xs text-cyan-400 font-mono tracking-wide">
                    AI Agents Ready
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
                  <span className="text-white">Build Resumes That</span>
                  <br />
                  <span className="gradient-text-brand">Win Interviews</span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-xl leading-relaxed">
                  Our agentic AI analyzes job descriptions, optimizes keywords, and
                  crafts ATS-beating resumes so you land more interviews -- on autopilot.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_24px_rgba(0,212,255,0.25)] transition-all duration-200"
                  >
                    Start Building Free
                  </Link>
                  <Link
                    href="/templates"
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-slate-200 bg-white/10 border border-white/10 hover:bg-white/[0.15] hover:text-white transition-all duration-200"
                  >
                    View Templates
                  </Link>
                </div>
              </div>

              {/* Right column: decorative resume mock */}
              <div className="hidden lg:block">
                <div className="glass-card scan-line-effect p-6 max-w-md mx-auto animate-float">
                  {/* Mock resume header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border border-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-36 rounded bg-white/10" />
                      <div className="h-2 w-24 rounded bg-white/[0.06]" />
                    </div>
                  </div>

                  {/* Mock sections */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="h-2 w-20 rounded bg-cyan-400/20" />
                      <div className="h-2 w-full rounded bg-white/[0.06]" />
                      <div className="h-2 w-5/6 rounded bg-white/[0.06]" />
                      <div className="h-2 w-4/6 rounded bg-white/[0.06]" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-24 rounded bg-violet-400/20" />
                      <div className="h-2 w-full rounded bg-white/[0.06]" />
                      <div className="h-2 w-3/4 rounded bg-white/[0.06]" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-16 rounded bg-emerald-400/20" />
                      <div className="h-2 w-full rounded bg-white/[0.06]" />
                      <div className="h-2 w-5/6 rounded bg-white/[0.06]" />
                      <div className="h-2 w-2/3 rounded bg-white/[0.06]" />
                    </div>
                  </div>

                  {/* Agent badge overlaid on mock */}
                  <div className="mt-5 flex items-center gap-2 text-xs font-mono text-cyan-400/70">
                    <svg className="w-3.5 h-3.5 animate-pulse-glow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                    Analyzing resume...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES BENTO GRID
        ═══════════════════════════════════════════ */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Powered by Agentic AI
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Autonomous agents work behind the scenes to craft, optimize, and
              polish every section of your resume.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 -- Multiple Templates */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 hover:border-cyan-500/20 transition-colors duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multiple Templates</h3>
              <p className="text-slate-400 leading-relaxed">
                Choose from 5+ professionally designed, ATS-friendly templates tuned
                for different industries and roles.
              </p>
            </div>

            {/* Card 2 -- AI-Powered */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 hover:border-violet-500/20 transition-colors duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-slate-400 leading-relaxed">
                Get intelligent, context-aware suggestions that enhance every bullet
                point and summary you write.
              </p>
            </div>

            {/* Card 3 -- ATS Optimized */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 hover:border-emerald-500/20 transition-colors duration-300">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-600/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ATS Optimized</h3>
              <p className="text-slate-400 leading-relaxed">
                Score your resume against job descriptions for maximum visibility
                with applicant tracking systems.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════ */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Four simple steps from blank page to interview-ready resume.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connector line (hidden on mobile) */}
            <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] border-t border-dashed border-white/10" />

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.2)] relative z-10">
                1
              </div>
              <h3 className="text-white font-semibold mb-2">Choose Template</h3>
              <p className="text-slate-500 text-sm">
                Select from our ATS-friendly templates
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.2)] relative z-10">
                2
              </div>
              <h3 className="text-white font-semibold mb-2">Add Content</h3>
              <p className="text-slate-500 text-sm">
                Fill in your details or upload existing resume
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.2)] relative z-10">
                3
              </div>
              <h3 className="text-white font-semibold mb-2">AI Enhancement</h3>
              <p className="text-slate-500 text-sm">
                Get AI suggestions to improve your content
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white shadow-[0_0_20px_rgba(0,212,255,0.2)] relative z-10">
                4
              </div>
              <h3 className="text-white font-semibold mb-2">Download</h3>
              <p className="text-slate-500 text-sm">
                Export as PDF or DOCX and apply with confidence
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════ */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Start free. Upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 flex flex-col">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="text-4xl font-bold text-white">$0</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">1 resume download</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Basic templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">5 AI suggestions</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-slate-200 bg-white/10 border border-white/10 hover:bg-white/[0.15] hover:text-white transition-all duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Starter Pack (popular) */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-8 flex flex-col relative glow-cyan">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Starter Pack</h3>
                <div className="text-4xl font-bold text-white">$15</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">5 resume downloads</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">All templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">50 AI suggestions</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">PDF & DOCX export</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-200"
              >
                Buy Now
              </Link>
            </div>

            {/* Unlimited Pro */}
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 flex flex-col">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Unlimited Pro</h3>
                <div className="text-4xl font-bold text-white">$20</div>
                <div className="text-slate-500 mt-1">/month</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Unlimited resumes</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">All premium templates</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Unlimited AI assistance</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-300">Priority support</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-slate-200 bg-white/10 border border-white/10 hover:bg-white/[0.15] hover:text-white transition-all duration-200"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </section>
      </div>
    </HomeRedirect>
  );
}
