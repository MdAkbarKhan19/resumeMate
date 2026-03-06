/**
 * Skills Section Component
 * Features: Bulk paste (comma-separated), auto-categorization, tag display, AI suggest
 */
'use client';

import React, { useState, useCallback } from 'react';
import { Button, Input } from '@/components/ui';
import { Skill } from '@/types/resume';
import { generateId } from '@/lib/utils';

interface SkillsSectionProps {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  isProcessing?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  technical: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  soft: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  language: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  tools: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export default function SkillsSection({ skills, onSkillsChange, isProcessing }: SkillsSectionProps) {
  const [bulkInput, setBulkInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('technical');
  const [singleInput, setSingleInput] = useState('');

  const addSkillsFromBulk = useCallback(() => {
    if (!bulkInput.trim()) return;

    const newSkillNames = bulkInput
      .split(/[,;\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !skills.some(existing => existing.name.toLowerCase() === s.toLowerCase()));

    if (newSkillNames.length === 0) {
      setBulkInput('');
      return;
    }

    const newSkills: Skill[] = newSkillNames.map(name => ({
      id: generateId(),
      name,
      category: selectedCategory as 'technical' | 'soft' | 'language',
    }));

    onSkillsChange([...skills, ...newSkills]);
    setBulkInput('');
  }, [bulkInput, selectedCategory, skills, onSkillsChange]);

  const addSingleSkill = useCallback(() => {
    const name = singleInput.trim();
    if (!name) return;
    if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSingleInput('');
      return;
    }

    onSkillsChange([...skills, {
      id: generateId(),
      name,
      category: selectedCategory as 'technical' | 'soft' | 'language',
    }]);
    setSingleInput('');
  }, [singleInput, selectedCategory, skills, onSkillsChange]);

  const removeSkill = useCallback((id: string) => {
    onSkillsChange(skills.filter(s => s.id !== id));
  }, [skills, onSkillsChange]);

  const changeCategory = useCallback((id: string, newCategory: string) => {
    onSkillsChange(skills.map(s => s.id === id ? { ...s, category: newCategory as any } : s));
  }, [skills, onSkillsChange]);

  const getSkillsByCategory = (category: string) => skills.filter(s => s.category === category);

  const categories = ['technical', 'soft', 'language', 'tools'];
  const categoryLabels: Record<string, string> = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    language: 'Languages',
    tools: 'Tools & Platforms',
  };

  return (
    <div className="space-y-5">
      {/* Bulk Entry Area */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Quick Add Skills</h4>
          <span className="text-xs text-gray-500">(paste comma-separated or one per line)</span>
        </div>

        <div className="flex gap-2 mb-3">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selectedCategory === cat
                  ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} ${CATEGORY_COLORS[cat].border} border-2`
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addSkillsFromBulk();
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="React, Node.js, Python, TypeScript, AWS, Docker, Kubernetes..."
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={addSkillsFromBulk}
            disabled={!bulkInput.trim()}
            className="self-end"
          >
            Add All
          </Button>
        </div>

        {/* Single skill add (alternative) */}
        <div className="flex gap-2 mt-2">
          <Input
            value={singleInput}
            onChange={(e) => setSingleInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSingleSkill();
              }
            }}
            placeholder="Or type a single skill and press Enter"
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSingleSkill}
            disabled={!singleInput.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Display Skills by Category */}
      {categories.map(category => {
        const categorySkills = getSkillsByCategory(category);
        if (categorySkills.length === 0) return null;

        const colors = CATEGORY_COLORS[category];
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-700">{categoryLabels[category]}</h4>
              <span className="text-xs text-gray-400">({categorySkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map(skill => (
                <span
                  key={skill.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border} group`}
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    className="opacity-60 hover:opacity-100 font-bold text-current"
                    title="Remove skill"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {skills.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No skills added yet.</p>
          <p className="text-xs mt-1">Paste your skills above to get started quickly.</p>
        </div>
      )}

      {/* Skills count summary */}
      {skills.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {skills.length} skill{skills.length !== 1 ? 's' : ''} total
          </span>
          <button
            type="button"
            onClick={() => onSkillsChange([])}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
