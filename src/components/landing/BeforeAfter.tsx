'use client';

/**
 * Before → After resume transformation. When scrolled into view, the ATS
 * score counts up (48→94), the matched-keyword chips fade in, and a Replay
 * button re-runs it. Ported from the design's #xform section.
 */

import { useEffect, useRef, useState } from 'react';

const ADDED_SKILLS = ['Kafka', 'CI/CD', 'PostgreSQL', 'Terraform'];

export default function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(48);
  const [revealed, setRevealed] = useState(false);
  const rafRef = useRef<number>();

  const play = () => {
    setRevealed(true);
    const from = 48, to = 94, dur = 1400, start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRevealed(false);
    setScore(48);
    setTimeout(play, 120);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { play(); io.unobserve(e.target); } }),
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => { io.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const deg = (score / 100) * 360;

  return (
    <div ref={ref} className="relative max-w-4xl mx-auto">
      {/* Score badge */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-3 bg-white rounded-full shadow-elevated border border-gray-100 pl-2 pr-5 py-2">
          <div className="relative w-12 h-12 flex-shrink-0">
            <div className="w-12 h-12 rounded-full" style={{ background: `conic-gradient(#f59e0b ${deg}deg, #e5e7eb ${deg}deg)` }} />
            <div className="absolute inset-[4px] rounded-full bg-white grid place-items-center">
              <span className="text-xs font-extrabold text-gray-900">{score}</span>
            </div>
          </div>
          <div className="leading-tight whitespace-nowrap">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">ATS match</p>
            <p className="text-sm font-bold text-gray-900">climbing as we tailor →</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 pt-10">
        {/* BEFORE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Before</span>
            <span className="text-xs text-gray-400">Your original resume</span>
          </div>
          <div className="space-y-3 text-sm text-gray-500">
            <p>• Managed team projects and deadlines</p>
            <p>• Built data pipelines for analytics</p>
            <p>• Worked on the company database</p>
            <p>• Helped deploy code to production</p>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {['Python', 'SQL', 'Teamwork'].map(s => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* AFTER */}
        <div className="bg-white rounded-2xl border-2 border-brand-soft shadow-elevated p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white brand-bg px-2 py-0.5 rounded-full">After</span>
            <span className="text-xs brand-1 font-medium">Tailored to the job post</span>
          </div>
          <div className="space-y-3 text-sm text-gray-800">
            <p>• Led cross-functional team of 8, shipping 3 launches on a <strong className="brand-1">CI/CD</strong> cadence</p>
            <p>• Built <strong className="brand-1">Kafka</strong>-backed data pipelines feeding analytics</p>
            <p>• Optimized <strong className="brand-1">PostgreSQL</strong> queries, cutting load times 40%</p>
            <p>• Automated deploys with <strong className="brand-1">Terraform</strong> &amp; GitHub Actions</p>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Skills matched to the JD</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">Python</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">SQL</span>
              {ADDED_SKILLS.map((k, i) => (
                <span
                  key={k}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-medium transition-all duration-500"
                  style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'none' : 'translateY(6px)',
                    transitionDelay: `${0.1 + i * 0.12}s`,
                  }}
                >
                  + {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button onClick={reset} className="inline-flex items-center gap-2 text-sm font-semibold brand-1 hover:opacity-80 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Replay the transformation
        </button>
      </div>
    </div>
  );
}
