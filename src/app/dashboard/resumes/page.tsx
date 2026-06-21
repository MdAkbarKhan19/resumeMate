'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useResumes } from '@/hooks/useResumes';
import {
  Button,
  Card,
  CardContent,
  PageLoading,
  Modal,
  ConfirmModal,
  Input,
} from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { formatDate, relativeTime, getScoreColor, getScoreBgColor } from '@/lib/utils';

const ResumesPage: React.FC = () => {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const { resumes, isLoading, total, totalPages, deleteResume, duplicateResume, error: resumesError } =
    useResumes(currentPage, 10, isAuthenticated);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <PageLoading text="Loading resumes..." />;
  }

  const filteredResumes = resumes.filter((resume) =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedResumeId) return;

    const result = await deleteResume(selectedResumeId);
    if (result.success) {
      toast.success('Resume deleted successfully');
      setDeleteModalOpen(false);
      setSelectedResumeId(null);
    } else {
      toast.error(result.error || 'Failed to delete resume');
    }
  };

  const handleDuplicate = async (id: string) => {
    const result = await duplicateResume(id);
    if (result.success) {
      toast.success('Resume duplicated successfully');
    } else {
      toast.error(result.error || 'Failed to duplicate resume');
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedResumeId(id);
    setDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Manage and organize all your resumes in one place
            </p>
          </div>
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <Link href="/builder" className="block">
              <Button
                variant="primary"
                size="lg"
                className="w-full md:w-auto"
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
              >
                Create New Resume
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card padding="none" className="mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Search resumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  }
                />
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="md" className="flex-1 md:flex-none">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filter
                </Button>
                <Button variant="outline" size="md" className="flex-1 md:flex-none">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Sort
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resume Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading resumes...</p>
          </div>
        ) : resumesError ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Failed to load resumes
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  There was an error fetching your resumes. Please try refreshing the page.
                </p>
                <div className="mt-6">
                  <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredResumes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchQuery ? 'No resumes found' : 'No resumes yet'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Get started by creating your first professional resume'}
                </p>
                {!searchQuery && (
                  <div className="mt-6">
                    <Link href="/builder">
                      <Button variant="primary" size="lg">
                        Create Your First Resume
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {filteredResumes.map((resume) => (
                <Card key={resume.id} variant="bordered" padding="none" hoverable>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {resume.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1" title={`Last edited ${formatDate(resume.updatedAt)}`}>
                          Edited {relativeTime(resume.updatedAt)}
                        </p>
                      </div>
                      {resume.atsScore !== null && (
                        <div
                          className={`px-2 py-1 rounded-full flex-shrink-0 ${getScoreBgColor(
                            resume.atsScore
                          )}`}
                        >
                          <span
                            className={`text-xs font-medium whitespace-nowrap ${getScoreColor(
                              resume.atsScore
                            )}`}
                          >
                            {resume.atsScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/builder?id=${resume.id}`} className="flex-shrink-0">
                          <Button variant="primary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDuplicate(resume.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Duplicate"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(resume.id)}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedResumeId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ResumesPage;
