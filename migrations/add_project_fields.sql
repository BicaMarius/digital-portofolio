-- Migration script to add new columns to projects table
-- Run this manually if drizzle-kit push would delete data

-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_worked INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS frontend_tech TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS backend_tech TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_release_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_updated_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS additional_files TEXT[] DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_url TEXT;

-- Update existing projects with default values if needed
UPDATE projects SET images = '{}' WHERE images IS NULL;
UPDATE projects SET frontend_tech = '{}' WHERE frontend_tech IS NULL;
UPDATE projects SET backend_tech = '{}' WHERE backend_tech IS NULL;
UPDATE projects SET additional_files = '{}' WHERE additional_files IS NULL;

-- Comment: This migration adds enhanced project fields for:
-- - Project type (application, website, platform, game, etc.)
-- - Project icon/emoji
-- - Image gallery for project screenshots
-- - Hours worked tracking
-- - Frontend and backend technology stacks
-- - Release and update dates
-- - Additional files (documentation, presentations)
-- - Git repository and live project URLs
