'use client';

import Link from 'next/link';
import { HomeRedirect } from '@/components/HomeRedirect';
import HeroDemo from '@/components/HeroDemo';
import Reveal from '@/components/landing/Reveal';
import BeforeAfter from '@/components/landing/BeforeAfter';

const Check = ({ className = 'w-4 h-4 text-amber-500' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const Arrow = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

export default function Home() {
  return (
    <HomeRedirect>
      <div className="min-h-screen bg-[#fafafc]">

        {/* ═══════════ HERO — product demo ═══════════ */}
        <section className="relative overflow-hidden mesh-bg">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <Reveal className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-brand-soft border border-brand-soft mb-7">
                  <span className="w-2 h-2 rounded-full brand-bg pulse-soft" />
                  <span className="text-xs font-bold brand-1 tracking-wide uppercase">Resume tailoring, on autopilot</span>
                </Reveal>

                <Reveal delay={1}>
                  <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl font-extrabold tracking-tight text-gray-900">
                    One resume won't<br />get you hired.{' '}
                    <span className="brand-text">A tailored one will.</span>
                  </h1>
                </Reveal>

                <Reveal delay={2}>
                  <p className="mt-6 text-lg text-gray-500 max-w-xl leading-relaxed">
                    Paste any job description. JDsync rewrites your bullets to match its
                    keywords, scores your resume against the role's ATS, and shows you{' '}
                    <span className="font-semibold text-gray-700">every change before it's applied.</span>
                  </p>
                </Reveal>

                <Reveal delay={3} className="mt-9 flex flex-col sm:flex-row gap-3.5">
                  <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl text-white brand-bg ring-brand hover:opacity-95 transition">
                    Tailor my resume — free
                    <Arrow />
                  </Link>
                  <a href="#how" className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold rounded-xl text-gray-700 bg-white border border-gray-200 hover:border-gray-300 shadow-sm transition">
                    See how it works
                  </a>
                </Reveal>

                <Reveal delay={3} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                  {['Free to start', 'No subscription required', 'Your data stays yours'].map(t => (
                    <span key={t} className="inline-flex items-center gap-1.5"><Check />{t}</span>
                  ))}
                </Reveal>
              </div>

              <Reveal delay={2} className="flex items-center justify-center">
                <HeroDemo />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════ TRUST STRIP ═══════════ */}
        <section className="border-y border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-gray-400">
            {[
              { t: 'Works with PDF & Word', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { t: 'ATS-safe templates', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { t: 'Your resume stays private', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
              { t: 'Tailored in under a minute', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map(i => (
              <span key={i.t} className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 brand-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={i.d} /></svg>
                {i.t}
              </span>
            ))}
          </div>
        </section>

        {/* ═══════════ DIFFERENTIATION ═══════════ */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mb-16">
            <p className="text-sm font-bold brand-1 uppercase tracking-wider mb-3">What makes us different</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.08]">
              Other tools build <span className="text-gray-400">a</span> resume.<br />
              We build the one <span className="brand-text">this job</span> is looking for.
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed">
              Generic builders hand you a pretty template and leave the hard part — matching the
              role — to you. JDsync reads the job description and does it for you, in the open.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { d: 1, bg: 'brand-bg', icon: 'M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z', h: 'It reads the actual job post', p: 'Paste any JD. We extract the exact keywords and skills recruiters’ filters look for — no more guessing what to include.' },
              { d: 2, bg: 'bg-amber-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', h: 'A live ATS score, not a vibe', p: 'Watch a real match percentage move as you edit. You’ll know your resume is ready — instead of hoping it is.' },
              { d: 3, bg: 'bg-gray-800', icon: 'M5 13l4 4L19 7', h: 'You approve every change', p: 'No black box. Every rewrite is shown side-by-side with your original. Accept it, tweak it, or skip it — it’s your resume.' },
            ].map(c => (
              <Reveal key={c.d} delay={c.d} className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition p-7">
                <div className={`w-12 h-12 rounded-xl ${c.bg} grid place-items-center mb-5 shadow-card`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{c.h}</h3>
                <p className="text-gray-500 leading-relaxed text-[15px]">{c.p}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════ BEFORE → AFTER ═══════════ */}
        <section className="py-24 bg-gradient-to-b from-[#f6f4ff] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-bold brand-1 uppercase tracking-wider mb-3">Watch it work</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Same experience. <span className="brand-text">Rewritten for the role.</span></h2>
              <p className="mt-4 text-lg text-gray-500">Here's what happens the moment you paste a job description.</p>
            </Reveal>
            <BeforeAfter />
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-bold brand-1 uppercase tracking-wider mb-3">So easy it feels like cheating</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">From old resume to tailored, in four steps</h2>
            <p className="mt-4 text-lg text-gray-500">No blank pages. No formatting fights. Just paste, review, download.</p>
          </Reveal>

          <div className="space-y-6">
            {/* Step 1 */}
            <Reveal className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-100 shadow-card p-7 md:p-9">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold brand-1 mb-3"><span className="w-6 h-6 rounded-full bg-brand-soft grid place-items-center">1</span>IMPORT</div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Drop in your old resume</h3>
                <p className="text-gray-500 leading-relaxed">Drag a PDF or Word file and AI reads every section — contact, experience, education, skills — and lays it out instantly. Starting fresh? A guided form has you covered.</p>
              </div>
              <div className="bg-[#fafafc] rounded-2xl border border-gray-100 p-6">
                <div className="border-2 border-dashed border-brand-soft rounded-xl bg-white p-7 text-center">
                  <div className="w-12 h-12 rounded-xl bg-brand-soft grid place-items-center mx-auto mb-3">
                    <svg className="w-6 h-6 brand-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Drop your resume here</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">PDF, DOCX · up to 10MB</p>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                  <div className="w-7 h-8 rounded bg-red-50 grid place-items-center text-[9px] font-bold text-red-500">PDF</div>
                  <div className="flex-1 min-w-0"><div className="h-1.5 w-24 rounded bg-gray-200 mb-1" /><div className="h-1 w-16 rounded bg-gray-100" /></div>
                  <span className="text-[10px] font-semibold text-amber-600">parsed ✓</span>
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-100 shadow-card p-7 md:p-9">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold brand-1 mb-3"><span className="w-6 h-6 rounded-full bg-brand-soft grid place-items-center">2</span>PASTE THE JOB</div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Paste the job post you want</h3>
                <p className="text-gray-500 leading-relaxed">Drop in the description and JDsync instantly scores your match and highlights the exact keywords you're missing — pulled straight from the listing.</p>
              </div>
              <div className="md:order-1 bg-[#fafafc] rounded-2xl border border-gray-100 p-6">
                <div className="bg-white rounded-xl border border-gray-100 p-3 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Job description</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-mono">…seeking a backend engineer with <span className="bg-amber-100 text-amber-800 rounded px-0.5">Kafka</span>, <span className="bg-amber-100 text-amber-800 rounded px-0.5">CI/CD</span> and <span className="bg-amber-100 text-amber-800 rounded px-0.5">PostgreSQL</span> experience to own our data platform…</p>
                </div>
                <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full" style={{ background: 'conic-gradient(#f59e0b 230deg, #e5e7eb 230deg)' }} />
                    <div className="absolute inset-[5px] rounded-full bg-white grid place-items-center"><span className="text-sm font-extrabold text-gray-900">64%</span></div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">3 keywords to add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Kafka', 'CI/CD', 'PostgreSQL'].map(k => (
                        <span key={k} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-100 shadow-card p-7 md:p-9">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold brand-1 mb-3"><span className="w-6 h-6 rounded-full bg-brand-soft grid place-items-center">3</span>REVIEW</div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Approve each rewrite — or don't</h3>
                <p className="text-gray-500 leading-relaxed">Every suggestion appears next to your original. Accept the ones you like with a tap. Nothing changes on your resume unless you say so.</p>
              </div>
              <div className="bg-[#fafafc] rounded-2xl border border-gray-100 p-6 space-y-3">
                <div className="bg-white rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] text-gray-400 line-through mb-1.5">Built data pipelines for analytics</p>
                  <p className="text-xs text-gray-800 mb-2.5">Built <strong className="brand-1">Kafka</strong>-backed data pipelines feeding analytics dashboards</p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-center text-xs font-semibold text-white brand-bg rounded-lg py-1.5">Accept</span>
                    <span className="flex-1 text-center text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg py-1.5">Skip</span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg py-1.5 px-3">Edit</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-3 opacity-70">
                  <p className="text-[10px] text-gray-400 line-through mb-1.5">Worked on the company database</p>
                  <p className="text-xs text-gray-800">Optimized <strong className="brand-1">PostgreSQL</strong> queries, cutting load times 40%</p>
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-100 shadow-card p-7 md:p-9">
              <div className="md:order-2">
                <div className="inline-flex items-center gap-2 text-xs font-bold brand-1 mb-3"><span className="w-6 h-6 rounded-full bg-brand-soft grid place-items-center">4</span>DOWNLOAD</div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Download a recruiter-ready PDF</h3>
                <p className="text-gray-500 leading-relaxed">Export a print-perfect PDF that matches the preview exactly. Auto-fit sizing keeps it to one clean page — no watermark on paid plans.</p>
              </div>
              <div className="md:order-1 bg-[#fafafc] rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
                <div className="w-44 bg-white rounded-lg border border-gray-200 shadow-card p-4 floaty">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full brand-bg" />
                    <div className="space-y-1"><div className="h-1.5 w-20 rounded bg-gray-300" /><div className="h-1 w-12 rounded bg-gray-200" /></div>
                  </div>
                  <div className="space-y-1.5">
                    {['w-full', 'w-5/6', 'w-full', 'w-2/3', 'w-4/5'].map((w, i) => <div key={i} className={`h-1 ${w} rounded bg-gray-100`} />)}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-500">PDF</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600">No watermark</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════ COMPARISON ═══════════ */}
        <section className="py-24 bg-[#0f0a2e] relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-[0.06]" />
          <div className="absolute -top-24 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 brand-bg-3" />
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Why JDsync</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Other builders vs. JDsync</h2>
              <p className="mt-4 text-lg text-white/50">Most tools stop at "looks nice." We don't.</p>
            </Reveal>

            <Reveal className="grid md:grid-cols-2 gap-5">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-7">
                <p className="text-sm font-bold text-white/40 uppercase tracking-wide mb-5">Typical resume builders</p>
                <ul className="space-y-4">
                  {['One generic resume for every job', 'You guess which keywords to add', "No idea if it'll pass the ATS", 'Black-box AI rewrites everything', 'Subscription locked just to download'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-white/60 text-[15px]">
                      <svg className="w-5 h-5 text-white/25 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-7 shadow-elevated relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 brand-bg-3 opacity-10 blur-2xl rounded-full" />
                <p className="text-sm font-bold brand-1 uppercase tracking-wide mb-5 flex items-center gap-2">
                  <span className="inline-flex items-center h-6 px-2 rounded-lg bg-slate-900 text-[11px]"><span className="font-extrabold text-amber-300">JD</span><span className="font-bold text-white">sync</span></span>
                </p>
                <ul className="space-y-4">
                  {['Re-tailored to each job description', 'Keywords pulled from the actual JD', 'A live ATS match score', 'You approve every single change', 'Free to start · ₹149 one-time option'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-gray-800 text-[15px] font-medium">
                      <Check className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="brand-bg-3 rounded-[2rem] p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 dot-grid opacity-10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Your next application deserves<br className="hidden sm:block" /> a resume built for it.
              </h2>
              <p className="text-white/80 text-lg mb-9 max-w-xl mx-auto">
                Upload your current resume, paste a job post, and see your tailored version in under a minute. Free to try.
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl text-gray-900 bg-white hover:bg-gray-50 shadow-elevated transition">
                Tailor my resume — free
                <Arrow className="w-4 h-4" />
              </Link>
              <p className="text-white/60 text-sm mt-5">No credit card · No subscription · Your data stays yours</p>
            </div>
          </Reveal>
        </section>

      </div>
    </HomeRedirect>
  );
}
