import { ResumeData } from '@/types/resume';
import { TemplateCustomization } from '@/types/template';
import { getTemplateComponent } from './index';

interface TemplateRendererProps {
  templateId: string;
  data: ResumeData;
  customization?: TemplateCustomization;
  preview?: boolean;
}

export default function TemplateRenderer({ 
  templateId, 
  data, 
  customization,
  preview = true 
}: TemplateRendererProps) {
  const TemplateComponent = getTemplateComponent(templateId);
  
  return (
    <TemplateComponent 
      data={data} 
      customization={customization}
      preview={preview}
    />
  );
}
