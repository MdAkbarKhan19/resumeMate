/**
 * Job Description Upload Component
 * Allows users to paste or upload job descriptions for ATS analysis
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon, SparklesIcon, LinkIcon } from '@heroicons/react/24/outline';
import { authenticatedFetch } from '@/lib/api-client';

const SUPPORTED_JOB_URL = /^https?:\/\/([a-z0-9-]+\.)*(linkedin\.com|indeed\.com|indeed\.co\.in)\//i;
// Naukri ships a SPA shell with no JD content in the initial HTML — a plain
// server fetch will never see the description. Detect it up-front so users
// don't wait for a guaranteed parse failure.
const NAUKRI_URL = /^https?:\/\/([a-z0-9-]+\.)*naukri\.com\//i;

interface JobDescriptionUploadProps {
  resumeId: string;
  onAnalysisComplete: (result: any) => void;
  onError?: (error: string) => void;
}

export default function JobDescriptionUpload({
  resumeId,
  onAnalysisComplete,
  onError,
}: JobDescriptionUploadProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'paste' | 'upload'>('paste');
  const [jdUrl, setJdUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedUrl = jdUrl.trim();
  const urlIsSupported = SUPPORTED_JOB_URL.test(trimmedUrl);
  const urlIsNaukri = NAUKRI_URL.test(trimmedUrl);

  const handleFetchFromUrl = async () => {
    const url = jdUrl.trim();
    if (!url) return;
    if (!SUPPORTED_JOB_URL.test(url)) {
      setUrlError('Only LinkedIn, Naukri, and Indeed links are supported.');
      return;
    }

    setUrlError(null);
    setIsFetchingUrl(true);
    try {
      const response = await authenticatedFetch('/api/jd/fetch-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setUrlError(data?.error?.message || 'Could not fetch this job page. Please paste the JD text instead.');
        return;
      }
      const { title, company, description } = data.data || {};
      if (description) setJobDescription(description);
      if (title && !jobTitle) setJobTitle(title);
      if (company && !companyName) setCompanyName(company);
    } catch (err) {
      setUrlError('Could not reach the job site. Please paste the JD text instead.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Sync state from the actual DOM value (handles paste, autofill, drag-drop, etc.)
  const syncFromDom = useCallback(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      setJobDescription((prev) => (prev !== domValue ? domValue : prev));
    }
  }, []);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || jobDescription.length < 100) {
      onError?.('Please enter at least 100 characters of job description');
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await authenticatedFetch('/api/jd/analyze', {
        method: 'POST',
        body: JSON.stringify({
          resumeId,
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to analyze job description');
      }

      if (data.success) {
        onAnalysisComplete(data.data);
      } else {
        throw new Error(data.error?.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to analyze job description');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes('text') && !file.type.includes('pdf')) {
      onError?.('Please upload a text or PDF file');
      return;
    }

    try {
      const text = await file.text();
      setJobDescription(text);
      setUploadMode('paste'); // Switch to paste mode to show the content
    } catch (error) {
      console.error('File read error:', error);
      onError?.('Failed to read file. Please try pasting the text instead.');
    }
  };

  const characterCount = jobDescription.length;
  const minCharacters = 100;
  const isValid = characterCount >= minCharacters;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Job Description Analysis</h2>
        <p className="text-gray-600 text-sm">
          Paste or upload a job description to analyze your resume's ATS compatibility
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUploadMode('paste')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            uploadMode === 'paste'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DocumentTextIcon className="h-5 w-5 inline-block mr-2" />
          Paste Text
        </button>
        <button
          onClick={() => setUploadMode('upload')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            uploadMode === 'upload'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-2" />
          Upload File
        </button>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isAnalyzing}
          />
        </div>
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isAnalyzing}
          />
        </div>
      </div>

      {/* URL Fetch — only meaningful in paste mode */}
      {uploadMode === 'paste' && (
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
          <label htmlFor="jdUrl" className="block text-sm font-medium text-gray-700 mb-2">
            <LinkIcon className="h-4 w-4 inline-block mr-1 -mt-0.5" />
            Paste a job link (LinkedIn, Naukri, Indeed)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              id="jdUrl"
              value={jdUrl}
              onChange={(e) => {
                setJdUrl(e.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder="https://www.linkedin.com/jobs/view/..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={isFetchingUrl || isAnalyzing}
            />
            <button
              type="button"
              onClick={handleFetchFromUrl}
              disabled={!urlIsSupported || urlIsNaukri || isFetchingUrl || isAnalyzing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isFetchingUrl ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Fetching...
                </>
              ) : (
                'Fetch JD'
              )}
            </button>
          </div>
          {urlError && (
            <p className="text-xs text-red-600 mt-2">{urlError}</p>
          )}
          {!urlError && urlIsNaukri && (
            <p className="text-xs text-amber-700 mt-2">
              Naukri loads the JD with JavaScript and can&apos;t be fetched automatically.
              Open the job, copy the description, and paste it below.
            </p>
          )}
          {!urlError && jdUrl && !urlIsSupported && !urlIsNaukri && (
            <p className="text-xs text-gray-500 mt-2">
              Supported: LinkedIn and Indeed. (Naukri requires paste.)
            </p>
          )}
        </div>
      )}

      {/* Input Area */}
      {uploadMode === 'paste' ? (
        <div className="mb-4">
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            ref={textareaRef}
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            onPaste={() => {
              // onChange may not fire reliably on paste in all browsers
              // Use a microtask to read the final DOM value after paste completes
              setTimeout(syncFromDom, 0);
            }}
            onInput={(e) => {
              // Fallback for any input that bypasses onChange (drag-drop, speech, etc.)
              setJobDescription((e.target as HTMLTextAreaElement).value);
            }}
            placeholder="Paste the full job description here including requirements, responsibilities, and qualifications..."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            disabled={isAnalyzing}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${isValid ? 'text-green-600' : 'text-orange-600'}`}>
              {characterCount} / {minCharacters} characters minimum
            </span>
            {characterCount > 0 && !isValid && (
              <span className="text-sm text-orange-600">
                {minCharacters - characterCount} more needed
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Job Description
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
            <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                Click to upload
              </span>
              <span className="text-gray-600"> or drag and drop</span>
              <input
                id="fileUpload"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isAnalyzing}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">TXT or PDF up to 10MB</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={!isValid || isAnalyzing}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Analyze Resume
            </>
          )}
        </button>
        
        {jobDescription && (
          <button
            onClick={() => {
              setJobDescription('');
              setJobTitle('');
              setCompanyName('');
              setJdUrl('');
              setUrlError(null);
            }}
            disabled={isAnalyzing}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Include the complete job description with all requirements</li>
          <li>• Make sure to paste both required and preferred qualifications</li>
          <li>• Include the responsibilities section for better keyword matching</li>
        </ul>
      </div>
    </div>
  );
}
