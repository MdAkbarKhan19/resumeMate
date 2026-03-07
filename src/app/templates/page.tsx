'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DocumentTextIcon, StarIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  isPremium: boolean;
  rating: number;
  usageCount: number;
}

const templates: Template[] = [
  {
    id: 'modern-ats',
    name: 'Modern ATS',
    description: 'Clean, ATS-friendly template optimized for applicant tracking systems',
    category: 'MODERN',
    thumbnail: '/templates/modern-ats.png',
    isPremium: false,
    rating: 4.8,
    usageCount: 12500
  },
  {
    id: 'minimalist-classic',
    name: 'Minimalist Classic',
    description: 'Elegant minimalist design with classic typography',
    category: 'MINIMALIST',
    thumbnail: '/templates/minimalist-classic.png',
    isPremium: false,
    rating: 4.7,
    usageCount: 8300
  },
  {
    id: 'creative-modern',
    name: 'Creative Modern',
    description: 'Stand out with this modern creative template',
    category: 'CREATIVE',
    thumbnail: '/templates/creative-modern.png',
    isPremium: true,
    rating: 4.9,
    usageCount: 5600
  },
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Perfect for senior roles and executive positions',
    category: 'PROFESSIONAL',
    thumbnail: '/templates/executive-pro.png',
    isPremium: true,
    rating: 4.8,
    usageCount: 4200
  },
  {
    id: 'hybrid-flexible',
    name: 'Hybrid Flexible',
    description: 'Versatile template suitable for any industry',
    category: 'HYBRID',
    thumbnail: '/templates/hybrid-flex.png',
    isPremium: true,
    rating: 4.6,
    usageCount: 3800
  },
  {
    id: 'tech-focused',
    name: 'Tech Focused',
    description: 'Optimized for software engineers and tech roles',
    category: 'MODERN',
    thumbnail: '/templates/tech-focused.png',
    isPremium: false,
    rating: 4.9,
    usageCount: 9200
  }
];

const categories = ['ALL', 'MODERN', 'MINIMALIST', 'PROFESSIONAL', 'CREATIVE', 'HYBRID'];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = selectedCategory === 'ALL' || template.category === selectedCategory;
    const premiumMatch = !showPremiumOnly || template.isPremium;
    return categoryMatch && premiumMatch;
  });

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="bg-white/[0.02] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Professional Resume Templates
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Choose from our collection of ATS-friendly, professionally designed templates.
              All templates are customizable and optimized for applicant tracking systems.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-xl border border-white/[0.06] p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                      : 'bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Premium Filter */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPremiumOnly}
                onChange={(e) => setShowPremiumOnly(e.target.checked)}
                className="w-4 h-4 text-cyan-500 border-white/20 bg-white/[0.04] rounded focus:ring-cyan-500"
              />
              <span className="text-sm font-medium text-slate-400">Premium Only</span>
              <StarIcon className="w-5 h-5 text-amber-400" />
            </label>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-cyan-500/20 hover:shadow-glow-cyan transition-all duration-300 overflow-hidden group"
            >
              {/* Template Preview */}
              <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-600/60 to-violet-600/60">
                  <DocumentTextIcon className="w-24 h-24 text-white/30" />
                  <span className="absolute bottom-4 right-4 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                    Preview Coming Soon
                  </span>
                </div>

                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute top-4 right-4 bg-amber-400/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                    <StarIcon className="w-3 h-3" />
                    <span>PREMIUM</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    href={`/builder?template=${template.id}`}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition-all"
                  >
                    Use This Template
                  </Link>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{template.name}</h3>
                  <span className="px-2 py-1 bg-white/[0.06] text-slate-400 text-xs font-medium rounded">
                    {template.category}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mb-4">{template.description}</p>

                <div className="flex items-center justify-between text-sm">
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-white">{template.rating}</span>
                  </div>

                  {/* Usage Count */}
                  <span className="text-slate-500">
                    {template.usageCount.toLocaleString()} uses
                  </span>
                </div>

                {/* CTA Button */}
                <Link
                  href={`/builder?template=${template.id}`}
                  className="mt-4 w-full block text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:brightness-110 transition-all"
                >
                  Start Creating
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
            <p className="text-slate-400">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cyan-600/80 to-violet-600/80 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build Your Resume?
            </h2>
            <p className="text-cyan-100/80 text-lg mb-8 max-w-2xl mx-auto">
              Choose a template and create a professional resume in minutes with AI-powered suggestions.
            </p>
            <Link
              href="/builder"
              className="inline-block bg-white text-cyan-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Building Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
