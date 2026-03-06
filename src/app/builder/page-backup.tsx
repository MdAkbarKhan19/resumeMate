'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useResumes, getResume } from '@/hooks/useResumes';
import { useAI } from '@/hooks/useAI';
import { Button, Input, Textarea, Card, CardContent, PageLoading } from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { generateId } from '@/lib/utils';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import TemplateGallery from '@/components/templates/TemplateGallery';
import CustomizationPanel from '@/components/templates/CustomizationPanel';

type SectionKey = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'template';

const BuilderPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');

  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { createResume, updateResume } = useResumes(1, 10);
  const { enhanceBullet, generateSummary, isProcessing } = useAI();

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    personal: true,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    template: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [showPreview, setShowPreview] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('modern-two-column');
  const [customization, setCustomization] = useState<TemplateCustomization>(DEFAULT_CUSTOMIZATION);

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      github: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    volunteer: [],
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('resume-draft', JSON.stringify(resumeData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resumeData]);

  // Load resume data if editing, or draft if creating new
  useEffect(() => {
    const loadResumeData = async () => {
      if (resumeId) {
        // Editing existing resume
        setIsLoadingResume(true);
        try {
          const resume = await getResume(resumeId);
          if (resume) {
            setResumeTitle(resume.title || 'Untitled Resume');

            // Load template and customization
            if (resume.templateId) {
              setSelectedTemplateId(resume.templateId);
            }
            if (resume.customization) {
              setCustomization(resume.customization as TemplateCustomization);
            }

            // Transform API format to builder format
            setResumeData({
              personalInfo: {
                name: resume.personalInfo?.fullName || '',
                title: resume.personalInfo?.title || '',
                email: resume.personalInfo?.email || '',
                phone: resume.personalInfo?.phone || '',
                location: resume.personalInfo?.location || '',
                linkedin: resume.personalInfo?.linkedin || '',
                portfolio: resume.personalInfo?.website || '',
                github: resume.personalInfo?.github || '',
              },
              summary: resume.summary || '',
              experience: (resume.experience || []).map((exp: any) => ({
                id: exp.id || generateId(),
                company: exp.company || '',
                jobTitle: exp.position || '',
                location: exp.location || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                current: exp.current || false,
                bullets: exp.bullets || [],
              })),
              education: (resume.education || []).map((edu: any) => ({
                id: edu.id || generateId(),
                institution: edu.institution || '',
                degree: edu.degree || '',
                field: edu.field || '',
                location: edu.location || '',
                startDate: edu.startDate || '',
                graduationDate: edu.endDate || '', // API uses endDate, builder uses graduationDate
                gpa: edu.gpa || '',
              })),
              skills: (resume.skills || []).flatMap((skill: any) =>
                (skill.items || []).map((itemName: string) => ({
                  id: generateId(),
                  category: (skill.category || 'technical').toLowerCase(), // Normalize to lowercase
                  name: itemName,
                }))
              ),
              certifications: (resume.certifications || []).map((cert: any) => ({
                id: cert.id || generateId(),
                name: cert.name || '',
                issuer: cert.issuer || '',
                date: cert.date || '',
                expiryDate: cert.expiryDate || '',
                credentialId: cert.credentialId || '',
              })),
              projects: (resume.projects || []).map((proj: any) => ({
                id: proj.id || generateId(),
                name: proj.name || '',
                description: proj.description || '',
                techStack: proj.technologies || proj.techStack || [],
                url: proj.url || '',
                startDate: proj.startDate || '',
                endDate: proj.endDate || '',
              })),
              languages: (resume.languages || []).map((lang: any) => ({
                id: lang.id || generateId(),
                name: lang.name || '',
                proficiency: lang.proficiency || '',
              })),
              volunteer: [],
            });

            toast.success('Resume loaded successfully');
          } else {
            toast.error('Failed to load resume');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error loading resume:', error);
          toast.error('Failed to load resume');
          router.push('/dashboard');
        } finally {
          setIsLoadingResume(false);
        }
      } else {
        // Creating new resume - load draft if available
        const draft = localStorage.getItem('resume-draft');
        if (draft) {
          try {
            setResumeData(JSON.parse(draft));
            toast.info('Draft loaded from previous session');
          } catch (e) {
            console.error('Failed to load draft:', e);
          }
        }
      }
    };

    if (isAuthenticated) {
      loadResumeData();
    }
  }, [resumeId, isAuthenticated, router]);

  if (authLoading || isLoadingResume) {
    return <PageLoading text={isLoadingResume ? "Loading resume..." : "Loading builder..."} />;
  }

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionCompletion = (section: SectionKey): boolean => {
    switch (section) {
      case 'personal':
        return !!(resumeData.personalInfo.name && resumeData.personalInfo.email);
      case 'summary':
        return !!resumeData.summary;
      case 'experience':
        return resumeData.experience.length > 0;
      case 'education':
        return resumeData.education.length > 0;
      case 'skills':
        return resumeData.skills.length > 0;
      case 'template':
        return !!selectedTemplateId;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let result;
      if (resumeId) {
        // When updating, send data in the format the API expects
        result = await updateResume(resumeId, {
          title: resumeTitle,
          personalInfo: {
            fullName: resumeData.personalInfo.name || '',
            title: resumeData.personalInfo.title || '',
            email: resumeData.personalInfo.email || '',
            phone: resumeData.personalInfo.phone || '',
            location: resumeData.personalInfo.location || '',
            linkedin: resumeData.personalInfo.linkedin || '',
            website: resumeData.personalInfo.portfolio || '',
            github: resumeData.personalInfo.github || '',
          },
          summary: resumeData.summary || '',
          experience: resumeData.experience.map(exp => ({
            company: exp.company || '',
            position: exp.jobTitle || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            current: exp.current || false,
            bullets: exp.bullets || [],
          })),
          education: resumeData.education.map(edu => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            location: edu.location || '',
            startDate: edu.startDate || '',
            endDate: edu.graduationDate || '', // Builder uses graduationDate, API uses endDate
            gpa: edu.gpa || '',
          })),
          skills: Object.entries(
            resumeData.skills.reduce((acc, skill) => {
              if (!acc[skill.category]) {
                acc[skill.category] = [];
              }
              acc[skill.category].push(skill.name);
              return acc;
            }, {} as Record<string, string[]>)
          ).map(([category, items]) => ({
            category,
            items,
          })),
          certifications: resumeData.certifications.map(cert => ({
            name: cert.name || '',
            issuer: cert.issuer || '',
            date: cert.date || '',
            expiryDate: cert.expiryDate || '',
            credentialId: cert.credentialId || '',
          })),
          projects: resumeData.projects.map(proj => ({
            name: proj.name || '',
            description: proj.description || '',
            technologies: proj.techStack || [],
            url: proj.url || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
          })),
          languages: resumeData.languages.map(lang => ({
            name: lang.name || '',
            proficiency: lang.proficiency || '',
          })),
          templateId: selectedTemplateId,
          customization: customization,
        } as any);
      } else {
        result = await createResume(resumeTitle, selectedTemplateId, resumeData, customization);
      }

      if (result.success) {
        toast.success('Resume saved successfully');
        localStorage.removeItem('resume-draft');
        // Don't redirect if we're editing - stay on page for downloads
        if (!resumeId) {
          router.push('/dashboard');
        }
      } else {
        toast.error(result.error || 'Failed to save resume');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeId) {
      toast.error('Please save the resume first before downloading');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/export/pdf/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleDownloadDOCX = async () => {
    if (!resumeId) {
      toast.error('Please save the resume first before downloading');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/export/docx/${resumeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('DOCX downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download DOCX');
    }
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        {
          id: generateId(),
          jobTitle: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          bullets: [''],
        },
      ],
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...resumeData.experience];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, experience: updated });
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [
        ...resumeData.education,
        {
          id: generateId(),
          degree: '',
          institution: '',
          location: '',
          graduationDate: '',
        },
      ],
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [field]: value };
    setResumeData({ ...resumeData, education: updated });
  };

  const addSkill = (category: 'technical' | 'soft' | 'language') => {
    const skillName = prompt(`Enter ${category} skill:`);
    if (skillName) {
      setResumeData({
        ...resumeData,
        skills: [
          ...resumeData.skills,
          { id: generateId(), name: skillName, category },
        ],
      });
    }
  };

  const removeSkill = (id: string) => {
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((s) => s.id !== id),
    });
  };

  const handleEnhanceBullet = async (expIndex: number, bulletIndex: number) => {
    const bullet = resumeData.experience[expIndex].bullets[bulletIndex];
    if (!bullet.trim()) return;

    const result = await enhanceBullet(bullet);
    if (result.success && result.enhanced) {
      const updated = [...resumeData.experience];
      updated[expIndex].bullets[bulletIndex] = result.enhanced;
      setResumeData({ ...resumeData, experience: updated });
      toast.success('Bullet enhanced with AI');
    }
  };

  const handleGenerateSummary = async () => {
    if (resumeData.experience.length === 0) {
      toast.error('Add some experience first');
      return;
    }

    const skills = resumeData.skills.map((s) => s.name);
    const result = await generateSummary(
      resumeData.experience.length.toString(),
      skills
    );

    if (result.success && result.summary) {
      setResumeData({ ...resumeData, summary: result.summary });
      toast.success('Summary generated with AI');
    }
  };

  // Collapsible Section Component
  const CollapsibleSection: React.FC<{
    sectionKey: SectionKey;
    title: string;
    icon: string;
    children: React.ReactNode;
  }> = ({ sectionKey, title, icon, children }) => {
    const isExpanded = expandedSections[sectionKey];
    const isComplete = getSectionCompletion(sectionKey);

    return (
      <Card className="mb-4 overflow-hidden transition-all duration-200 hover:shadow-md">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">
                {isComplete ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </span>
                ) : (
                  'Click to expand'
                )}
              </p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <CardContent className="p-6 pt-0 border-t border-gray-100">
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fixed Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-0 z-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <Input
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="text-2xl font-bold border-none focus:ring-2 focus:ring-blue-500 px-0"
                placeholder="My Awesome Resume"
              />
              <p className="text-sm text-gray-500 mt-1">
                {resumeId ? 'Editing saved resume' : 'Create a new resume'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="lg:flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 lg:flex-row lg:gap-3 shadow-2xl bg-white rounded-full p-2">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {resumeId ? 'Update' : 'Save'}
          </Button>
          {resumeId && (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadDOCX}
                className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                DOCX
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/builder/ats?resumeId=${resumeId}`)}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                ATS Check
              </Button>
            </>
          )}
        </div>

        {/* Main Content - Split View */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left Side - Collapsible Sections */}
          <div className={`${showPreview ? 'lg:w-1/2' : 'w-full max-w-4xl mx-auto'} transition-all duration-300`}>

            {/* Personal Information Section */}
            <CollapsibleSection
              sectionKey="personal"
              title="Personal Information"
              icon="👤"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    value={resumeData.personalInfo.name}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, name: e.target.value },
                      })
                    }
                    required
                  />
                  <Input
                    label="Professional Title"
                    placeholder="e.g., Software Engineer"
                    value={resumeData.personalInfo.title || ''}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, title: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={resumeData.personalInfo.email}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, email: e.target.value },
                      })
                    }
                    required
                  />
                  <Input
                    label="Phone"
                    value={resumeData.personalInfo.phone}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, phone: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Location"
                    value={resumeData.personalInfo.location}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, location: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="LinkedIn"
                    value={resumeData.personalInfo.linkedin || ''}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="Portfolio/Website"
                    value={resumeData.personalInfo.portfolio || ''}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, portfolio: e.target.value },
                      })
                    }
                  />
                  <Input
                    label="GitHub"
                    value={resumeData.personalInfo.github || ''}
                    onChange={(e) =>
                      setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, github: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Professional Summary Section */}
            <CollapsibleSection
              sectionKey="summary"
              title="Professional Summary"
              icon="📝"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Write a compelling 2-3 sentence summary</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSummary}
                    isLoading={isProcessing}
                  >
                    AI Generate
                  </Button>
                </div>
                <Textarea
                  value={resumeData.summary}
                  onChange={(e) =>
                    setResumeData({ ...resumeData, summary: e.target.value })
                  }
                  rows={6}
                  placeholder="Dynamic and results-driven professional with..."
                />
              </div>
            </CollapsibleSection>

            {/* Work Experience Section */}
            <CollapsibleSection
              sectionKey="experience"
              title="Work Experience"
              icon="💼"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {resumeData.experience.length === 0
                      ? 'Add your work experience to showcase your career journey'
                      : `${resumeData.experience.length} experience${resumeData.experience.length !== 1 ? 's' : ''} added`}
                  </p>
                  <Button variant="primary" size="sm" onClick={addExperience}>
                    + Add Experience
                  </Button>
                </div>

                {resumeData.experience.map((exp, index) => (
                  <Card key={exp.id} variant="bordered" className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Job Title"
                          value={exp.jobTitle}
                          onChange={(e) =>
                            updateExperience(index, 'jobTitle', e.target.value)
                          }
                        />
                        <Input
                          label="Company"
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(index, 'company', e.target.value)
                          }
                        />
                        <Input
                          label="Location"
                          value={exp.location}
                          onChange={(e) =>
                            updateExperience(index, 'location', e.target.value)
                          }
                        />
                        <div className="flex gap-2">
                          <Input
                            label="Start"
                            type="month"
                            value={exp.startDate}
                            onChange={(e) =>
                              updateExperience(index, 'startDate', e.target.value)
                            }
                          />
                          <Input
                            label="End"
                            type="month"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateExperience(index, 'endDate', e.target.value)
                            }
                            disabled={exp.current}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) =>
                            updateExperience(index, 'current', e.target.checked)
                          }
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-700">I currently work here</span>
                      </label>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Achievements & Responsibilities
                        </label>
                        {exp.bullets.map((bullet, bIndex) => (
                          <div key={bIndex} className="flex gap-2">
                            <Textarea
                              value={bullet}
                              onChange={(e) => {
                                const updated = [...resumeData.experience];
                                updated[index].bullets[bIndex] = e.target.value;
                                setResumeData({ ...resumeData, experience: updated });
                              }}
                              rows={2}
                              placeholder="Describe your achievement or responsibility..."
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEnhanceBullet(index, bIndex)}
                              isLoading={isProcessing}
                              title="Enhance with AI"
                            >
                              AI
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = [...resumeData.experience];
                                updated[index].bullets.splice(bIndex, 1);
                                setResumeData({ ...resumeData, experience: updated });
                              }}
                              title="Remove bullet"
                            >
                              X
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...resumeData.experience];
                            updated[index].bullets.push('');
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                        >
                          + Add Bullet Point
                        </Button>
                      </div>
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = resumeData.experience.filter((_, i) => i !== index);
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Experience
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CollapsibleSection>

            {/* Education Section */}
            <CollapsibleSection
              sectionKey="education"
              title="Education"
              icon="🎓"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {resumeData.education.length === 0
                      ? 'Add your educational background'
                      : `${resumeData.education.length} education entr${resumeData.education.length !== 1 ? 'ies' : 'y'} added`}
                  </p>
                  <Button variant="primary" size="sm" onClick={addEducation}>
                    + Add Education
                  </Button>
                </div>

                {resumeData.education.map((edu, index) => (
                  <Card key={edu.id} variant="bordered" className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Degree"
                          placeholder="e.g., Bachelor of Science"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(index, 'degree', e.target.value)
                          }
                        />
                        <Input
                          label="Field of Study"
                          placeholder="e.g., Computer Science"
                          value={edu.field || ''}
                          onChange={(e) =>
                            updateEducation(index, 'field', e.target.value)
                          }
                        />
                        <Input
                          label="Institution"
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(index, 'institution', e.target.value)
                          }
                        />
                        <Input
                          label="Location"
                          value={edu.location}
                          onChange={(e) =>
                            updateEducation(index, 'location', e.target.value)
                          }
                        />
                        <Input
                          label="Start Date"
                          type="month"
                          value={edu.startDate || ''}
                          onChange={(e) =>
                            updateEducation(index, 'startDate', e.target.value)
                          }
                        />
                        <Input
                          label="Graduation Date"
                          type="month"
                          value={edu.graduationDate}
                          onChange={(e) =>
                            updateEducation(index, 'graduationDate', e.target.value)
                          }
                        />
                        <Input
                          label="GPA (Optional)"
                          placeholder="e.g., 3.8/4.0"
                          value={edu.gpa || ''}
                          onChange={(e) =>
                            updateEducation(index, 'gpa', e.target.value)
                          }
                        />
                      </div>
                      <div className="flex justify-end pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = resumeData.education.filter((_, i) => i !== index);
                            setResumeData({ ...resumeData, education: updated });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Education
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CollapsibleSection>

            {/* Skills Section */}
            <CollapsibleSection
              sectionKey="skills"
              title="Skills"
              icon="⚡"
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Technical Skills</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSkill('technical')}
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills
                      .filter((s) => s.category === 'technical')
                      .map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill.name}
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="hover:text-blue-900 font-bold"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    {resumeData.skills.filter((s) => s.category === 'technical').length === 0 && (
                      <p className="text-sm text-gray-500">No technical skills added yet</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Soft Skills</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSkill('soft')}
                    >
                      + Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills
                      .filter((s) => s.category === 'soft')
                      .map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {skill.name}
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="hover:text-green-900 font-bold"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    {resumeData.skills.filter((s) => s.category === 'soft').length === 0 && (
                      <p className="text-sm text-gray-500">No soft skills added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Template Selection */}
            <CollapsibleSection
              sectionKey="template"
              title="Template & Style"
              icon="🎨"
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4 text-gray-900">Choose Your Template</h4>
                  <TemplateGallery
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={setSelectedTemplateId}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4 text-gray-900">Customize Colors & Fonts</h4>
                  <CustomizationPanel
                    customization={customization}
                    onChange={setCustomization}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Progress Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Progress</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Personal Info</p>
                    <p className="font-semibold text-lg">
                      {getSectionCompletion('personal') ? 'Done' : 'Pending'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Summary</p>
                    <p className="font-semibold text-lg">
                      {getSectionCompletion('summary') ? 'Done' : 'Pending'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Experience</p>
                    <p className="font-semibold text-lg">{resumeData.experience.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Education</p>
                    <p className="font-semibold text-lg">{resumeData.education.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Skills</p>
                    <p className="font-semibold text-lg">{resumeData.skills.length}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-600">Template</p>
                    <p className="font-semibold text-lg">
                      {getSectionCompletion('template') ? 'Set' : 'Default'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Side - Sticky Preview */}
          {showPreview && (
            <div className="hidden lg:block lg:w-1/2 sticky top-24 h-fit">
              <Card className="shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Hide preview"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-inner"
                    style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
                  >
                    <div className="transform scale-75 origin-top">
                      <TemplateRenderer
                        templateId={selectedTemplateId}
                        data={resumeData}
                        customization={customization}
                        preview={true}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mobile Preview Toggle */}
          {!showPreview && (
            <div className="fixed bottom-6 left-6 z-30 lg:hidden">
              <Button
                variant="primary"
                onClick={() => setShowPreview(true)}
                className="rounded-full shadow-2xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
