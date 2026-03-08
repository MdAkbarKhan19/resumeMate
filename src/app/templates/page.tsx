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
    <div className="min-h-screen bg-[#fafafc]">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-50/50 to-transparent py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Resume Templates
            </h1>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              Choose from our collection of ATS-friendly, professionally designed templates.
              All templates are customizable and optimized for applicant tracking systems.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full px-5 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-gray-600 rounded-full px-5 py-2 text-sm font-medium border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all'
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
                className="w-4 h-4 text-indigo-600 border-gray-300 bg-white rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-600">Premium Only</span>
              <StarIcon className="w-5 h-5 text-amber-400" />
            </label>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              {/* Template Preview */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6 group-hover:from-indigo-50/50 transition-colors overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <DocumentTextIcon className="w-24 h-24 text-indigo-200" />
                  <span className="absolute bottom-4 right-4 text-gray-500 text-sm font-medium bg-white/80 px-3 py-1 rounded-full border border-gray-100">
                    Preview Coming Soon
                  </span>
                </div>

                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <StarIcon className="w-3 h-3" />
                    <span>PREMIUM</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link
                    href={`/builder?template=${template.id}`}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    Use This Template
                  </Link>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900 font-semibold text-lg">{template.name}</h3>
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-lg">
                    {template.category}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-4">{template.description}</p>

                <div className="flex items-center justify-between text-sm">
                  {/* Rating */}
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-gray-900">{template.rating}</span>
                  </div>

                  {/* Usage Count */}
                  <span className="text-gray-400">
                    {template.usageCount.toLocaleString()} uses
                  </span>
                </div>

                {/* CTA Button */}
                <Link
                  href={`/builder?template=${template.id}`}
                  className="mt-4 w-full block text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl font-semibold hover:brightness-110 transition-all shadow-md shadow-indigo-500/20"
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
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build Your Resume?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
              Choose a template and create a professional resume in minutes with AI-powered suggestions.
            </p>
            <Link
              href="/builder"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Start Building Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
