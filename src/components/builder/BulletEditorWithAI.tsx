'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { toast } from '@/components/ui/Alert';

interface BulletEditorWithAIProps {
  value: string;
  onChange: (value: string) => void;
  context?: {
    jobTitle?: string;
    company?: string;
  };
}

export default function BulletEditorWithAI({ value, onChange, context }: BulletEditorWithAIProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const handleImprove = async () => {
    if (!value.trim()) {
      toast.error('Please enter some text first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/improve-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulletText: value,
          context: context || {},
        }),
      });

      if (!response.ok) throw new Error('Failed to improve bullet');

      const result = await response.json();
      setSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Bullet improvement failed:', error);
      toast.error('Failed to improve bullet point. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (text: string) => {
    onChange(text);
    setShowSuggestions(false);
    setSuggestions(null);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Describe your achievement or responsibility..."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleImprove}
          isLoading={loading}
          className="h-fit"
          title="Improve with AI"
        >
          ✨
        </Button>
      </div>

      {/* Suggestions Modal */}
      {showSuggestions && suggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  AI-Improved Suggestions
                </h3>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              {/* Original */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Original:</p>
                <p className="text-gray-800">{suggestions.original}</p>
              </div>

              {/* Main Improved Version */}
              <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-amber-800">✨ Recommended:</p>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestions.improved)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    ✓ Use This
                  </Button>
                </div>
                <p className="text-gray-800">{suggestions.improved}</p>
              </div>

              {/* Alternative Suggestions */}
              {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Alternative Versions:</p>
                  {suggestions.suggestions.map((alt: string, idx: number) => (
                    <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-gray-800 flex-1">{alt}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestion(alt)}
                          className="flex-shrink-0"
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Keep Original */}
              <div className="mt-4 pt-4 border-t flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowSuggestions(false)}
                >
                  Keep Original
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
