'use client';

import { TemplateCustomization, DEFAULT_CUSTOMIZATION } from '@/types/template';
import { useState } from 'react';
import { Card } from '@/components/ui';

interface CustomizationPanelProps {
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
}

const COLOR_PRESETS = [
  { name: 'Professional Blue', primary: '#3B82F6', accent: '#60A5FA' },
  { name: 'Creative Purple', primary: '#8B5CF6', accent: '#A78BFA' },
  { name: 'Modern Green', primary: '#10B981', accent: '#34D399' },
  { name: 'Corporate Navy', primary: '#1E40AF', accent: '#3B82F6' },
  { name: 'Elegant Gray', primary: '#4B5563', accent: '#6B7280' },
  { name: 'Vibrant Orange', primary: '#F97316', accent: '#FB923C' },
  { name: 'Calm Teal', primary: '#14B8A6', accent: '#2DD4BF' },
  { name: 'Bold Red', primary: '#EF4444', accent: '#F87171' },
];

const FONTS = [
  { value: 'Inter', label: 'Inter (Modern)' },
  { value: 'Roboto', label: 'Roboto (Clean)' },
  { value: 'Georgia', label: 'Georgia (Classic)' },
  { value: 'Arial', label: 'Arial (Traditional)' },
];

export default function CustomizationPanel({ customization, onChange }: CustomizationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    onChange({
      ...customization,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  const handleCustomColor = (type: 'primary' | 'accent', color: string) => {
    onChange({
      ...customization,
      [type === 'primary' ? 'primaryColor' : 'accentColor']: color,
    });
  };

  const handleFontChange = (font: any) => {
    onChange({
      ...customization,
      fontFamily: font,
    });
  };

  const handleSpacingChange = (spacing: 'compact' | 'normal' | 'spacious') => {
    onChange({
      ...customization,
      spacing,
    });
  };

  const handleFontSizeChange = (size: number) => {
    onChange({
      ...customization,
      fontSize: size,
    });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_CUSTOMIZATION);
  };

  return (
    <Card className="p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Customize Template</h3>
          <button
            onClick={resetToDefaults}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Color Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleColorPreset(preset)}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  customization.primaryColor === preset.primary
                    ? 'border-primary-600 bg-primary-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <span className="text-xs text-gray-700">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        {showAdvanced && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Custom Colors
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24">Primary:</label>
                <input
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) => handleCustomColor('primary', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customization.primaryColor}
                  onChange={(e) => handleCustomColor('primary', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="#3B82F6"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-24">Accent:</label>
                <input
                  type="color"
                  value={customization.accentColor}
                  onChange={(e) => handleCustomColor('accent', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={customization.accentColor}
                  onChange={(e) => handleCustomColor('accent', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="#60A5FA"
                />
              </div>
            </div>
          </div>
        )}

        {/* Font Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Font Family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((font) => (
              <button
                key={font.value}
                onClick={() => handleFontChange(font.value)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  customization.fontFamily === font.value
                    ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Spacing
          </label>
          <div className="flex gap-2">
            {(['compact', 'normal', 'spacious'] as const).map((spacing) => (
              <button
                key={spacing}
                onClick={() => handleSpacingChange(spacing)}
                className={`flex-1 p-2 rounded-lg border text-sm capitalize transition-all ${
                  customization.spacing === spacing
                    ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {spacing}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        {showAdvanced && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Font Size: {customization.fontSize}pt
            </label>
            <input
              type="range"
              min="9"
              max="14"
              step="0.5"
              value={customization.fontSize}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>9pt</span>
              <span>14pt</span>
            </div>
          </div>
        )}

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {showAdvanced ? '← Hide Advanced Options' : 'Advanced Options →'}
        </button>
      </div>
    </Card>
  );
}
