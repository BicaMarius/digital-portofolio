-- Migration to add photo_locations and photo_devices tables
-- Created: 2025-11-12

-- Create photo_locations table
CREATE TABLE IF NOT EXISTS photo_locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create photo_devices table
CREATE TABLE IF NOT EXISTS photo_devices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photo_locations_name ON photo_locations(name);
CREATE INDEX IF NOT EXISTS idx_photo_devices_name ON photo_devices(name);
