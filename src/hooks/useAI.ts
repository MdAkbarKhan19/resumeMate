'use client';

import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/Alert';

interface AIUsageStats {
  bulletEnhancements: number;
  grammarChecks: number;
  summaryGenerations: number;
  jdMatches: number;
  dailyLimit: number;
  resetTime: string;
}

export const useAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);

  // Enhance bullet point
  const enhanceBullet = useCallback(async (text: string, context?: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bullet: text, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Enhancement failed');
      }

      return {
        success: true,
        enhanced: data.data?.enhanced || data.enhanced,
        original: text,
        error: null,
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to enhance text');
      return { success: false, enhanced: null, original: text, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Check grammar
  const checkGrammar = useCallback(async (text: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Grammar check failed');
      }

      return {
        success: true,
        corrections: data.corrections,
        correctedText: data.correctedText,
        error: null,
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to check grammar');
      return { success: false, corrections: [], correctedText: text, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Generate professional summary
  const generateSummary = useCallback(
    async (experience: string, skills: string[], targetRole?: string) => {
      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ai/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            yearsOfExperience: experience,
            skills,
            targetRole,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || data.message || 'Summary generation failed');
        }

        return {
          success: true,
          summary: data.data?.summary || data.summary,
          error: null,
        };
      } catch (error: any) {
        toast.error(error.message || 'Failed to generate summary');
        return { success: false, summary: null, error: error.message };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Match resume with job description
  const matchJobDescription = useCallback(
    async (resumeContent: string, jobDescription: string) => {
      setIsProcessing(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ai/match-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ resumeContent, jobDescription }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Job matching failed');
        }

        return {
          success: true,
          score: data.score,
          matchingKeywords: data.matchingKeywords,
          missingKeywords: data.missingKeywords,
          suggestions: data.suggestions,
          error: null,
        };
      } catch (error: any) {
        toast.error(error.message || 'Failed to match job description');
        return {
          success: false,
          score: 0,
          matchingKeywords: [],
          missingKeywords: [],
          suggestions: [],
          error: error.message,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Detect redundancy in content
  const detectRedundancy = useCallback(async (bullets: string[]) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'redundancy', bullets }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Redundancy check failed');
      }

      return {
        success: true,
        redundantPairs: data.redundantPairs,
        suggestions: data.suggestions,
        error: null,
      };
    } catch (error: any) {
      return {
        success: false,
        redundantPairs: [],
        suggestions: [],
        error: error.message,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get AI usage statistics
  const getUsageStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/usage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsageStats(data.usage);
        return { success: true, usage: data.usage };
      }

      return { success: false, usage: null };
    } catch (error) {
      return { success: false, usage: null };
    }
  }, []);

  // Check if user can use AI features
  const canUseAI = useCallback(() => {
    if (!usageStats) return true; // Optimistically allow until we know limits
    
    const totalUsage =
      usageStats.bulletEnhancements +
      usageStats.grammarChecks +
      usageStats.summaryGenerations +
      usageStats.jdMatches;

    return totalUsage < usageStats.dailyLimit;
  }, [usageStats]);

  return {
    isProcessing,
    usageStats,
    enhanceBullet,
    checkGrammar,
    generateSummary,
    matchJobDescription,
    detectRedundancy,
    getUsageStats,
    canUseAI,
  };
};
