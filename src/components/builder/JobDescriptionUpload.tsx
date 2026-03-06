/**
 * Job Description Upload Component
 * Allows users to paste or upload job descriptions for ATS analysis
 */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { authenticatedFetch } from '@/lib/api-client';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
