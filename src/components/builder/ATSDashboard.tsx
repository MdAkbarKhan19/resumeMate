/**
 * ATS Score Dashboard Component
 * Shows before/after ATS scores, missing keywords, and enhancement suggestions
 */
'use client';

import { useState } from 'react';
import { SparklesIcon, CheckCircleIcon, XCircleIcon, ArrowTrendingUpIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface ATSScore {
  overall: number;
  breakdown: {
    skillsMatch: number;
    keywordMatch: number;
    experienceMatch: number;
    educationMatch: number;
    formattingScore: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

interface ATSDashboardProps {
  beforeScore?: ATSScore;
  afterScore?: ATSScore;
  improvement?: number;
  keyImprovements?: string[];
  isLoading?: boolean;
  onEnhance?: () => void;
}

export default function ATSDashboard({
  beforeScore,
  afterScore,
  improvement,
  keyImprovements,
  isLoading = false,
  onEnhance,
}: ATSDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Determine which score to show (after if available, else before)
  const currentScore = afterScore || beforeScore;
  const hasComparison = beforeScore && afterScore;

  if (!currentScore && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 mb-4">
          <SparklesIcon className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Optimize Your Resume for ATS
        </h3>
        <p className="text-gray-600 mb-4">
          Upload a job description to analyze your resume and get an ATS compatibility score
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg shadow-lg p-8">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing resume...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">ATS Compatibility Score</h2>
              {hasComparison && improvement && improvement > 0 && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <ArrowTrendingUpIcon className="h-5 w-5" />
                  <span className="font-semibold">+{improvement} points</span>
                </div>
              )}
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {hasComparison && (
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2">Before Enhancement</div>
                  <div className={`text-5xl font-bold ${getScoreColor(beforeScore.overall)}`}>
                    {beforeScore.overall}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">out of 100</div>
                </div>
              )}

              <div className="text-center">
                {hasComparison && <div className="text-sm font-medium text-gray-600 mb-2">After Enhancement</div>}
                {!hasComparison && <div className="text-sm font-medium text-gray-600 mb-2">Current Score</div>}
                {currentScore && (
                  <>
                    <div className={`text-5xl font-bold ${getScoreColor(currentScore.overall)}`}>
                      {currentScore.overall}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">out of 100</div>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(currentScore.overall)}`}>
                        {getScoreLabel(currentScore.overall)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center gap-2 mx-auto"
              >
                {showDetails ? 'Hide' : 'Show'} Detailed Breakdown
                <svg
                  className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDetails && currentScore && (
                <div className="mt-4 space-y-3">
                  {Object.entries(currentScore.breakdown).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                          {value}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressBarColor(value)}`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            {!afterScore && onEnhance && (
              <button
                onClick={onEnhance}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-5 w-5" />
                AI Auto-Enhance Resume
              </button>
            )}
          </>
        )}
      </div>

      {/* Key Improvements */}
      {hasComparison && keyImprovements && keyImprovements.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            Key Improvements Made
          </h3>
          <ul className="space-y-2">
            {keyImprovements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Matched Keywords */}
      {currentScore && currentScore.matchedKeywords.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Matched Keywords ({currentScore.matchedKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentScore.matchedKeywords.slice(0, 20).map((keyword, index) => (
              <span
                key={index}
                className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
            {currentScore.matchedKeywords.length > 20 && (
              <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                +{currentScore.matchedKeywords.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {currentScore && currentScore.missingKeywords.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 text-orange-600" />
            Missing Keywords ({currentScore.missingKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentScore.missingKeywords.slice(0, 15).map((keyword, index) => (
              <span
                key={index}
                className="inline-block bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
            {currentScore.missingKeywords.length > 15 && (
              <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                +{currentScore.missingKeywords.length - 15} more
              </span>
            )}
          </div>
          {!afterScore && (
            <p className="text-sm text-gray-600">
              💡 Tip: Use AI auto-enhance to naturally incorporate these keywords into your resume
            </p>
          )}
        </div>
      )}

      {/* Suggestions */}
      {currentScore && currentScore.suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-yellow-600" />
            Suggestions for Improvement
          </h3>
          <ul className="space-y-3">
            {currentScore.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBadge(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

function getProgressBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}
