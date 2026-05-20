'use client';

import { TEMPLATE_REGISTRY } from '@/types/template';
import { Card } from '@/components/ui';

interface TemplateGalleryProps {
  selectedTemplateId?: string;
  onTemplateSelect: (templateId: string) => void;
}

export default function TemplateGallery({
  selectedTemplateId,
  onTemplateSelect,
}: TemplateGalleryProps) {
  // Only two templates supported — show them both, no filter needed.
  const allTemplates = Object.values(TEMPLATE_REGISTRY);

  return (
    <div className="template-gallery">
      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {allTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplateId === template.id 
                ? 'ring-2 ring-primary-600 shadow-lg' 
                : ''
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            {/* Template Thumbnail */}
            <div className="aspect-[8.5/11] bg-gray-100 rounded-t-lg overflow-hidden">
              {template.thumbnail ? (
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Template Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                {selectedTemplateId === template.id && (
                  <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              
              {/* Template Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  template.colorful 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {template.colorful ? 'Colorful' : 'Classic'}
                </span>
                
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                  {template.columns === 1 ? 'Single Column' : 'Two Column'}
                </span>
                
                {template.atsCompliant && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    ATS-Friendly
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
