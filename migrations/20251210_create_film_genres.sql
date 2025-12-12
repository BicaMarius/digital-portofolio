-- Create film_genres table for normalized genre management
CREATE TABLE IF NOT EXISTS film_genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Insert common genres
INSERT INTO film_genres (name) VALUES 
  ('Action'),
  ('Adventure'),
  ('Animation'),
  ('Biography'),
  ('Comedy'),
  ('Crime'),
  ('Documentary'),
  ('Drama'),
  ('Family'),
  ('Fantasy'),
  ('Horror'),
  ('Musical'),
  ('Mystery'),
  ('Romance'),
  ('Sci-Fi'),
  ('Sport'),
  ('Thriller'),
  ('War'),
  ('Western')
ON CONFLICT (name) DO NOTHING;

-- Extract unique genres from existing films and add them
INSERT INTO film_genres (name)
SELECT DISTINCT unnest(genre) FROM film_items WHERE genre IS NOT NULL AND array_length(genre, 1) > 0
ON CONFLICT (name) DO NOTHING;
