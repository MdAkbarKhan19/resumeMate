'use client';

/**
 * Landing-page hero demo. Auto-loops through the three things JDsync actually
 * does — Import, Tailor (ATS), Download — so logged-out visitors SEE the
 * product instead of reading about it. Purely presentational: no API calls,
 * no backend cost. Every number/bullet shown reflects a real feature.
 */

import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'import', label: 'Import' },
  { key: 'tailor', label: 'Tailor to the job' },
  { key: 'download', label: 'Download' },
] as const;

export default function HeroDemo() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(54);

  // Advance the demo every ~3.2s, looping.
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 3200);
    return () => clearInterval(t);
  }, []);

  // Count the ATS ring up when the "tailor" step is active.
  useEffect(() => {
    if (step !== 1) { setScore(54); return; }
    let raf: number;
    const start = performance.now();
    const from = 54, to = 91, dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setScore(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const ringDeg = (score / 100) * 360;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Step tabs — wrap on mobile, arrows only on sm+ to avoid overflow */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                i === step ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'bg-white text-gray-400 border border-gray-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-white' : 'bg-gray-300'}`} />
              {s.label}
            </div>
            {i < STEPS.length - 1 && <span className="hidden sm:inline text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {/* Stage */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-card p-6 min-h-[320px] overflow-hidden">

        {/* STEP 0 — IMPORT */}
        <div className={`transition-all duration-500 ${step === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute inset-6 pointer-events-none'}`}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 w-fit mb-4">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
            <span className="text-xs font-medium text-indigo-700">my-resume.pdf</span>
          </div>
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Auto-filling your resume…</p>
          <div className="space-y-2.5">
            {['Contact details', 'Work experience', 'Education', 'Skills'].map((f, i) => (
              <div key={f} className="flex items-center gap-2" style={{ animation: step === 0 ? `slideUp 0.4s ease-out ${i * 0.18}s both` : undefined }}>
                <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-sm text-gray-700">{f}</span>
                <span className="ml-auto text-[10px] text-emerald-600 font-medium">imported</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Upload your old resume — every section fills itself. PDF or Word.</p>
        </div>

        {/* STEP 1 — TAILOR (ATS) */}
        <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute inset-6 pointer-events-none'}`}>
          <div className="flex items-start gap-4 mb-4">
            {/* ATS ring */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <div className="w-20 h-20 rounded-full" style={{ background: `conic-gradient(#10b981 ${ringDeg}deg, #e5e7eb ${ringDeg}deg)` }} />
              <div className="absolute inset-[6px] rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-gray-900 leading-none">{score}%</span>
                <span className="text-[9px] text-gray-400 font-medium">ATS match</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Job description matched</p>
              <div className="flex flex-wrap gap-1.5">
                {['Kafka', 'CI/CD', 'PostgreSQL'].map(k => (
                  <span key={k} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">+ {k}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Bullet rewrite */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 line-through">Built data pipelines for analytics</div>
            <div className="text-sm text-gray-800 bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2">
              Built <strong className="text-indigo-700">Kafka</strong>-backed data pipelines for analytics
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">Paste a job post — we rewrite your bullets to match. You approve every change.</p>
        </div>

        {/* STEP 2 — DOWNLOAD */}
        <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute inset-6 pointer-events-none'}`}>
          <div className="mx-auto w-40 bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400" />
              <div className="space-y-1"><div className="h-1.5 w-16 rounded bg-gray-300" /><div className="h-1 w-10 rounded bg-gray-200" /></div>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-full rounded bg-gray-100" />
              <div className="h-1 w-5/6 rounded bg-gray-100" />
              <div className="h-1 w-4/6 rounded bg-gray-100" />
              <div className="h-1 w-full rounded bg-gray-100" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Recruiter-ready PDF
          </div>
          <p className="mt-3 text-xs text-gray-500 text-center">Clean PDF, no watermark on paid plans — exactly what you see on screen.</p>
        </div>
      </div>
    </div>
  );
}
