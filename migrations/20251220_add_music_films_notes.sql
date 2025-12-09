-- Migration: Add music tracks, spotify favorites, film items, and note items tables
-- Created: 2025-12-20

-- Music Tracks table - for custom uploaded tracks
CREATE TABLE IF NOT EXISTS music_tracks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  lyrics_url TEXT,
  duration INTEGER,
  genre TEXT,
  year TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  deleted_at TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Spotify Favorites table - for saved Spotify items
CREATE TABLE IF NOT EXISTS spotify_favorites (
  id SERIAL PRIMARY KEY,
  spotify_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  artist TEXT,
  album_name TEXT,
  image_url TEXT,
  spotify_url TEXT,
  preview_url TEXT,
  rank INTEGER,
  list_type TEXT,
  deleted_at TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Film Items table - for movie watchlist
CREATE TABLE IF NOT EXISTS film_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  director TEXT,
  year TEXT,
  poster_url TEXT,
  tmdb_id TEXT,
  status TEXT NOT NULL DEFAULT 'to-watch',
  rating INTEGER,
  notes TEXT,
  watched_date TEXT,
  genre TEXT[] DEFAULT '{}',
  runtime INTEGER,
  is_private BOOLEAN NOT NULL DEFAULT false,
  deleted_at TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Note Items table - for recipes, shopping lists, quotes
CREATE TABLE IF NOT EXISTS note_items (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty TEXT,
  cuisine TEXT,
  author TEXT,
  source TEXT,
  completed BOOLEAN DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  deleted_at TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_deleted_at ON music_tracks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_spotify_favorites_list_type ON spotify_favorites(list_type);
CREATE INDEX IF NOT EXISTS idx_spotify_favorites_deleted_at ON spotify_favorites(deleted_at);
CREATE INDEX IF NOT EXISTS idx_film_items_status ON film_items(status);
CREATE INDEX IF NOT EXISTS idx_film_items_deleted_at ON film_items(deleted_at);
CREATE INDEX IF NOT EXISTS idx_note_items_type ON note_items(type);
CREATE INDEX IF NOT EXISTS idx_note_items_deleted_at ON note_items(deleted_at);
