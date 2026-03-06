'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { ResumeData } from '@/types';

interface Resume {
  id: string;
  userId?: string;
  title: string;
  templateId?: string;
  customization?: any;
  template?: {
    id: string;
    name: string;
    thumbnail: string | null;
  };
  personalInfo?: any;
  summary?: string;
  experience?: any[];
  education?: any[];
  skills?: any[];
  projects?: any[];
  certifications?: any[];
  languages?: any[];
  content?: ResumeData;
  atsScore: number | null;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResumesResponse {
  resumes: Resume[];
  total: number;
  page: number;
  totalPages: number;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  
  // **TESTING MODE: Return mock data for test token**
  if (token === 'test-token-bypass') {
    const mockResumes = localStorage.getItem('mock-resumes');
    const resumes = mockResumes ? JSON.parse(mockResumes) : [];
    
    return {
      resumes: resumes,
      total: resumes.length,
      page: 1,
      totalPages: 1,
    };
  }
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  const result = await response.json();
  
  // Handle API response format: { success: true, data: { resumes, pagination } }
  if (result.success && result.data) {
    const formatted = {
      resumes: result.data.resumes || [],
      total: result.data.pagination?.total || 0,
      page: result.data.pagination?.page || 1,
      totalPages: result.data.pagination?.totalPages || 1,
    };
    console.log('[useResumes] Fetched resumes:', formatted.resumes.length, 'resumes');
    return formatted;
  }
  
  // Fallback for direct response format
  console.log('[useResumes] Using fallback format');
  return result;
};

// Standalone function to get a single resume
export const getResume = async (id: string): Promise<Resume | null> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/resumes/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[getResume] Failed to fetch resume:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data?.resume) {
      console.log('[getResume] Fetched resume:', result.data.resume.id);
      return result.data.resume;
    }
    
    return null;
  } catch (error) {
    console.error('[getResume] Error:', error);
    return null;
  }
};

