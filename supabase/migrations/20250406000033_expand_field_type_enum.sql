-- Add new values to form_field_type enum
ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'repeating_group';
ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS 'table';
