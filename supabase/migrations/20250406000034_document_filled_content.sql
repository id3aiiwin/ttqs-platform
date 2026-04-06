-- Add filled_content column to company_documents for storing company-specific template data
ALTER TABLE company_documents ADD COLUMN IF NOT EXISTS filled_content jsonb DEFAULT '{}';
