/**
 * Agent Progress Bar Component
 * Shows real-time AI agent progress with colorful animated visualization
 */
'use client';

import React from 'react';

export interface AgentStep {
  agent: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  message: string;
  progress?: number;
}

interface AgentProgressBarProps {
  steps: AgentStep[];
  isVisible: boolean;
  onClose?: () => void;
}

const AGENT_LABELS: Record<string, string> = {
  orchestrator: 'Orchestrator',
  'resume-parser': 'Resume Parser',
  'jd-parser': 'JD Analyzer',
  'ats-scorer': 'ATS Scorer',
  'resume-builder': 'Resume Enhancer',
  formatter: 'Document Generator',
};

const AGENT_ICONS: Record<string, string> = {
  orchestrator: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  'resume-parser': 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  'jd-parser': 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  'ats-scorer': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  'resume-builder': 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z',
  formatter: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 .724a1.125 1.125 0 01-1.12 1.276H7.23a1.125 1.125 0 01-1.12-1.276L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247',
};

export default function AgentProgressBar({ steps, isVisible, onClose }: AgentProgressBarProps) {
  if (!isVisible || steps.length === 0) return null;

  const completedCount = steps.filter(s => s.status === 'complete').length;
  const hasError = steps.some(s => s.status === 'error');
  const isAllComplete = completedCount === steps.length && steps.length > 0;
  const overallProgress = steps.length > 0
    ? Math.round(steps.reduce((sum, s) => sum + (s.progress || (s.status === 'complete' ? 100 : 0)), 0) / steps.length)
    : 0;

  return (
    <div className={`fixed top-20 right-6 z-40 w-[340px] bg-white rounded-2xl border border-gray-100 shadow-elevated overflow-hidden transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      {/* Header with gradient */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        hasError ? 'bg-red-50' : isAllComplete ? 'bg-emerald-50' : 'bg-gradient-to-r from-emerald-50 to-emerald-50'
      }`}>
        <div className="flex items-center gap-2.5">
          {!isAllComplete && !hasError && (
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-500 animate-agent-think" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 rounded-lg border border-emerald-300/50 animate-pulse-ring" />
              </div>
            </div>
          )}
          {isAllComplete && (
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {hasError && (
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className={`text-sm font-semibold ${
            hasError ? 'text-red-700' : isAllComplete ? 'text-emerald-700' : 'text-emerald-700'
          }`}>
            {hasError ? 'Error occurred' : isAllComplete ? 'All tasks complete!' : 'Agent working...'}
          </span>
        </div>
        {(isAllComplete || hasError) && onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="px-4 pt-3">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : isAllComplete ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-500 to-pink-500 animate-progress-stripe'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{completedCount}/{steps.length} tasks</p>
          <p className="text-xs font-mono text-emerald-500">{overallProgress}%</p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pb-4 pt-2 space-y-2 max-h-60 overflow-y-auto">
        {steps.map((step, index) => (
          <div key={index} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
            step.status === 'running' ? 'bg-emerald-50/60' : ''
          }`}>
            {/* Step icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              step.status === 'idle' ? 'bg-gray-100' :
              step.status === 'running' ? 'bg-gradient-to-br from-emerald-100 to-emerald-100' :
              step.status === 'complete' ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
              {step.status === 'running' ? (
                <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className={`w-4 h-4 ${
                  step.status === 'idle' ? 'text-gray-400' :
                  step.status === 'complete' ? 'text-emerald-600' : 'text-red-500'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d={AGENT_ICONS[step.agent] || AGENT_ICONS['orchestrator']} />
                </svg>
              )}
            </div>

            {/* Step details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold truncate ${
                  step.status === 'running' ? 'text-emerald-700' :
                  step.status === 'complete' ? 'text-emerald-700' :
                  step.status === 'error' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {AGENT_LABELS[step.agent] || step.agent}
                </span>
                {step.progress !== undefined && step.status === 'running' && (
                  <span className="text-xs font-mono text-emerald-500">{step.progress}%</span>
                )}
                {step.status === 'complete' && (
                  <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">{step.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Celebration confetti when all complete */}
      {isAllComplete && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none overflow-hidden h-16">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-confetti mx-1"
              style={{
                backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#f43f5e', '#14b8a6'][i],
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
