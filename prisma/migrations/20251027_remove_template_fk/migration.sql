-- AlterTable: Make templateId just a string field without foreign key constraint
-- This allows us to use string template IDs like 'modern-two-column' without database templates

-- Drop the foreign key constraint
ALTER TABLE "Resume" DROP CONSTRAINT IF EXISTS "Resume_templateId_fkey";

-- Update existing resumes to use string template IDs
UPDATE "Resume" 
SET "templateId" = 'modern-two-column' 
WHERE "templateId" IS NOT NULL;
