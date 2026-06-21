/**
 * ATS Optimization Page
 * Allows users to analyze their resume against job descriptions and auto-enhance
 */
'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JobDescriptionUpload from '@/components/builder/JobDescriptionUpload';
import ATSDashboard from '@/components/builder/ATSDashboard';
import { ArrowLeftIcon, DocumentCheckIcon, PencilSquareIcon, XMarkIcon, CheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { authenticatedFetch, readJson } from '@/lib/api-client';
import { wordDiff } from '@/lib/text-diff';
import { ConfirmModal } from '@/components/ui';

// Render text with `**word**` markers as bold spans (no HTML injection).
function renderMarkdownBold(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={i} className="font-bold text-amber-700">{m[1]}</strong> : <span key={i}>{part}</span>;
  });
}

// Render a word-level diff (old words struck through, new words highlighted) so
// the user sees EXACTLY what changed, instead of a generic "Rewritten" label.
function renderWordDiff(before: string, after: string): React.ReactNode {
  return wordDiff(before, after).map((seg, i) => {
    if (seg.type === 'added') {
      return <span key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">{seg.value}</span>;
    }
    if (seg.type === 'removed') {
      return <span key={i} className="text-red-400 line-through">{seg.value}</span>;
    }
    return <span key={i} className="text-gray-500">{seg.value}</span>;
  });
}

function ResumeSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResumes() {
      try {
        const response = await authenticatedFetch('/api/resumes?limit=50');
        const data = await response.json();
        if (data.success) {
          setResumes(data.data.resumes);
        }
      } catch (err) {
        console.error('Failed to load resumes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResumes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Resumes Yet</h2>
          <p className="text-gray-600 mb-6">Create a resume first, then come back to optimize it for ATS.</p>
          <a
            href="/builder"
            className="inline-flex items-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
          >
            Create Resume
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <div className="mb-6 sm:mb-8 text-center">
          <DocumentCheckIcon className="h-10 w-10 sm:h-12 sm:w-12 text-amber-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tailor to a Job</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Choose a resume to tailor against a job description</p>
        </div>
        <div className="space-y-3">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              onClick={() => onSelect(resume.id)}
              className="w-full text-left p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    {resume.personalInfo?.fullName || 'No name'} &middot; Updated {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {resume.atsScore !== null && (
                    <span className="text-xs sm:text-sm font-medium text-amber-600 whitespace-nowrap">ATS: {resume.atsScore}%</span>
                  )}
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ATSOptimizationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId');

  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [enhancementResult, setEnhancementResult] = useState<any>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [pendingEnhancement, setPendingEnhancement] = useState<any>(null);
  // Per-change review state: track rejected and edited changes
  const [rejectedChanges, setRejectedChanges] = useState<Set<number>>(new Set());
  const [editedChanges, setEditedChanges] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // If no resumeId, show resume selector
  if (!resumeId) {
    return (
      <ResumeSelector
        onSelect={(id) => router.push(`/builder/ats?resumeId=${id}`)}
      />
    );
  }

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setError(null);
    setSuccessMessage('Job description analyzed successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAutoEnhance = async () => {
    if (!analysisResult || !resumeId) return;

    setIsEnhancing(true);
    setError(null);
    // Reset per-change state
    setRejectedChanges(new Set());
    setEditedChanges({});
    setEditingIndex(null);

    try {
      // Start the enhancement as a background job — it can take 1-2 minutes on
      // the reasoning model, which would otherwise hit a proxy 504 on one long
      // request. We get a jobId back immediately, then poll for the result.
      const startRes = await authenticatedFetch('/api/ai/auto-enhance', {
        method: 'POST',
        body: JSON.stringify({
          resumeId,
          jdAnalysisId: analysisResult.analysisId,
        }),
      });
      const startData = await readJson(startRes);
      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error?.message || 'Failed to start enhancement');
      }
      const jobId = startData.data?.jobId;
      if (!jobId) throw new Error('Failed to start enhancement');

      // Poll until the job is done. A terminal job failure comes back as HTTP
      // 200 with success:false (handled below). Transient infra blips (network,
      // 502/504, or a 404 right after a process restart) come back non-200 or
      // make readJson throw — we tolerate a few of those rather than abandon a
      // job that's still running. 8-min cap, comfortably under the 20-min server TTL.
      const deadline = Date.now() + 8 * 60 * 1000;
      let result: any = null;
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 5;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 3000));
        let pollData: any;
        try {
          const pollRes = await authenticatedFetch(
            `/api/ai/auto-enhance?jobId=${encodeURIComponent(jobId)}`,
          );
          pollData = await readJson(pollRes);
          if (!pollRes.ok) {
            // Non-200 = transient infra issue (a real job failure is 200 +
            // success:false). Fall through to the retry counter.
            throw new Error(pollData?.error?.message || `status ${pollRes.status}`);
          }
        } catch {
          if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            throw new Error('Lost connection to the enhancement. Please try again.');
          }
          continue;
        }
        consecutiveFailures = 0;

        if (!pollData.success) {
          // Terminal: the background job itself failed.
          throw new Error(pollData.error?.message || 'Enhancement failed. Please try again.');
        }
        if (pollData.data?.status === 'done') {
          result = pollData.data.result;
          break;
        }
        // status === 'processing' → keep polling
      }

      if (!result) {
        throw new Error('Enhancement is taking longer than expected. Please try again.');
      }

      setEnhancementResult(result);
      setSuccessMessage('Resume enhanced! Review each change below - edit or reject as needed.');
    } catch (error) {
      console.error('Enhancement error:', error);
      setError(error instanceof Error ? error.message : 'Failed to enhance resume');
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleReject = (index: number) => {
    setRejectedChanges(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // Also cancel editing if rejecting
        if (editingIndex === index) {
          setEditingIndex(null);
        }
        // Remove any edits for this change
        setEditedChanges(prev => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
      }
      return next;
    });
  };

  const startEditing = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(editedChanges[index] || currentText);
  };

  const saveEdit = (index: number) => {
    if (editText.trim()) {
      setEditedChanges(prev => ({ ...prev, [index]: editText.trim() }));
    }
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const getAcceptedChangeCount = () => {
    if (!enhancementResult) return 0;
    return enhancementResult.changes.length - rejectedChanges.size;
  };

  // Helper: revert a change in the enhanced resume (find 'after' text, replace with 'before')
  const revertChangeInResume = (resume: any, change: any) => {
    if (change.section === 'experience' && change.before) {
      resume.experience?.forEach((exp: any) => {
        const bullets = exp.bullets || exp.achievements || [];
        for (let i = 0; i < bullets.length; i++) {
          if (bullets[i] === change.after) {
            bullets[i] = change.before;
            return;
          }
        }
      });
    } else if (change.section === 'summary' && change.before) {
      if (resume.summary === change.after) {
        resume.summary = change.before;
      }
    } else if (change.section === 'skills' && change.type === 'added') {
      // Remove the added skill
      if (resume.skills && Array.isArray(resume.skills)) {
        resume.skills = resume.skills.filter((s: any) => {
          if (typeof s === 'string') return s !== change.after;
          if (s.name) return s.name !== change.after;
          if (s.items && Array.isArray(s.items)) {
            s.items = s.items.filter((item: string) => item !== change.after);
            return s.items.length > 0;
          }
          return true;
        });
      }
    }
  };

  // Helper: apply a user edit to the enhanced resume (find 'after' text, replace with edited)
  const applyEditToResume = (resume: any, change: any, editedText: string) => {
    if (change.section === 'experience') {
      resume.experience?.forEach((exp: any) => {
        const bullets = exp.bullets || exp.achievements || [];
        for (let i = 0; i < bullets.length; i++) {
          if (bullets[i] === change.after) {
            bullets[i] = editedText;
            return;
          }
        }
      });
    } else if (change.section === 'summary') {
      if (resume.summary === change.after) {
        resume.summary = editedText;
      }
    }
  };

  const applyEnhancements = async (enhancedResume: any) => {
    try {
      // Apply user's edit/reject decisions to the enhanced resume before saving
      const resumeToApply = JSON.parse(JSON.stringify(enhancedResume));

      if (enhancementResult?.changes) {
        enhancementResult.changes.forEach((change: any, index: number) => {
          const isRejected = rejectedChanges.has(index);
          const editedText = editedChanges[index];

          if (isRejected && change.before) {
            // Revert: find the 'after' text in the resume and replace with 'before'
            revertChangeInResume(resumeToApply, change);
          } else if (editedText && change.section) {
            // Edit: find the 'after' text and replace with edited version
            applyEditToResume(resumeToApply, change, editedText);
          }
        });
      }
      // Transform the enhanced resume to match API schema
      const transformedResume: any = {};

      // Map personalInfo (handle different property names)
      if (resumeToApply.personalInfo) {
        const info = resumeToApply.personalInfo;
        const personalInfo: any = {};
        
        // Only add fields that have values
        if (info.fullName || info.name) personalInfo.fullName = info.fullName || info.name;
        if (info.title) personalInfo.title = info.title;
        if (info.email) personalInfo.email = info.email;
        if (info.phone) personalInfo.phone = info.phone;
        if (info.location) personalInfo.location = info.location;
        if (info.linkedin) personalInfo.linkedin = info.linkedin;
        if (info.portfolio || info.website) personalInfo.website = info.portfolio || info.website;
        if (info.github) personalInfo.github = info.github;
        
        // Only include personalInfo if it has required fields
        if (personalInfo.fullName && personalInfo.email) {
          transformedResume.personalInfo = personalInfo;
        }
      }

      // Map summary
      if (resumeToApply.summary !== undefined) {
        transformedResume.summary = resumeToApply.summary || '';
      }

      // Map experience
      if (resumeToApply.experience && Array.isArray(resumeToApply.experience)) {
        transformedResume.experience = resumeToApply.experience
          .filter((exp: any) => exp.company && (exp.position || exp.jobTitle) && exp.startDate)
          .map((exp: any) => ({
            company: exp.company,
            position: exp.position || exp.jobTitle,
            location: exp.location || '',
            startDate: exp.startDate,
            endDate: exp.endDate || '',
            current: Boolean(exp.current),
            bullets: Array.isArray(exp.bullets) ? exp.bullets : (Array.isArray(exp.responsibilities) ? exp.responsibilities : []),
          }));
      }

      // Map education
      if (resumeToApply.education && Array.isArray(resumeToApply.education)) {
        transformedResume.education = resumeToApply.education
          .filter((edu: any) => edu.institution && edu.degree)
          .map((edu: any) => ({
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field || edu.major || '',
            location: edu.location || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || edu.graduationDate || '',
            gpa: edu.gpa || '',
          }));
      }

      // Map skills - handle multiple possible formats and consolidate categories
      if (resumeToApply.skills && Array.isArray(resumeToApply.skills)) {
        const skillsByCategory: Record<string, Set<string>> = {};
        
        resumeToApply.skills.forEach((skill: any) => {
          if (!skill) return;
          
          // Format 1: {category: string, items: string[]} - API format
          if (typeof skill === 'object' && 'items' in skill && Array.isArray(skill.items)) {
            const category = (skill.category || 'Technical').toLowerCase();
            const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            
            if (!skillsByCategory[normalizedCategory]) {
              skillsByCategory[normalizedCategory] = new Set();
            }
            skill.items
              .filter((item: any) => typeof item === 'string' && item.trim().length > 0)
              .forEach((item: string) => skillsByCategory[normalizedCategory].add(item.trim()));
          }
          // Format 2: {id: string, name: string, category: string} - Object format
          else if (typeof skill === 'object' && 'name' in skill && skill.name) {
            const category = (skill.category || 'Technical').toLowerCase();
            const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            
            if (!skillsByCategory[normalizedCategory]) {
              skillsByCategory[normalizedCategory] = new Set();
            }
            skillsByCategory[normalizedCategory].add(skill.name.trim());
          }
          // Format 3: string - Simple string
          else if (typeof skill === 'string' && skill.length > 0) {
            if (!skillsByCategory['Technical']) {
              skillsByCategory['Technical'] = new Set();
            }
            skillsByCategory['Technical'].add(skill.trim());
          }
        });
        
        // Convert to API format with consolidated categories
        transformedResume.skills = Object.entries(skillsByCategory)
          .filter(([_, items]) => items.size > 0)
          .map(([category, items]) => ({
            category,
            items: Array.from(items), // Convert Set to Array (automatically deduplicated)
          }));
      }

      // Map certifications
      if (resumeToApply.certifications && Array.isArray(resumeToApply.certifications)) {
        transformedResume.certifications = resumeToApply.certifications
          .filter((cert: any) => cert.name && cert.issuer)
          .map((cert: any) => ({
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date || '',
            expiryDate: cert.expiryDate || '',
            credentialId: cert.credentialId || '',
          }));
      }

      // Map projects
      if (resumeToApply.projects && Array.isArray(resumeToApply.projects)) {
        transformedResume.projects = resumeToApply.projects
          .filter((proj: any) => proj.name && proj.description)
          .map((proj: any) => ({
            name: proj.name,
            description: proj.description,
            technologies: Array.isArray(proj.technologies) ? proj.technologies : (Array.isArray(proj.techStack) ? proj.techStack : []),
            url: proj.url || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
          }));
      }

      // Map languages
      if (resumeToApply.languages && Array.isArray(resumeToApply.languages)) {
        transformedResume.languages = resumeToApply.languages
          .filter((lang: any) => lang.name && lang.proficiency)
          .map((lang: any) => ({
            name: lang.name,
            proficiency: lang.proficiency,
          }));
      }

      // Persist the post-optimization ATS score alongside the content so the
      // dashboard / resume list reflect the new number instead of the stale
      // pre-optimization score. Server-side PATCH already accepts atsScore.
      // Note: if the user rejected/edited a meaningful subset of changes, the
      // saved score may slightly overstate the actually-applied content. That's
      // accepted — user can hit "Re-analyze Resume" to recompute exactly. The
      // cost of recomputing here (an AI scoring call on every Apply) isn't
      // worth the ~2-3pt accuracy delta.
      const newScore = enhancementResult?.scores?.after?.overall;
      if (typeof newScore === 'number') {
        transformedResume.atsScore = Math.round(newScore);
      }

      console.log('Transformed resume data:', JSON.stringify(transformedResume, null, 2));

      const response = await authenticatedFetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        body: JSON.stringify(transformedResume),
      });

      const result = await response.json();
      console.log('Save response:', result);

      if (!response.ok) {
        // Show detailed validation errors
        if (result.error?.details) {
          console.error('Validation errors:', result.error.details);
          throw new Error(`Validation failed: ${JSON.stringify(result.error.details)}`);
        }
        throw new Error(result.error?.message || 'Failed to save enhanced resume');
      }

      setSuccessMessage('Changes applied successfully! Your resume has been updated.');
      setError(null);
      
      // Clear the enhancement result so user can see the success message with buttons
      setEnhancementResult(null);
      
      // Don't auto-redirect - let user decide when to go back
    } catch (error) {
      console.error('Apply error:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply changes');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/builder?id=${resumeId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Builder
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DocumentCheckIcon className="h-8 w-8 text-amber-600" />
            Tailor your resume to a job
          </h1>
          <p className="text-gray-600 mt-2">
            Paste a job description, see your match score, then auto-tailor your resume to match
          </p>

          {/* Privacy badge */}
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-gray-600">
            <LockClosedIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span>Your name, email and phone are never sent to AI — only your experience is analyzed.</span>
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{successMessage}</span>
              {(successMessage.includes('applied') || successMessage.includes('updated')) && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => window.location.href = `/builder?id=${resumeId}`}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View in Builder
                  </button>
                  <button
                    onClick={() => {
                      setSuccessMessage(null);
                      setAnalysisResult(null);
                      setEnhancementResult(null);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Re-analyze Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Job Description Upload */}
          <div>
            <div className="mb-3 inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Step 1</span>
              <span className="text-sm font-medium text-gray-600">Get your match score</span>
            </div>
            <JobDescriptionUpload
              resumeId={resumeId}
              onAnalysisComplete={handleAnalysisComplete}
              onError={setError}
            />

            {/* Enhancement Changes Preview */}
            {enhancementResult && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Changes Made
                  </h3>
                  <span className="text-sm text-gray-500">
                    {getAcceptedChangeCount()} of {enhancementResult.changes.length} accepted
                  </span>
                </div>

                {/* Summary */}
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-amber-600">
                        {enhancementResult.summary.skillsAdded}
                      </div>
                      <div className="text-sm text-gray-600">Skills Added</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {enhancementResult.summary.bulletsModified}
                      </div>
                      <div className="text-sm text-gray-600">Bullets Enhanced</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Changes with Edit/Reject */}
                <div className="space-y-4 max-h-[32rem] overflow-y-auto">
                  {enhancementResult.changes.map((change: any, index: number) => {
                    const isRejected = rejectedChanges.has(index);
                    const isEditing = editingIndex === index;
                    const hasEdit = editedChanges[index] !== undefined;
                    const displayText = hasEdit ? editedChanges[index] : change.after;

                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-all ${
                          isRejected
                            ? 'border-red-200 bg-red-50/50 opacity-60'
                            : hasEdit
                            ? 'border-yellow-300 bg-yellow-50/30'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type Badge */}
                          <div className="flex-shrink-0">
                            {change.type === 'added' && (
                              <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded">
                                Added
                              </span>
                            )}
                            {change.type === 'modified' && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                Modified
                              </span>
                            )}
                            {change.type === 'enhanced' && (
                              <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded">
                                Enhanced
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {change.section}
                            </div>

                            {/* Before text */}
                            {change.before && (
                              <div className="mb-2">
                                <div className="text-xs text-gray-500 mb-1">Before:</div>
                                <div className="text-sm text-gray-700 line-through">{renderMarkdownBold(change.before)}</div>
                              </div>
                            )}

                            {/* After text / Editing */}
                            {isEditing ? (
                              <div className="mb-2">
                                <div className="text-xs text-gray-500 mb-1">Edit:</div>
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm resize-none"
                                  autoFocus
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => saveEdit(index)}
                                    className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 flex items-center gap-1"
                                  >
                                    <CheckIcon className="h-3 w-3" />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-2">
                                <div className="text-xs text-gray-500 mb-1">
                                  {change.before ? (hasEdit ? 'Edited:' : 'After:') : 'Added:'}
                                </div>
                                <div className={`text-sm font-medium ${isRejected ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                  {renderMarkdownBold(displayText)}
                                </div>
                              </div>
                            )}

                            {/* What actually changed — a word-level diff for
                                rewrites (so a grammar-only tweak reads as one),
                                or the reason for added/structural changes. */}
                            {!isEditing && (
                              change.before && change.after ? (
                                <div className="text-xs leading-relaxed">
                                  <span className="text-gray-400 uppercase tracking-wide">Changes: </span>
                                  {renderWordDiff(change.before, change.after)}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600 italic">{change.reason}</div>
                              )
                            )}
                          </div>

                          {/* Action Buttons */}
                          {!isEditing && (
                            <div className="flex-shrink-0 flex flex-col gap-1.5">
                              {/* Edit button (only for modified/enhanced changes with text) */}
                              {(change.type === 'modified' || change.type === 'enhanced') && !isRejected && (
                                <button
                                  onClick={() => startEditing(index, displayText)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                  title="Edit this change"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                              )}
                              {/* Reject / Undo Reject button */}
                              <button
                                onClick={() => toggleReject(index)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  isRejected
                                    ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={isRejected ? 'Undo reject (accept this change)' : 'Reject this change'}
                              >
                                {isRejected ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  <XMarkIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Apply Button */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => applyEnhancements(enhancementResult.enhancedResume)}
                    disabled={getAcceptedChangeCount() === 0}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply {getAcceptedChangeCount()} Change{getAcceptedChangeCount() !== 1 ? 's' : ''} to Resume
                  </button>
                  {rejectedChanges.size > 0 && (
                    <button
                      onClick={() => setRejectedChanges(new Set())}
                      className="px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Accept All
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: ATS Dashboard */}
          <div>
            <div className="mb-3 inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Step 2</span>
              <span className="text-sm font-medium text-gray-600">Auto-tailor your resume</span>
            </div>
            <ATSDashboard
              beforeScore={analysisResult?.atsScore}
              afterScore={enhancementResult?.scores.after}
              improvement={enhancementResult?.scores.improvement}
              keyImprovements={enhancementResult?.scores.keyImprovements}
              isLoading={isEnhancing}
              onEnhance={analysisResult && !enhancementResult ? handleAutoEnhance : undefined}
            />
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paste the job description</h3>
              <p className="text-sm text-gray-600">
                Paste or upload the full job description including requirements and responsibilities
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">See your match score</h3>
              <p className="text-sm text-gray-600">
                We extract the keywords, skills, and requirements to calculate your match score
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Auto-tailor your resume to match</h3>
              <p className="text-sm text-gray-600">
                Tailor your resume to naturally weave in the relevant keywords and improvements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Changes Confirmation Modal */}
      <ConfirmModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setPendingEnhancement(null);
        }}
        onConfirm={() => {
          if (pendingEnhancement) {
            applyEnhancements(pendingEnhancement);
            setShowApplyModal(false);
            setPendingEnhancement(null);
          }
        }}
        title="Apply Resume Enhancements?"
        message={`This will apply ${getAcceptedChangeCount()} accepted changes to your resume (${rejectedChanges.size} rejected, ${Object.keys(editedChanges).length} edited). You can review and edit them afterwards in the builder.`}
        confirmText="Apply Changes"
        cancelText="Go Back"
        variant="info"
      />
    </div>
  );
}

export default function ATSOptimizationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>}>
      <ATSOptimizationPageContent />
    </Suspense>
  );
}
