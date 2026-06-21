'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Alert';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (resumeId: string) => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern-two-column');

  // Get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('Please sign in to import resumes');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setStage('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateId', selectedTemplate);

    try {
      // Upload and parse
      setProgress(30);
      setStage('Extracting text from document...');

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProgress(60);
      setStage('Analyzing structure and sections...');

      const data = await response.json();

      setProgress(90);
      setStage('Populating resume builder...');

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to parse resume');
      }

      if (data.success) {
        setProgress(100);
        setStage('Complete!');
        
        // Show success message with confidence score
        const confidence = data.data.parseMetadata?.confidence || 0;
        const confidencePercent = Math.round(confidence * 100);
        
        toast.success(`Resume imported successfully! (${confidencePercent}% confidence)`);
        
        // Show warnings if any
        if (data.data.parseMetadata?.warnings?.length > 0) {
          setTimeout(() => {
            data.data.parseMetadata.warnings.forEach((warning: string) => {
              toast.warning(warning);
            });
          }, 1000);
        }

        // Navigate to builder with pre-populated data
        if (onSuccess) {
          onSuccess(data.data.resume.id);
        } else {
          router.push(`/builder?id=${data.data.resume.id}`);
        }
        
        onClose();
      } else {
        throw new Error(data.error?.message || 'Failed to parse resume');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to import resume. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStage('');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Import Resume</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <DocumentTextIcon className="h-4 w-4 text-amber-600" />
              How it works
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Upload your existing resume in PDF or DOCX format</li>
              <li>✓ Our AI will automatically extract all sections and data</li>
              <li>✓ Review and edit the imported data in the builder</li>
              <li>✓ All your information is preserved - zero data loss!</li>
            </ul>
          </div>

          {/* Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <svg
                  className={`w-16 h-16 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                </div>
                <div className="text-xs text-gray-400">
                  Supported formats: PDF, DOCX • Max size: 10MB
                </div>
              </div>
            </div>
          )}

          {/* File Rejections */}
          {fileRejections.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-semibold">File rejected:</p>
              <ul className="text-sm text-red-700 mt-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    {file.name}: {errors.map(e => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* File Preview */}
          {file && !isProcessing && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {file.type === 'application/pdf' ? (
                      <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v14H2z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l6 6v14H2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB • {file.type.includes('pdf') ? 'PDF' : 'DOCX'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">{stage}</span>
                  <span className="text-sm font-semibold text-gray-700">{progress}%</span>
                </div>
                <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Analyzing your resume...</span>
              </div>
            </div>
          )}

          {/* Template Selection */}
          {file && !isProcessing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="modern-two-column">Modern Two Column</option>
                <option value="minimalist">Minimalist</option>
                <option value="professional">Professional</option>
                <option value="tech-modern">Tech Modern</option>
                <option value="executive">Executive</option>
                <option value="ats-classic">ATS Classic</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can change the template later in the builder
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? 'Importing...' : 'Import Resume'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadModal;
