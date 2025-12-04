-- Add deleted_at column to projects table for soft delete functionality
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP;
