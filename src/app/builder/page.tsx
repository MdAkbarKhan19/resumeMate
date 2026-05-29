'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getResume } from '@/hooks/useResumes';
import { useAI } from '@/hooks/useAI';
import { Button, Input, Textarea, Card, PageLoading } from '@/components/ui';
import { toast } from '@/components/ui/Alert';
import { ResumeData } from '@/types/resume';
import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { generateId } from '@/lib/utils';
import TemplateRenderer from '@/components/templates/TemplateRenderer';
import TemplateGallery from '@/components/templates/TemplateGallery';
import CustomizationPanel from '@/components/templates/CustomizationPanel';
import ResumeUploadModal from '@/components/resume/ResumeUploadModal';
import SkillsSection from '@/components/builder/SkillsSection';
import ExperienceSection from '@/components/builder/ExperienceSection';
import AgentProgressBar, { AgentStep } from '@/components/builder/AgentProgressBar';

type SectionKey = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'volunteer' | 'template';

interface CustomSection {
  id: string;
  title: string;
  content: string;
}

// Section navigation items
const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'summary', label: 'Summary', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'experience', label: 'Experience', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'education', label: 'Education', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { key: 'skills', label: 'Skills', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'projects', label: 'Projects', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { key: 'certifications', label: 'Certs', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { key: 'languages', label: 'Languages', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
  { key: 'volunteer', label: 'Volunteer', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { key: 'template', label: 'Template', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
];

const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
};

function toMonthInputValue(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (!s) return '';
  if (/^(present|current|now|ongoing|n\/a)$/i.test(s)) return '';
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);

  // "January 2024" / "Jan, 2024" / "Jan-2024" / "Jan '24" / "Jan-24"
  const monthYearLoose = s.toLowerCase().match(/([a-z]+)[\s,\-'.]+(\d{2,4})/);
  if (monthYearLoose) {
    const mon = MONTH_MAP[monthYearLoose[1]];
    if (mon) {
      let yr = monthYearLoose[2];
      if (yr.length === 2) yr = (parseInt(yr, 10) >= 50 ? '19' : '20') + yr;
      if (yr.length === 4) return `${yr}-${mon}`;
    }
  }

  // "2024 January" / "2024 Jan"
  const yearMonthWords = s.toLowerCase().match(/(\d{4})[\s,\-]+([a-z]+)/);
  if (yearMonthWords) {
    const mon = MONTH_MAP[yearMonthWords[2]];
    if (mon) return `${yearMonthWords[1]}-${mon}`;
  }

  // "01/2024" / "1-2024" / "1.2024"
  const numericSlash = s.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (numericSlash) {
    const month = parseInt(numericSlash[1], 10);
    if (month >= 1 && month <= 12) {
      return `${numericSlash[2]}-${String(month).padStart(2, '0')}`;
    }
  }

  // "2024/01" / "2024-1"
  const numericReverse = s.match(/^(\d{4})[\/\-.](\d{1,2})$/);
  if (numericReverse) {
    const month = parseInt(numericReverse[2], 10);
    if (month >= 1 && month <= 12) {
      return `${numericReverse[1]}-${String(month).padStart(2, '0')}`;
    }
  }

  // Bare 4-digit year only
  if (/^\d{4}$/.test(s)) return `${s}-01`;

  // NOTE: deliberately NO `new Date(s)` fallback here — `new Date("01")` returns
  // Jan 1 2001 (and similar surprises for "feb", "jun", "20", etc.), which is
  // how every imported field was collapsing to 2001. If a value doesn't match
  // any explicit pattern above, leave the field empty so the user can fix it.
  return '';
}

function normalizeSkillCategory(category: string | undefined | null): 'technical' | 'soft' | 'language' | 'tools' {
  if (!category) return 'technical';
  const cat = String(category).toLowerCase().trim();
  if (/^(soft|interpersonal|leadership|communication)/.test(cat) || cat.includes('soft skill')) return 'soft';
  if (/^(language|spoken)/.test(cat) && !cat.includes('programming')) return 'language';
  if (/(tool|platform|software|devops|cloud|database|operating)/.test(cat)) return 'tools';
  return 'technical';
}

const BuilderPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');

  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { enhanceBullet, generateSummary, isProcessing } = useAI();

  // Refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // State
  const [activeSection, setActiveSection] = useState<string>('personal');
  // Mobile accordion: which section is currently expanded on <lg screens.
  // Tapping a section header expands it and collapses whichever was previously
  // open. null = all collapsed. Desktop ignores this state (sections always
  // render fully).
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [showPreview, setShowPreview] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('modern-two-column');
  const [customization, setCustomization] = useState<TemplateCustomization>(DEFAULT_CUSTOMIZATION);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [newCustomSectionTitle, setNewCustomSectionTitle] = useState('');
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [showAgentProgress, setShowAgentProgress] = useState(false);

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', portfolio: '', github: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    volunteer: [],
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Auto-save to localStorage (debounced, 5 seconds)
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem('resume-draft', JSON.stringify(resumeData));
      } catch {}
    }, 5000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [resumeData]);

  // Load resume data
  useEffect(() => {
    const loadResumeData = async () => {
      if (resumeId) {
        setIsLoadingResume(true);
        try {
          const resume = await getResume(resumeId);
          if (resume) {
            setResumeTitle(resume.title || 'Untitled Resume');
            if (resume.templateId) setSelectedTemplateId(resume.templateId);
            if (resume.customization) setCustomization(resume.customization as TemplateCustomization);

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
                id: exp.id || generateId(), company: exp.company || '', jobTitle: exp.position || '',
                location: exp.location || '',
                startDate: toMonthInputValue(exp.startDate),
                endDate: toMonthInputValue(exp.endDate),
                current: exp.current || /^(present|current|now|ongoing)$/i.test(String(exp.endDate || '')),
                bullets: exp.bullets || [],
              })),
              education: (resume.education || []).map((edu: any) => ({
                id: edu.id || generateId(), institution: edu.institution || '', degree: edu.degree || '',
                field: edu.field || '', location: edu.location || '',
                startDate: toMonthInputValue(edu.startDate),
                graduationDate: toMonthInputValue(edu.endDate || edu.graduationDate),
                gpa: edu.gpa || '',
              })),
              // Skills can arrive in several shapes depending on whether the
              // resume was created from upload, the builder, or the ATS pass:
              //   1) Grouped:   [{ category: 'Technical', items: ['React', ...] }]
              //   2) Flat:      [{ id, name: 'React', category: 'technical' }]
              //   3) String:    ['React', 'Node.js']
              //   4) Mixed
              // The old loader only handled (1) and silently dropped everything else,
              // which is why the preview's Skills section appeared empty even when
              // the PDF download (whose normalizer is permissive) showed them.
              skills: (resume.skills || []).flatMap((skill: any) => {
                if (!skill) return [];
                if (typeof skill === 'string') {
                  return [{ id: generateId(), name: skill, category: normalizeSkillCategory(undefined) }];
                }
                if (Array.isArray(skill.items)) {
                  const cat = normalizeSkillCategory(skill.category);
                  return skill.items
                    .filter((it: any) => typeof it === 'string' && it.trim())
                    .map((itemName: string) => ({ id: generateId(), name: itemName.trim(), category: cat }));
                }
                if (Array.isArray(skill.keywords)) {
                  const cat = normalizeSkillCategory(skill.category);
                  return skill.keywords
                    .filter((it: any) => typeof it === 'string' && it.trim())
                    .map((itemName: string) => ({ id: generateId(), name: itemName.trim(), category: cat }));
                }
                if (skill.name) {
                  return [{
                    id: skill.id || generateId(),
                    name: String(skill.name),
                    category: normalizeSkillCategory(skill.category),
                  }];
                }
                return [];
              }),
              certifications: (resume.certifications || []).map((cert: any) => ({
                id: cert.id || generateId(), name: cert.name || '', issuer: cert.issuer || '',
                date: toMonthInputValue(cert.date),
                expiryDate: toMonthInputValue(cert.expiryDate),
                credentialId: cert.credentialId || '',
                url: cert.url || '',
              })),
              projects: (resume.projects || []).map((proj: any) => ({
                id: proj.id || generateId(), name: proj.name || '', description: proj.description || '',
                techStack: proj.technologies || proj.techStack || [], url: proj.url || '',
                startDate: toMonthInputValue(proj.startDate),
                endDate: toMonthInputValue(proj.endDate),
              })),
              languages: (resume.languages || []).map((lang: any) => ({
                id: lang.id || generateId(), name: lang.name || '', proficiency: lang.proficiency || '',
              })),
              volunteer: ((resume as any).volunteer || []).map((vol: any) => ({
                id: vol.id || generateId(), role: vol.role || '', organization: vol.organization || '',
                location: vol.location || '',
                startDate: toMonthInputValue(vol.startDate),
                endDate: toMonthInputValue(vol.endDate),
                current: vol.current || /^(present|current|now|ongoing)$/i.test(String(vol.endDate || '')),
                description: vol.description || '',
              })),
            });
            if ((resume as any).customSections) {
              const raw = (resume as any).customSections;
              if (Array.isArray(raw)) {
                const normalized = raw
                  .map((s: any): CustomSection | null => {
                    if (!s || typeof s !== 'object') return null;
                    return {
                      id: s.id || generateId(),
                      title: s.title || '',
                      content: s.content || '',
                    };
                  })
                  .filter((s): s is CustomSection => s !== null);
                setCustomSections(normalized);
              }
            }
            toast.success('Resume loaded successfully');
          } else {
            toast.error('Failed to load resume');
            router.push('/dashboard');
          }
        } catch {
          toast.error('Failed to load resume');
          router.push('/dashboard');
        } finally {
          setIsLoadingResume(false);
        }
      } else {
        const draft = localStorage.getItem('resume-draft');
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            setResumeData(prev => ({
              ...prev,
              ...parsed,
              certifications: parsed.certifications ?? [],
              languages: parsed.languages ?? [],
              volunteer: parsed.volunteer ?? [],
              projects: parsed.projects ?? [],
              skills: parsed.skills ?? [],
              experience: parsed.experience ?? [],
              education: parsed.education ?? [],
            }));
            toast.info('Draft loaded from previous session');
          } catch {}
        }
      }
    };
    if (isAuthenticated) loadResumeData();
  }, [resumeId, isAuthenticated, router]);

  // Navigation: desktop scrolls to section; mobile also expands its accordion.
  const scrollToSection = useCallback((key: SectionKey) => {
    setActiveSection(key);
    setMobileOpenSection(key);
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const toggleMobileSection = useCallback((key: string) => {
    setMobileOpenSection(prev => {
      const next = prev === key ? null : key;
      // When opening a section on mobile, scroll its header to the top of
      // the viewport on the next frame (after the body renders), so the
      // expanded content appears below the header instead of off-screen.
      if (next === key) {
        requestAnimationFrame(() => {
          const el = sectionRefs.current[key];
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY;
            const toolbarHeight = 64; // sticky top toolbar
            window.scrollTo({ top: Math.max(0, top - toolbarHeight - 8), behavior: 'smooth' });
          }
        });
      }
      return next;
    });
  }, []);

  // Personal info helpers
  const updatePersonalInfo = useCallback((field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  }, []);

  // Education CRUD
  const addEducation = useCallback(() => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: generateId(), degree: '', field: '', institution: '', location: '',
        startDate: '', graduationDate: '', gpa: '',
      }],
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  }, []);

  const removeEducation = useCallback((index: number) => {
    setResumeData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  }, []);

  // Projects CRUD
  const addProject = useCallback(() => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: generateId(), name: '', description: '', techStack: [], url: '', startDate: '', endDate: '',
      }],
    }));
  }, []);

  const updateProject = useCallback((index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  }, []);

  const removeProject = useCallback((index: number) => {
    setResumeData(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  }, []);

  // Certifications CRUD
  const addCertification = useCallback(() => {
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        id: generateId(), name: '', issuer: '', date: '', expiryDate: '', credentialId: '', url: '',
      }],
    }));
  }, []);

  const updateCertification = useCallback((index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  }, []);

  const removeCertification = useCallback((index: number) => {
    setResumeData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  }, []);

  // Languages CRUD
  const addLanguage = useCallback(() => {
    setResumeData(prev => ({
      ...prev,
      languages: [...prev.languages, { id: generateId(), name: '', proficiency: '' }],
    }));
  }, []);

  const updateLanguage = useCallback((index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updated = [...prev.languages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, languages: updated };
    });
  }, []);

  const removeLanguage = useCallback((index: number) => {
    setResumeData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
  }, []);

  // Volunteer CRUD
  const addVolunteer = useCallback(() => {
    setResumeData(prev => ({
      ...prev,
      volunteer: [...prev.volunteer, {
        id: generateId(), role: '', organization: '', location: '',
        startDate: '', endDate: '', current: false, description: '',
      }],
    }));
  }, []);

  const updateVolunteer = useCallback((index: number, field: string, value: any) => {
    setResumeData(prev => {
      const updated = [...prev.volunteer];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, volunteer: updated };
    });
  }, []);

  const removeVolunteer = useCallback((index: number) => {
    setResumeData(prev => ({ ...prev, volunteer: prev.volunteer.filter((_, i) => i !== index) }));
  }, []);

  // Custom Sections
  const addCustomSection = useCallback(() => {
    const title = newCustomSectionTitle.trim();
    if (!title) return;
    setCustomSections(prev => [...prev, { id: generateId(), title, content: '' }]);
    setNewCustomSectionTitle('');
  }, [newCustomSectionTitle]);

  const updateCustomSection = useCallback((id: string, field: 'title' | 'content', value: string) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const removeCustomSection = useCallback((id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
  }, []);

  // AI Handlers
  const handleEnhanceBullet = useCallback(async (expIndex: number, bulletIndex: number) => {
    const bullet = resumeData.experience[expIndex]?.bullets[bulletIndex];
    if (!bullet?.trim()) return;
    const result = await enhanceBullet(bullet);
    if (result.success && result.enhanced) {
      setResumeData(prev => {
        const updated = [...prev.experience];
        updated[expIndex] = { ...updated[expIndex], bullets: [...updated[expIndex].bullets] };
        updated[expIndex].bullets[bulletIndex] = result.enhanced;
        return { ...prev, experience: updated };
      });
      toast.success('Bullet enhanced');
    }
  }, [resumeData.experience, enhanceBullet]);

  const handleGenerateSummary = useCallback(async () => {
    if (resumeData.experience.length === 0) {
      toast.error('Add experience first');
      return;
    }
    const skills = resumeData.skills.map(s => s.name);
    const result = await generateSummary(resumeData.experience.length.toString(), skills);
    if (result.success && result.summary) {
      setResumeData(prev => ({ ...prev, summary: result.summary }));
      toast.success('Summary generated');
    }
  }, [resumeData.experience, resumeData.skills, generateSummary]);

  // Save/Export
  const handleSave = useCallback(async (skipNavigation = false) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
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
          company: exp.company || '', position: exp.jobTitle || '', location: exp.location || '',
          startDate: exp.startDate || '', endDate: exp.endDate || '', current: exp.current || false,
          bullets: exp.bullets || [],
        })),
        education: resumeData.education.map(edu => ({
          institution: edu.institution || '', degree: edu.degree || '', field: edu.field || '',
          location: edu.location || '', startDate: edu.startDate || '', endDate: edu.graduationDate || '',
          gpa: edu.gpa || '',
        })),
        skills: Object.entries(
          resumeData.skills.reduce((acc, skill) => {
            const cat = skill.category || 'technical';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(skill.name);
            return acc;
          }, {} as Record<string, string[]>)
        ).map(([category, items]) => ({ category, items })),
        certifications: resumeData.certifications.map(cert => ({
          name: cert.name || '', issuer: cert.issuer || '', date: cert.date || '',
          expiryDate: cert.expiryDate || '', credentialId: cert.credentialId || '',
          url: cert.url || '',
        })),
        projects: resumeData.projects.map(proj => ({
          name: proj.name || '', description: proj.description || '',
          technologies: proj.techStack || [], url: proj.url || '',
          startDate: proj.startDate || '', endDate: proj.endDate || '',
        })),
        languages: resumeData.languages.map(lang => ({ name: lang.name || '', proficiency: lang.proficiency || '' })),
        volunteer: resumeData.volunteer.map(vol => ({
          role: vol.role || '', organization: vol.organization || '', location: vol.location || '',
          startDate: vol.startDate || '', endDate: vol.endDate || '', current: vol.current || false,
          description: vol.description || '',
        })),
        customSections: (customSections || [])
          .filter(s => s && (s.title?.trim() || s.content?.trim()))
          .map(s => ({
            id: s.id || generateId(),
            title: s.title || 'Section',
            content: s.content || '',
          })),
        templateId: selectedTemplateId,
        customization,
      };

      let result;
      if (resumeId) {
        const response = await fetch(`/api/resumes/${resumeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        result = await response.json();
      } else {
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        result = await response.json();
      }

      if (result.success) {
        toast.success('Resume saved');
        localStorage.removeItem('resume-draft');
        if (!resumeId && result.data?.id) {
          if (!skipNavigation) {
            router.push(`/builder?id=${result.data.id}`);
          }
          return result.data.id;
        }
        return resumeId;
      } else {
        toast.error(result.error?.message || result.error || 'Failed to save');
        return null;
      }
    } catch {
      toast.error('An error occurred while saving');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [resumeId, resumeTitle, resumeData, customSections, selectedTemplateId, customization, router]);

  // DOCX export is temporarily disabled — only PDF is supported in the UI.
  // The /api/export/docx route and EnhancedDOCXService still exist if we want
  // to re-enable Word export later; just restore the 'docx' branch + button.
  const handleDownload = useCallback(async (format: 'pdf') => {
    try {
      const savedId = await handleSave(true);
      const currentResumeId = savedId || resumeId;
      if (!currentResumeId) {
        toast.error('Please save the resume first');
        return;
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/export/${format}/${currentResumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to download ${format.toUpperCase()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    }
  }, [resumeId, resumeTitle, handleSave]);

  // Section completion helper
  const getSectionCompletion = useCallback((section: SectionKey): boolean => {
    switch (section) {
      case 'personal': return !!(resumeData.personalInfo.name && resumeData.personalInfo.email);
      case 'summary': return !!resumeData.summary;
      case 'experience': return resumeData.experience.length > 0;
      case 'education': return resumeData.education.length > 0;
      case 'skills': return resumeData.skills.length > 0;
      case 'projects': return resumeData.projects.length > 0;
      case 'certifications': return resumeData.certifications.length > 0;
      case 'languages': return resumeData.languages.length > 0;
      case 'volunteer': return resumeData.volunteer.length > 0;
      case 'template': return !!selectedTemplateId;
      default: return false;
    }
  }, [resumeData, selectedTemplateId]);

  if (authLoading || isLoadingResume) {
    return <PageLoading text={isLoadingResume ? 'Loading resume...' : 'Loading builder...'} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agent Progress Bar */}
      <AgentProgressBar
        steps={agentSteps}
        isVisible={showAgentProgress}
        onClose={() => setShowAgentProgress(false)}
      />

      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <input
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="text-lg font-semibold text-gray-900 border-none focus:ring-0 focus:outline-none bg-transparent truncate w-full max-w-xs"
                placeholder="Resume Title"
              />
              <span className="text-xs text-gray-400 hidden sm:inline">{resumeId ? 'Editing' : 'New'}</span>
            </div>

            {/* Center: Action Buttons */}
            <div className="flex items-center gap-2">
              {!resumeId && (
                <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                  Import
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="hidden lg:flex"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            {/* Right: Save/Export */}
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => handleSave()} isLoading={isSaving}>
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('pdf')}
              >
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </Button>
              {/* Word/DOCX download intentionally hidden — PDF only for now.
                  The export route and DOCX builder still exist; restore this
                  button + the 'docx' branch in handleDownload to bring it back. */}
              {resumeId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/builder/ats?resumeId=${resumeId}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                >
                  ATS Score
                </Button>
              )}
            </div>
          </div>

          {/* Section Navigation Pills (desktop only) */}
          <div className="hidden lg:flex gap-1 mt-3 overflow-x-auto pb-1 -mb-3 border-b-0">
            {SECTIONS.map(section => {
              const isComplete = getSectionCompletion(section.key);
              const isActive = activeSection === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => scrollToSection(section.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'bg-white text-blue-600 border-blue-600'
                      : isComplete
                        ? 'text-green-600 border-transparent hover:bg-gray-100'
                        : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                  {section.label}
                  {isComplete && !isActive && (
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-4 lg:py-6">
        <div className="flex gap-6">
          {/* Left: Form */}
          <div className={`flex-1 min-w-0 space-y-6 ${showPreview ? 'lg:max-w-[55%]' : ''}`}>

            {/* Personal Information */}
            <div ref={(el) => { sectionRefs.current['personal'] = el; }}>
              <SectionCard title="Personal Information" sectionKey="personal" isComplete={getSectionCompletion('personal')} isMobileOpen={mobileOpenSection === 'personal'} onMobileToggle={() => toggleMobileSection('personal')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name *" value={resumeData.personalInfo.name} onChange={(e) => updatePersonalInfo('name', e.target.value)} placeholder="John Smith" />
                  <Input label="Professional Title" value={resumeData.personalInfo.title || ''} onChange={(e) => updatePersonalInfo('title', e.target.value)} placeholder="Software Engineer" />
                  <Input label="Email *" type="email" value={resumeData.personalInfo.email} onChange={(e) => updatePersonalInfo('email', e.target.value)} placeholder="john@example.com" />
                  <Input label="Phone" value={resumeData.personalInfo.phone} onChange={(e) => updatePersonalInfo('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                  <Input label="Location" value={resumeData.personalInfo.location} onChange={(e) => updatePersonalInfo('location', e.target.value)} placeholder="San Francisco, CA" />
                  <Input label="LinkedIn" value={resumeData.personalInfo.linkedin || ''} onChange={(e) => updatePersonalInfo('linkedin', e.target.value)} placeholder="linkedin.com/in/johnsmith" />
                  <Input label="Portfolio" value={resumeData.personalInfo.portfolio || ''} onChange={(e) => updatePersonalInfo('portfolio', e.target.value)} placeholder="johnsmith.dev" />
                  <Input label="GitHub" value={resumeData.personalInfo.github || ''} onChange={(e) => updatePersonalInfo('github', e.target.value)} placeholder="github.com/johnsmith" />
                </div>
              </SectionCard>
            </div>

            {/* Summary */}
            <div ref={(el) => { sectionRefs.current['summary'] = el; }}>
              <SectionCard title="Professional Summary" sectionKey="summary" isComplete={getSectionCompletion('summary')} isMobileOpen={mobileOpenSection === 'summary'} onMobileToggle={() => toggleMobileSection('summary')}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">A concise 2-3 sentence overview of your experience</p>
                    <Button variant="outline" size="sm" onClick={handleGenerateSummary} isLoading={isProcessing}>
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    value={resumeData.summary}
                    onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                    rows={4}
                    placeholder="Experienced software engineer with 5+ years building scalable web applications..."
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{resumeData.summary.length} characters</span>
                    <span className={resumeData.summary.length > 100 && resumeData.summary.length < 400 ? 'text-green-500' : 'text-orange-500'}>
                      Recommended: 100-400 characters
                    </span>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Experience */}
            <div ref={(el) => { sectionRefs.current['experience'] = el; }}>
              <SectionCard title="Work Experience" sectionKey="experience" isComplete={getSectionCompletion('experience')} isMobileOpen={mobileOpenSection === 'experience'} onMobileToggle={() => toggleMobileSection('experience')}>
                <ExperienceSection
                  experiences={resumeData.experience}
                  onExperiencesChange={(experiences) => setResumeData(prev => ({ ...prev, experience: experiences }))}
                  onEnhanceBullet={handleEnhanceBullet}
                  isProcessing={isProcessing}
                />
              </SectionCard>
            </div>

            {/* Education */}
            <div ref={(el) => { sectionRefs.current['education'] = el; }}>
              <SectionCard title="Education" sectionKey="education" isComplete={getSectionCompletion('education')} isMobileOpen={mobileOpenSection === 'education'} onMobileToggle={() => toggleMobileSection('education')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{resumeData.education.length === 0 ? 'Add your education' : `${resumeData.education.length} entries`}</p>
                    <Button type="button" variant="primary" size="sm" onClick={addEducation}>+ Add Education</Button>
                  </div>
                  {resumeData.education.map((edu, index) => (
                    <Card key={edu.id} className="p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Degree" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} placeholder="Bachelor of Science" />
                        <Input label="Field" value={edu.field || ''} onChange={(e) => updateEducation(index, 'field', e.target.value)} placeholder="Computer Science" />
                        <Input label="Institution" value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} placeholder="MIT" />
                        <Input label="Location" value={edu.location} onChange={(e) => updateEducation(index, 'location', e.target.value)} placeholder="Cambridge, MA" />
                        <Input label="Start Date" type="month" value={edu.startDate || ''} onChange={(e) => updateEducation(index, 'startDate', e.target.value)} />
                        <Input label="Graduation Date" type="month" value={edu.graduationDate} onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)} />
                        <Input label="GPA (optional)" value={edu.gpa || ''} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} placeholder="3.8/4.0" />
                      </div>
                      <div className="flex justify-end mt-3 pt-3 border-t">
                        <button type="button" onClick={() => removeEducation(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    </Card>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Skills */}
            <div ref={(el) => { sectionRefs.current['skills'] = el; }}>
              <SectionCard title="Skills" sectionKey="skills" isComplete={getSectionCompletion('skills')} isMobileOpen={mobileOpenSection === 'skills'} onMobileToggle={() => toggleMobileSection('skills')}>
                <SkillsSection
                  skills={resumeData.skills}
                  onSkillsChange={(skills) => setResumeData(prev => ({ ...prev, skills }))}
                  isProcessing={isProcessing}
                />
              </SectionCard>
            </div>

            {/* Projects */}
            <div ref={(el) => { sectionRefs.current['projects'] = el; }}>
              <SectionCard title="Projects" sectionKey="projects" isComplete={getSectionCompletion('projects')} isMobileOpen={mobileOpenSection === 'projects'} onMobileToggle={() => toggleMobileSection('projects')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showcase your work</p>
                    <Button type="button" variant="primary" size="sm" onClick={addProject}>+ Add Project</Button>
                  </div>
                  {resumeData.projects.map((proj, index) => (
                    <Card key={proj.id} className="p-4 border border-gray-200">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input label="Project Name" value={proj.name} onChange={(e) => updateProject(index, 'name', e.target.value)} placeholder="E-commerce Platform" />
                          <Input label="URL (optional)" value={proj.url || ''} onChange={(e) => updateProject(index, 'url', e.target.value)} placeholder="github.com/..." />
                        </div>
                        <Textarea label="Description" value={proj.description} onChange={(e) => updateProject(index, 'description', e.target.value)} placeholder="Built a full-stack..." rows={2} />
                        <Input label="Technologies (comma-separated)" value={proj.techStack.join(', ')} onChange={(e) => updateProject(index, 'techStack', e.target.value.split(',').map(t => t.trim()))} placeholder="React, Node.js, MongoDB" />
                        <div className="flex justify-end pt-2 border-t">
                          <button type="button" onClick={() => removeProject(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Certifications */}
            <div ref={(el) => { sectionRefs.current['certifications'] = el; }}>
              <SectionCard title="Certifications" sectionKey="certifications" isComplete={getSectionCompletion('certifications')} isMobileOpen={mobileOpenSection === 'certifications'} onMobileToggle={() => toggleMobileSection('certifications')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Professional certifications</p>
                    <Button type="button" variant="primary" size="sm" onClick={addCertification}>+ Add</Button>
                  </div>
                  {resumeData.certifications.map((cert, index) => (
                    <Card key={cert.id} className="p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Name" value={cert.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
                        <Input label="Issuer" value={cert.issuer} onChange={(e) => updateCertification(index, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                        <Input label="Date" type="month" value={cert.date} onChange={(e) => updateCertification(index, 'date', e.target.value)} />
                        <Input label="Credential ID" value={cert.credentialId || ''} onChange={(e) => updateCertification(index, 'credentialId', e.target.value)} placeholder="ABC123" />
                        <Input label="Credential URL" value={cert.url || ''} onChange={(e) => updateCertification(index, 'url', e.target.value)} placeholder="https://www.credly.com/..." className="md:col-span-2" />
                      </div>
                      <div className="flex justify-end mt-3 pt-3 border-t">
                        <button type="button" onClick={() => removeCertification(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      </div>
                    </Card>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Languages */}
            <div ref={(el) => { sectionRefs.current['languages'] = el; }}>
              <SectionCard title="Languages" sectionKey="languages" isComplete={getSectionCompletion('languages')} isMobileOpen={mobileOpenSection === 'languages'} onMobileToggle={() => toggleMobileSection('languages')}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Spoken/written languages</p>
                    <Button type="button" variant="primary" size="sm" onClick={addLanguage}>+ Add</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resumeData.languages.map((lang, index) => (
                      <div key={lang.id} className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
                        <Input value={lang.name} onChange={(e) => updateLanguage(index, 'name', e.target.value)} placeholder="English" className="flex-1" />
                        <select value={lang.proficiency} onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)} className="px-2 py-2 border rounded-lg bg-white text-sm">
                          <option value="">Level</option>
                          <option value="Native">Native</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Professional">Professional</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Basic">Basic</option>
                        </select>
                        <button type="button" onClick={() => removeLanguage(index)} className="text-red-400 hover:text-red-600 p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Volunteer */}
            <div ref={(el) => { sectionRefs.current['volunteer'] = el; }}>
              <SectionCard title="Volunteer Experience" sectionKey="volunteer" isComplete={getSectionCompletion('volunteer')} isMobileOpen={mobileOpenSection === 'volunteer'} onMobileToggle={() => toggleMobileSection('volunteer')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Community involvement</p>
                    <Button type="button" variant="primary" size="sm" onClick={addVolunteer}>+ Add</Button>
                  </div>
                  {resumeData.volunteer.map((vol, index) => (
                    <Card key={vol.id} className="p-4 border border-gray-200">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input label="Role" value={vol.role} onChange={(e) => updateVolunteer(index, 'role', e.target.value)} placeholder="Coordinator" />
                          <Input label="Organization" value={vol.organization} onChange={(e) => updateVolunteer(index, 'organization', e.target.value)} placeholder="Red Cross" />
                          <Input label="Start" type="month" value={vol.startDate} onChange={(e) => updateVolunteer(index, 'startDate', e.target.value)} />
                          <Input label="End" type="month" value={vol.endDate} onChange={(e) => updateVolunteer(index, 'endDate', e.target.value)} disabled={vol.current} />
                        </div>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={vol.current} onChange={(e) => updateVolunteer(index, 'current', e.target.checked)} className="rounded text-blue-600" />
                          <span className="text-sm text-gray-700">Currently volunteering</span>
                        </label>
                        <Textarea label="Description" value={vol.description} onChange={(e) => updateVolunteer(index, 'description', e.target.value)} rows={2} placeholder="Describe your impact..." />
                        <div className="flex justify-end pt-2 border-t">
                          <button type="button" onClick={() => removeVolunteer(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Custom Sections */}
            {customSections.map(section => (
              <div key={section.id}>
              <SectionCard title={section.title} sectionKey={section.id} isComplete={!!section.content} isMobileOpen={mobileOpenSection === section.id} onMobileToggle={() => toggleMobileSection(section.id)}>
                <div className="space-y-3">
                  <Input label="Section Title" value={section.title} onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)} />
                  <Textarea label="Content" value={section.content} onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)} rows={4} />
                  <div className="flex justify-end">
                    <button type="button" onClick={() => removeCustomSection(section.id)} className="text-xs text-red-500 hover:text-red-700">Remove Section</button>
                  </div>
                </div>
              </SectionCard>
              </div>
            ))}

            {/* Add Custom Section (desktop only — mobile users add via the section index) */}
            <div className="hidden lg:block border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div className="flex gap-2 items-center">
                <Input
                  value={newCustomSectionTitle}
                  onChange={(e) => setNewCustomSectionTitle(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSection(); } }}
                  placeholder="Add custom section (Publications, Awards, Hobbies...)"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomSection} disabled={!newCustomSectionTitle.trim()}>
                  + Add
                </Button>
              </div>
            </div>

            {/* Template Selection */}
            <div ref={(el) => { sectionRefs.current['template'] = el; }}>
              <SectionCard title="Template & Style" sectionKey="template" isComplete={getSectionCompletion('template')} isMobileOpen={mobileOpenSection === 'template'} onMobileToggle={() => toggleMobileSection('template')}>
                <div className="space-y-6">
                  <TemplateGallery selectedTemplateId={selectedTemplateId} onTemplateSelect={setSelectedTemplateId} />
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 text-gray-700">Customize</h4>
                    <CustomizationPanel customization={customization} onChange={setCustomization} />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Bottom spacer for floating bar */}
            <div className="h-20" />
          </div>

          {/* Right: Live Preview */}
          {showPreview && (
            <div className="hidden lg:block lg:w-[45%] lg:max-w-[45%]">
              <div className="sticky top-36">
                <Card className="shadow-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <span className="text-sm font-medium text-gray-600">Live Preview</span>
                    <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <div className="transform scale-[0.65] origin-top">
                      <TemplateRenderer
                        templateId={selectedTemplateId}
                        // Merge customSections into the preview data — they live
                        // in a separate state slice in the builder, but the
                        // templates expect them on `data.customSections` (which
                        // is how the saved/downloaded version sees them).
                        data={{ ...resumeData, customSections }}
                        customization={customization}
                        preview={true}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(newResumeId) => {
          setShowUploadModal(false);
          router.push(`/builder?id=${newResumeId}`);
        }}
      />
    </div>
  );
};

// Section Card. On mobile the header is a tappable accordion control; on
// desktop the body is always visible.
function SectionCard({ title, isComplete, isMobileOpen, onMobileToggle, children }: {
  title: string;
  sectionKey: string;
  isComplete: boolean;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={onMobileToggle}
        className="w-full px-4 lg:px-5 py-3.5 bg-white border-b border-gray-100 flex items-center justify-between text-left lg:cursor-default"
      >
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isComplete && (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform lg:hidden ${isMobileOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className={`${isMobileOpen ? 'block' : 'hidden'} lg:block px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5`}>
        {children}
      </div>
    </Card>
  );
}

export default function BuilderPageWrapper() {
  return (
    <Suspense fallback={<PageLoading />}>
      <BuilderPage />
    </Suspense>
  );
}
