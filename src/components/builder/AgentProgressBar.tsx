/**
 * Agent Progress Bar Component
 * Shows real-time AI agent progress during operations
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

const STATUS_COLORS: Record<string, string> = {
  idle: 'bg-gray-200',
  running: 'bg-blue-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
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
    <div className={`fixed top-20 right-6 z-40 w-80 bg-white rounded-lg shadow-2xl border overflow-hidden transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        hasError ? 'bg-red-50' : isAllComplete ? 'bg-green-50' : 'bg-blue-50'
      }`}>
        <div className="flex items-center gap-2">
          {!isAllComplete && !hasError && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {isAllComplete && (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-sm font-semibold text-gray-800">
            {hasError ? 'Error occurred' : isAllComplete ? 'Complete!' : 'AI Processing...'}
          </span>
        </div>
        {(isAllComplete || hasError) && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="px-4 pt-2">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : isAllComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">{overallProgress}%</p>
      </div>

      {/* Steps */}
      <div className="px-4 pb-3 space-y-2 max-h-60 overflow-y-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[step.status]} ${
              step.status === 'running' ? 'animate-pulse' : ''
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 truncate">
                  {AGENT_LABELS[step.agent] || step.agent}
                </span>
                {step.progress !== undefined && step.status === 'running' && (
                  <span className="text-xs text-gray-400">{step.progress}%</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{step.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
