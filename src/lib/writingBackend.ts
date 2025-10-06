import { supabase } from '@/integrations/supabase/client';

export interface WritingPiece {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sentiment: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface WritingAlbum {
  id: string;
  title: string;
  color: string;
  icon: string;
  itemIds: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Get all writings (excluding soft-deleted)
export const getWritings = async (): Promise<WritingPiece[]> => {
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(w => ({
    id: w.id,
    title: w.title,
    content: w.content,
    tags: w.tags || [],
    sentiment: w.sentiment || 'contemplative',
    isPublished: w.is_published || false,
    createdAt: new Date(w.created_at),
    updatedAt: new Date(w.updated_at),
    deletedAt: w.deleted_at ? new Date(w.deleted_at) : null,
  }));
};

// Create a new writing
export const createWriting = async (writing: Omit<WritingPiece, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<WritingPiece> => {
  const { data, error } = await supabase
    .from('writings')
    .insert({
      title: writing.title,
      content: writing.content,
      tags: writing.tags,
      sentiment: writing.sentiment,
      is_published: writing.isPublished,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    sentiment: data.sentiment || 'contemplative',
    isPublished: data.is_published || false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
  };
};

// Update a writing
export const updateWriting = async (id: string, updates: Partial<WritingPiece>): Promise<WritingPiece> => {
  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.sentiment !== undefined) updateData.sentiment = updates.sentiment;
  if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;

  const { data, error } = await supabase
    .from('writings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    tags: data.tags || [],
    sentiment: data.sentiment || 'contemplative',
    isPublished: data.is_published || false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
  };
};

// Soft delete a writing
export const softDeleteWriting = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('writings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// Permanently delete a writing
export const permanentDeleteWriting = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('writings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get deleted writings (trash)
export const getDeletedWritings = async (): Promise<WritingPiece[]> => {
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(w => ({
    id: w.id,
    title: w.title,
    content: w.content,
    tags: w.tags || [],
    sentiment: w.sentiment || 'contemplative',
    isPublished: w.is_published || false,
    createdAt: new Date(w.created_at),
    updatedAt: new Date(w.updated_at),
    deletedAt: w.deleted_at ? new Date(w.deleted_at) : null,
  }));
};

// Restore a deleted writing
export const restoreWriting = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('writings')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;
};

// Get all albums
export const getWritingAlbums = async (): Promise<WritingAlbum[]> => {
  const { data: albumsData, error: albumsError } = await supabase
    .from('albums')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (albumsError) throw albumsError;

  const albums: WritingAlbum[] = [];

  for (const album of albumsData || []) {
    const { data: writingsData, error: writingsError } = await supabase
      .from('album_writings')
      .select('writing_id, position')
      .eq('album_id', album.id)
      .order('position', { ascending: true });

    if (writingsError) throw writingsError;

    albums.push({
      id: album.id,
      title: album.title,
      color: album.color || '#FFFFFF',
      icon: album.icon || 'default-icon',
      itemIds: (writingsData || []).map(w => w.writing_id),
      createdAt: new Date(album.created_at),
      updatedAt: new Date(album.updated_at),
      deletedAt: album.deleted_at ? new Date(album.deleted_at) : null,
    });
  }

  return albums;
};

// Create a new album
export const createWritingAlbum = async (album: Omit<WritingAlbum, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<WritingAlbum> => {
  const { data, error } = await supabase
    .from('albums')
    .insert({
      title: album.title,
      color: album.color,
      icon: album.icon,
    })
    .select()
    .single();

  if (error) throw error;

  // Add writings to album
  if (album.itemIds.length > 0) {
    const writingsToInsert = album.itemIds.map((writingId, index) => ({
      album_id: data.id,
      writing_id: writingId,
      position: index,
    }));

    const { error: writingsError } = await supabase
      .from('album_writings')
      .insert(writingsToInsert);

    if (writingsError) throw writingsError;
  }

  return {
    id: data.id,
    title: data.title,
    color: data.color || '#FFFFFF',
    icon: data.icon || 'default-icon',
    itemIds: album.itemIds,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
  };
};

// Update an album
export const updateWritingAlbum = async (id: string, updates: Partial<WritingAlbum>): Promise<WritingAlbum> => {
  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.icon !== undefined) updateData.icon = updates.icon;

  const { data, error } = await supabase
    .from('albums')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Update album writings if itemIds provided
  if (updates.itemIds !== undefined) {
    // Delete existing writings
    const { error: deleteError } = await supabase
      .from('album_writings')
      .delete()
      .eq('album_id', id);

    if (deleteError) throw deleteError;

    // Insert new writings
    if (updates.itemIds.length > 0) {
      const writingsToInsert = updates.itemIds.map((writingId, index) => ({
        album_id: id,
        writing_id: writingId,
        position: index,
      }));

      const { error: insertError } = await supabase
        .from('album_writings')
        .insert(writingsToInsert);

      if (insertError) throw insertError;
    }
  }

  // Get current itemIds
  const { data: writingsData } = await supabase
    .from('album_writings')
    .select('writing_id')
    .eq('album_id', id)
    .order('position', { ascending: true });

  return {
    id: data.id,
    title: data.title,
    color: data.color || '#FFFFFF',
    icon: data.icon || 'default-icon',
    itemIds: (writingsData || []).map(w => w.writing_id),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : null,
  };
};

// Soft delete an album
export const softDeleteAlbum = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('albums')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// Permanently delete an album
export const permanentDeleteAlbum = async (id: string): Promise<void> => {
  // Delete album writings first
  const { error: writingsError } = await supabase
    .from('album_writings')
    .delete()
    .eq('album_id', id);

  if (writingsError) throw writingsError;

  // Delete album
  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get deleted albums
export const getDeletedAlbums = async (): Promise<WritingAlbum[]> => {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;

  const albums: WritingAlbum[] = [];

  for (const album of data || []) {
    const { data: writingsData } = await supabase
      .from('album_writings')
      .select('writing_id, position')
      .eq('album_id', album.id)
      .order('position', { ascending: true });

    albums.push({
      id: album.id,
      title: album.title,
      color: album.color || '#FFFFFF',
      icon: album.icon || 'default-icon',
      itemIds: (writingsData || []).map(w => w.writing_id),
      createdAt: new Date(album.created_at),
      updatedAt: new Date(album.updated_at),
      deletedAt: album.deleted_at ? new Date(album.deleted_at) : null,
    });
  }

  return albums;
};

// Restore a deleted album
export const restoreAlbum = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('albums')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw error;
};
