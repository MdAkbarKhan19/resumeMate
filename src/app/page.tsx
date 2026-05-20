'use client';

import Link from 'next/link';
import { HomeRedirect } from '@/components/HomeRedirect';

export default function Home() {
  return (
    <HomeRedirect>
      <div className="min-h-screen bg-[#fafafc]">
        {/* ═══════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 mesh-bg" />
          <div className="absolute inset-0 dot-grid opacity-40" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left column: copy + CTAs */}
              <div className="animate-fade-in">
                {/* Agent status badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
                  <span className="agent-dot-active" />
                  <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                    AI Agent Ready
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  <span className="text-gray-900">Build Resumes That</span>
                  <br />
                  <span className="gradient-text-brand">Win Interviews</span>
                </h1>

                <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
                  Our agentic AI analyzes job descriptions, optimizes keywords, and
                  crafts ATS-beating resumes so you land more interviews -- on autopilot.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all duration-200"
                  >
                    Start Building Free
                    <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all duration-200"
                  >
                    See Pricing
                  </Link>
                </div>

                {/* Social proof */}
                <div className="mt-10 flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {['bg-indigo-400', 'bg-pink-400', 'bg-amber-400', 'bg-emerald-400'].map((bg, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Loved by 2,000+ job seekers</p>
                  </div>
                </div>
              </div>

              {/* Right column: Agent character with floating resume */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  {/* Agent character */}
                  <div className="relative z-10 animate-float">
                    <div className="mx-auto w-48 h-48 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border-2 border-indigo-200/50" />
                      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                        <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                        </svg>
                      </div>
                      {/* Orbiting sparkles */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-orbit"><div className="w-4 h-4 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" /></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-orbit-reverse"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" /></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-orbit-slow"><div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400/50" /></div>
                      </div>
                    </div>
                    {/* Speech bubble */}
                    <div className="absolute -top-4 -right-8 bg-white rounded-2xl rounded-bl-sm p-3 shadow-card border border-gray-100 animate-bounce-gentle">
                      <p className="text-xs font-medium text-gray-600">Let me craft your<br/><span className="text-indigo-600 font-bold">perfect resume!</span></p>
                    </div>
                  </div>

                  {/* Floating resume card */}
                  <div className="absolute top-20 -left-6 w-52 bg-white rounded-2xl shadow-card border border-gray-100 p-4 -rotate-6 opacity-80">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-200 to-violet-200" />
                      <div className="space-y-1"><div className="h-2 w-20 rounded bg-gray-200" /><div className="h-1.5 w-14 rounded bg-gray-100" /></div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-gray-100" />
                      <div className="h-1.5 w-4/5 rounded bg-gray-100" />
                      <div className="h-1.5 w-3/4 rounded bg-gray-100" />
                    </div>
                  </div>

                  {/* ATS score badge */}
                  <div className="absolute bottom-12 -right-4 bg-white rounded-xl shadow-card border border-gray-100 p-3 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600">95</span>
                      </div>
                      <div><p className="text-xs font-semibold text-gray-700">ATS Score</p><p className="text-xs text-emerald-500">Excellent</p></div>
                    </div>
                  </div>

                  {/* Keyword match badge */}
                  <div className="absolute top-32 -left-12 bg-white rounded-xl shadow-card border border-gray-100 p-2.5 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <p className="text-xs font-semibold text-gray-600">12 Keywords</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES BENTO GRID
        ═══════════════════════════════════════════ */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Powered by AI Agents</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Your Personal Career Architect</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Autonomous agents work behind the scenes to craft, optimize, and polish every section of your resume.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Large card -- AI Enhancement */}
            <div className="md:col-span-2 group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Enhancement</h3>
                <p className="text-gray-500 leading-relaxed max-w-md">Our agent analyzes your content and suggests powerful, context-aware improvements to each bullet point, summary, and skill description.</p>
                <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100 max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-400 line-through">Managed team projects</p>
                      <p className="text-indigo-700 font-medium">Led cross-functional team of 8, delivering 3 major product launches ahead of schedule</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-50 to-transparent rounded-bl-full opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-5 shadow-lg shadow-pink-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ATS-Friendly Templates</h3>
                <p className="text-gray-500 leading-relaxed">Hand-tuned templates that pass automated screeners and recruiters love.</p>
              </div>
            </div>

            {/* ATS Score */}
            <div className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ATS Optimized</h3>
                <p className="text-gray-500 leading-relaxed">Real-time score against job descriptions with keyword gap analysis.</p>
              </div>
            </div>

            {/* JD Matching */}
            <div className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-50 to-transparent rounded-bl-full opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">JD Matching</h3>
                <p className="text-gray-500 leading-relaxed">Paste a job description and let the agent tailor your resume automatically.</p>
              </div>
            </div>

            {/* Large card -- Export */}
            <div className="md:col-span-2 group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full opacity-60" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pixel-Perfect PDF Export</h3>
                <p className="text-gray-500 leading-relaxed max-w-md">Download a print-ready PDF that matches the preview exactly. Auto-fit font sizing keeps everything on one page.</p>
                <div className="mt-5 flex gap-3">
                  <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">PDF</span>
                  <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">ATS-Safe</span>
                  <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">Auto-Fit</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════ */}
        <section className="py-24 bg-gradient-to-b from-indigo-50/50 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Simple Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Four simple steps from blank page to interview-ready resume.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-10 relative">
              <div className="hidden md:block absolute top-10 left-[15%] right-[15%] border-t-2 border-dashed border-indigo-200" />
              {[
                { num: 1, title: 'Choose Template', desc: 'Select from our ATS-friendly professional templates', gradient: 'from-indigo-500 to-violet-500', shadow: 'shadow-indigo-500/25' },
                { num: 2, title: 'Add Content', desc: 'Fill in your details or upload an existing resume', gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/25' },
                { num: 3, title: 'AI Enhancement', desc: 'Get smart suggestions to improve your content', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/25' },
                { num: 4, title: 'Download', desc: 'Export a polished PDF and apply with confidence', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/25' },
              ].map((step) => (
                <div key={step.num} className="text-center relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white shadow-xl ${step.shadow} relative z-10`}>
                    {step.num}
                  </div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PRICING
        ═══════════════════════════════════════════ */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 flex flex-col hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Free</h3>
                <div className="text-4xl font-extrabold text-gray-900">₹0</div>
                <div className="text-gray-400 mt-0.5 text-sm">forever</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['1 active resume', '3 ATS optimizations / month', '10 AI bullet enhancements / day', 'Watermarked PDF download', 'Both templates'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all">Get Started</Link>
            </div>

            {/* Pack */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-card p-8 flex flex-col relative glow-indigo hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-lg shadow-indigo-500/25">Best Value</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Pack</h3>
                <div className="text-4xl font-extrabold text-gray-900">₹149</div>
                <div className="text-gray-400 mt-0.5 text-sm">one-time</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['1 polished resume', '5 ATS optimizations per pack', 'Unlimited AI bullet enhancements', 'Clean PDF — no watermark', 'Both templates'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all">Buy Pack</Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8 flex flex-col hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Pro</h3>
                <div className="text-4xl font-extrabold text-gray-900">₹299</div>
                <div className="text-gray-400 mt-0.5 text-sm">/month — billed monthly, quarterly or annually</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited active resumes', 'Unlimited ATS optimizations', 'Unlimited AI bullet enhancements', 'Clean PDF — no watermark', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-gray-600 text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all">See Pro Plans</Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM CTA
        ═══════════════════════════════════════════ */}
        <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Land Your Dream Job?</h2>
              <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">Join thousands of job seekers who have built winning resumes with our AI agent.</p>
              <Link href="/auth/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-xl shadow-black/10 transition-all duration-200">
                Start Building Free
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </HomeRedirect>
  );
}
