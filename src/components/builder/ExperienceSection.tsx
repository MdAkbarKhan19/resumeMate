/**
 * Experience Section Component
 * Features: Inline editing, AI bullet enhancement, bulk add bullets
 */
'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { Experience } from '@/types/resume';
import { generateId } from '@/lib/utils';

interface ExperienceSectionProps {
  experiences: Experience[];
  onExperiencesChange: (experiences: Experience[]) => void;
  onEnhanceBullet: (expIndex: number, bulletIndex: number) => void;
  isProcessing?: boolean;
}

export default function ExperienceSection({
  experiences,
  onExperiencesChange,
  onEnhanceBullet,
  isProcessing,
}: ExperienceSectionProps) {
  const [expandedExp, setExpandedExp] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedExp(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addExperience = useCallback(() => {
    const newExp: Experience = {
      id: generateId(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
    };
    onExperiencesChange([...experiences, newExp]);
    // Auto-expand the new experience
    setExpandedExp(prev => new Set([...prev, newExp.id]));
  }, [experiences, onExperiencesChange]);

  const updateExperience = useCallback((id: string, field: string, value: any) => {
    onExperiencesChange(
      experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    );
  }, [experiences, onExperiencesChange]);

  const removeExperience = useCallback((id: string) => {
    onExperiencesChange(experiences.filter(exp => exp.id !== id));
  }, [experiences, onExperiencesChange]);

  const addBullet = useCallback((expId: string) => {
    onExperiencesChange(
      experiences.map(exp =>
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      )
    );
  }, [experiences, onExperiencesChange]);

  const updateBullet = useCallback((expId: string, bulletIndex: number, value: string) => {
    onExperiencesChange(
      experiences.map(exp => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIndex] = value;
        return { ...exp, bullets: newBullets };
      })
    );
  }, [experiences, onExperiencesChange]);

  const removeBullet = useCallback((expId: string, bulletIndex: number) => {
    onExperiencesChange(
      experiences.map(exp => {
        if (exp.id !== expId) return exp;
        return { ...exp, bullets: exp.bullets.filter((_, i) => i !== bulletIndex) };
      })
    );
  }, [experiences, onExperiencesChange]);

  const enhanceAllBullets = useCallback(async (expIndex: number) => {
    const exp = experiences[expIndex];
    for (let i = 0; i < exp.bullets.length; i++) {
      if (exp.bullets[i].trim()) {
        await onEnhanceBullet(expIndex, i);
      }
    }
  }, [experiences, onEnhanceBullet]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {experiences.length === 0
            ? 'Add your work experience'
            : `${experiences.length} position${experiences.length !== 1 ? 's' : ''} added`}
        </p>
        <Button type="button" variant="primary" size="sm" onClick={addExperience}>
          + Add Position
        </Button>
      </div>

      {experiences.map((exp, index) => {
        const isExpanded = expandedExp.has(exp.id) || (!exp.jobTitle && !exp.company);
        const hasContent = exp.jobTitle || exp.company;

        return (
          <Card key={exp.id} padding="none" className="border border-gray-200 overflow-hidden">
            {/* Compact header - always visible */}
            <button
              type="button"
              onClick={() => toggleExpanded(exp.id)}
              className="w-full px-3 sm:px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {hasContent ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">{exp.jobTitle || 'Untitled Position'}</span>
                      {exp.current && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Current</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {exp.company}{exp.location ? ` - ${exp.location}` : ''}
                      {exp.startDate ? ` | ${exp.startDate}` : ''}
                      {exp.endDate ? ` - ${exp.endDate}` : exp.current ? ' - Present' : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{exp.bullets.filter(b => b.trim()).length} bullet points</p>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">New position - click to edit</span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expandable form */}
            {isExpanded && (
              <div className="px-3 sm:px-4 pb-4 pt-4 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Job Title"
                    value={exp.jobTitle}
                    onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                    placeholder="Software Engineer"
                  />
                  <Input
                    label="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="Google"
                  />
                  <Input
                    label="Location"
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                  <div className="flex gap-2 items-end">
                    <Input
                      label="Start"
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      label="End"
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                      disabled={exp.current}
                      className="flex-1"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">I currently work here</span>
                </label>

                {/* Bullet Points */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Achievements & Responsibilities</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => enhanceAllBullets(index)}
                      isLoading={isProcessing}
                      className="text-xs"
                    >
                      AI Enhance All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {exp.bullets.map((bullet, bIndex) => (
                      <div key={bIndex} className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                          <span className="text-xs font-medium text-gray-500 select-none">&#8226; Bullet {bIndex + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEnhanceBullet(index, bIndex)}
                              disabled={isProcessing || !bullet.trim()}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
                              title="AI Enhance this bullet"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBullet(exp.id, bIndex)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove bullet"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                        <Textarea
                          value={bullet}
                          onChange={(e) => updateBullet(exp.id, bIndex, e.target.value)}
                          rows={4}
                          placeholder="Led development of a microservices architecture, reducing deployment time by 40%..."
                          className="text-base leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addBullet(exp.id)}
                    className="mt-2 text-xs"
                  >
                    + Add Bullet Point
                  </Button>
                </div>

                {/* Remove Experience */}
                <div className="flex justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(exp.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    Remove Position
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {experiences.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-sm">No work experience added yet.</p>
          <p className="text-xs mt-1">Click "Add Position" to get started.</p>
        </div>
      )}
    </div>
  );
}
