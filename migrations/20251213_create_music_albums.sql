-- Create music_albums table for organizing custom music tracks
CREATE TABLE IF NOT EXISTS music_albums (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  color TEXT,
  year TEXT,
  track_ids JSON NOT NULL DEFAULT '[]',
  deleted_at TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_music_albums_deleted_at ON music_albums(deleted_at);