export const useResumes = (page = 1, limit = 10, enabled = true) => {
  const { data, error, mutate, isLoading } = useSWR<ResumesResponse>(
    enabled ? `/api/resumes?page=${page}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Reduced to 2 seconds for faster updates
      onSuccess: (data) => {
        console.log('[useResumes] SWR onSuccess:', data);
      },
      onError: (error) => {
        console.error('[useResumes] SWR onError:', error);
      },
    }
  );

  // Create a new resume
  const createResume = useCallback(
    async (title: string, templateId: string, content: any, customization?: any) => {
      try {
        const token = localStorage.getItem('token');
        
        // **TESTING MODE: Save to localStorage**
        if (token === 'test-token-bypass') {
          const mockResumes = JSON.parse(localStorage.getItem('mock-resumes') || '[]');
          const newResume = {
            id: `resume-${Date.now()}`,
            userId: 'test-user-123',
            title,
            templateId,
            customization,
            content,
            atsScore: Math.floor(Math.random() * 30) + 70, // Random 70-100
            isPublic: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          mockResumes.push(newResume);
          localStorage.setItem('mock-resumes', JSON.stringify(mockResumes));
          await mutate();
          return { success: true, data: newResume, error: null };
        }
        
        const response = await fetch('/api/resumes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            templateId,
            customization,
            personalInfo: {
              fullName: (content.personalInfo as any)?.name || '',
              email: (content.personalInfo as any)?.email || '',
              phone: (content.personalInfo as any)?.phone || '',
              location: (content.personalInfo as any)?.location || '',
              linkedin: (content.personalInfo as any)?.linkedin || '',
              website: (content.personalInfo as any)?.portfolio || '',
              github: (content.personalInfo as any)?.github || '',
            },
            summary: content.summary || '',
            experience: ((content.experience || []) as any[]).map(exp => ({
              company: exp.company || '',
              position: exp.jobTitle || exp.position || '',
              location: exp.location || '',
              startDate: exp.startDate || '',
              endDate: exp.endDate || '',
              current: exp.current || false,
              bullets: exp.bullets || [],
            })),
            education: ((content.education || []) as any[]).map(edu => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              field: edu.field || '',
              location: edu.location || '',
              startDate: edu.startDate || '',
              endDate: edu.graduationDate || edu.endDate || '',
              gpa: edu.gpa || '',
            })),
            skills: ((content.skills || []) as any[]).map(skill => {
              // Handle both flat structure (just name) and grouped structure (category + items)
              if (typeof skill === 'string') {
                return { category: 'General', items: [skill] };
              }
              if (skill.category && Array.isArray(skill.items)) {
                return { category: skill.category, items: skill.items };
              }
              return { category: skill.category || 'General', items: [skill.name || ''] };
            }),
            certifications: ((content.certifications || []) as any[]).map(cert => ({
              name: cert.name || '',
              issuer: cert.issuer || '',
              date: cert.date || '',
              expiryDate: cert.expiryDate || '',
              credentialId: cert.credentialId || cert.url || '',
            })),
            projects: ((content.projects || []) as any[]).map(proj => ({
              name: proj.name || '',
              description: proj.description || '',
              technologies: proj.techStack || proj.technologies || [],
              url: proj.url || '',
              startDate: proj.startDate || '',
              endDate: proj.endDate || '',
            })),
            awards: ((content as any).awards || []).map((award: any) => ({
              title: award.title || award.name || '',
              issuer: award.issuer || '',
              date: award.date || '',
              description: award.description || '',
            })),
            languages: ((content.languages || []) as any[]).map((lang: any) => ({
              name: lang.name || lang.language || '',
              proficiency: lang.proficiency || lang.level || '',
            })),
            customSections: (content as any).customSections || [],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Log validation errors for debugging
          if (data.error?.details) {
            console.error('Validation errors:', data.error.details);
          }
          throw new Error(data.error?.message || data.message || 'Failed to create resume');
        }

        // Revalidate the list immediately
        await mutate();
        
        return { 
          success: true, 
          data: data.data?.resume || data.resume || data.data, 
          error: null 
        };
      } catch (error: any) {
        console.error('Create resume error:', error);
        return { success: false, data: null, error: error.message };
      }
    },
    [mutate]
  );

  // Update a resume
  const updateResume = useCallback(
    async (id: string, updates: Partial<Resume>) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/resumes/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update resume');
        }

        // Revalidate the list
        await mutate();
        return { success: true, data: data.resume, error: null };
      } catch (error: any) {
        return { success: false, data: null, error: error.message };
      }
    },
    [mutate]
  );

  // Delete a resume
  const deleteResume = useCallback(
    async (id: string) => {
      try {
        const token = localStorage.getItem('token');
        
        // **TESTING MODE: Delete from localStorage**
        if (token === 'test-token-bypass') {
          const mockResumes = JSON.parse(localStorage.getItem('mock-resumes') || '[]');
          const filtered = mockResumes.filter((r: Resume) => r.id !== id);
          localStorage.setItem('mock-resumes', JSON.stringify(filtered));
          await mutate();
          return { success: true, error: null };
        }
        const response = await fetch(`/api/resumes/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete resume');
        }

        // Revalidate the list
        await mutate();
        return { success: true, error: null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    [mutate]
  );

  // Duplicate a resume
  const duplicateResume = useCallback(
    async (id: string) => {
      try {
        const token = localStorage.getItem('token');
        
        // First, get the resume
        const getResponse = await fetch(`/api/resumes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!getResponse.ok) {
          throw new Error('Failed to fetch resume');
        }

        const { resume } = await getResponse.json();

        // Create a copy with modified title
        const result = await createResume(
          `${resume.title} (Copy)`,
          resume.templateId,
          resume.content
        );

        return result;
      } catch (error: any) {
        return { success: false, data: null, error: error.message };
      }
    },
    [createResume]
  );

  // Debug: Log what we're returning (DISABLED to reduce console noise)
  // if (!isLoading && data) {
  //   console.log('[useResumes] Returning data:', {
  //     resumesCount: data?.resumes?.length,
  //     resumes: data?.resumes,
  //     total: data?.total,
  //     page: data?.page,
  //   });
  // }

  return {
    resumes: data?.resumes || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    createResume,
    updateResume,
    deleteResume,
    duplicateResume,
    refresh: mutate,
  };
};

// Hook for single resume
export const useResume = (id: string | null) => {
  const { data, error, mutate, isLoading } = useSWR<{ resume: Resume }>(
    id ? `/api/resumes/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    resume: data?.resume || null,
    isLoading,
    error,
    refresh: mutate,
  };
};
