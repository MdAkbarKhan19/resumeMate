'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Alert';

interface AIFeaturesPanelProps {
  resumeData: any;
  onApplySuggestion: (field: string, value: any) => void;
  resumeId?: string;
}

export default function AIFeaturesPanel({ resumeData, onApplySuggestion, resumeId }: AIFeaturesPanelProps) {
  const [activeTab, setActiveTab] = useState<'improve' | 'ats' | 'skills'>('improve');
  const [loading, setLoading] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<any>(null);

  const handleATSCheck = async () => {
    if (!jobDescription.trim() || !resumeId) {
      toast.error('Please paste a job description and save your resume first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ats/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, jobDescription }),
      });
      
      if (!response.ok) throw new Error('ATS check failed');
      
      const result = await response.json();
      setAtsAnalysis(result);
    } catch (error) {
      console.error('ATS check failed:', error);
      toast.error('Failed to analyze ATS score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSuggestions = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description first');
      return;
    }

    setLoading(true);
    try {
      const currentSkills = resumeData.skills?.map((s: any) => s.name) || [];
      const response = await fetch('/api/ai/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSkills, jobDescription }),
      });
      
      if (!response.ok) throw new Error('Skill suggestion failed');
      
      const result = await response.json();
      setSkillSuggestions(result);
    } catch (error) {
      console.error('Skill suggestion failed:', error);
      toast.error('Failed to get skill suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addSkillToResume = (skillName: string) => {
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: skillName,
      category: 'technical' as const,
    };
    const updatedSkills = [...(resumeData.skills || []), newSkill];
    onApplySuggestion('skills', updatedSkills);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">✨</span>
        <h3 className="text-lg font-semibold">AI Assistant</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('improve')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'improve'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📄 Quick Tips
        </button>
        <button
          onClick={() => setActiveTab('ats')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'ats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 ATS Score
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'skills'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ✅ Skills
        </button>
      </div>

      {/* Quick Tips Tab */}
      {activeTab === 'improve' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Use the ✨ button next to bullet points for AI improvement</li>
              <li>• Start bullets with strong action verbs (Led, Developed, Implemented)</li>
              <li>• Include quantifiable results (increased by 40%, saved $200K)</li>
              <li>• Keep bullet points concise (1-2 lines each)</li>
              <li>• Use the AI Generate button for professional summaries</li>
            </ul>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">✅ Quick Stats</h4>
            <div className="space-y-2 text-sm text-amber-800">
              <div className="flex justify-between">
                <span>Summary:</span>
                <span className="font-medium">
                  {resumeData.summary ? '✓ Added' : '⚠️ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Experience:</span>
                <span className="font-medium">{resumeData.experience?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span>Skills:</span>
                <span className="font-medium">{resumeData.skills?.length || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span>Education:</span>
                <span className="font-medium">{resumeData.education?.length || 0} items</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATS Score Tab */}
      {activeTab === 'ats' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to check ATS compatibility..."
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button
            onClick={handleATSCheck}
            isLoading={loading}
            disabled={!jobDescription.trim() || !resumeId}
            className="w-full"
          >
            📊 {loading ? 'Analyzing...' : 'Check ATS Score'}
          </Button>

          {!resumeId && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Please save your resume first to use ATS checker
            </p>
          )}

          {atsAnalysis && (
            <div className="space-y-4 mt-4">
              {/* Score */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">ATS Score</span>
                  <span
                    className={`text-3xl font-bold ${
                      atsAnalysis.score >= 80
                        ? 'text-amber-600'
                        : atsAnalysis.score >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {atsAnalysis.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      atsAnalysis.score >= 80
                        ? 'bg-amber-600'
                        : atsAnalysis.score >= 60
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${atsAnalysis.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="p-4 bg-white border rounded-lg">
                <h4 className="font-semibold mb-3">Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Keywords Matched</span>
                    <span className="font-medium">
                      {atsAnalysis.breakdown.keywords.matched} / {atsAnalysis.breakdown.keywords.total}{' '}
                      ({atsAnalysis.breakdown.keywords.percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skills Matched</span>
                    <span className="font-medium">
                      {atsAnalysis.breakdown.skills.matched} / {atsAnalysis.breakdown.skills.total}{' '}
                      ({atsAnalysis.breakdown.skills.percentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {atsAnalysis.recommendations.length > 0 && (
                <div className="p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {atsAnalysis.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        {rec.type === 'critical' && (
                          <span className="text-red-500 flex-shrink-0 mt-0.5 font-bold">⚠️</span>
                        )}
                        {rec.type === 'important' && (
                          <span className="text-yellow-500 flex-shrink-0 mt-0.5 font-bold">⚠️</span>
                        )}
                        {rec.type === 'suggested' && (
                          <span className="text-blue-500 flex-shrink-0 mt-0.5 font-bold">✓</span>
                        )}
                        <div className="text-sm">
                          <p className="font-medium">{rec.message}</p>
                          <p className="text-gray-600">{rec.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords */}
              {atsAnalysis.missingKeywords.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-yellow-900">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {atsAnalysis.missingKeywords.slice(0, 10).map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white border border-yellow-300 rounded text-sm text-yellow-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills Suggestion Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get skill suggestions..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button
            onClick={handleSkillSuggestions}
            isLoading={loading}
            disabled={!jobDescription.trim()}
            className="w-full"
          >
            ✨ {loading ? 'Analyzing...' : 'Get Skill Suggestions'}
          </Button>

          {skillSuggestions && (
            <div className="space-y-4 mt-4">
              {/* Recommended Skills */}
              {skillSuggestions.recommended.length > 0 && (
                <div className="p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold mb-3">Recommended Skills</h4>
                  <div className="space-y-3">
                    {skillSuggestions.recommended.map((skill: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg flex justify-between items-start gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{skill.skill}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                skill.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : skill.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {skill.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{skill.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addSkillToResume(skill.skill)}
                        >
                          + Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Critical Skills */}
              {skillSuggestions.missing.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-900">Missing Critical Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillSuggestions.missing.map((skill: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => addSkillToResume(skill)}
                        className="px-3 py-1 bg-white border border-red-300 rounded text-sm text-red-800 hover:bg-red-100 transition-colors"
                      >
                        {skill} +
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
