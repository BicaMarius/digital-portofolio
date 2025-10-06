-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update writings table with soft delete
ALTER TABLE public.writings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update albums table with soft delete
ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_writings_deleted_at ON public.writings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_albums_deleted_at ON public.albums(deleted_at);

-- Create profiles table for admin role management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Update writings RLS policies
DROP POLICY IF EXISTS "Allow all operations on writings" ON public.writings;

CREATE POLICY "Anyone can view non-deleted writings"
  ON public.writings FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert writings"
  ON public.writings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update writings"
  ON public.writings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete writings"
  ON public.writings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update albums RLS policies
DROP POLICY IF EXISTS "Allow all operations on albums" ON public.albums;

CREATE POLICY "Anyone can view non-deleted albums"
  ON public.albums FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert albums"
  ON public.albums FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update albums"
  ON public.albums FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete albums"
  ON public.albums FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update album_writings RLS policies
DROP POLICY IF EXISTS "Allow all operations on album_writings" ON public.album_writings;

CREATE POLICY "Anyone can view album_writings"
  ON public.album_writings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert album_writings"
  ON public.album_writings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update album_writings"
  ON public.album_writings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete album_writings"
  ON public.album_writings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email = 'mbica36599@gmail.com'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to permanently delete old soft-deleted items
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_writings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.writings
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '7 days';
    
  DELETE FROM public.albums
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Enable realtime for writings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.writings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.albums;
ALTER PUBLICATION supabase_realtime ADD TABLE public.album_writings;

-- Set replica identity for realtime updates
ALTER TABLE public.writings REPLICA IDENTITY FULL;
ALTER TABLE public.albums REPLICA IDENTITY FULL;
ALTER TABLE public.album_writings REPLICA IDENTITY FULL;