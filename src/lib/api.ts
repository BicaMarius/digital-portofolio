// API helper functions for Creative Writing, Projects, Albums, and Gallery Items
import type { Writing, Album, Tag, Project, GalleryItem } from '@shared/schema';

const API_BASE = '/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(`API call failed: ${response.status} ${response.statusText} ${text}`) as Error & { status?: number };
    // annotate status for fallback checks
    err.status = response.status;
    throw err;
  }

  // For DELETE requests with 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ============ WRITINGS API ============

export async function getWritings(): Promise<Writing[]> {
  return apiCall<Writing[]>('/writings');
}

export async function getWriting(id: number): Promise<Writing> {
  return apiCall<Writing>(`/writings/${id}`);
}

export async function createWriting(writing: Omit<Writing, 'id'>): Promise<Writing> {
  return apiCall<Writing>('/writings', {
    method: 'POST',
    body: JSON.stringify(writing),
  });
}

export async function updateWriting(id: number, updates: Partial<Writing>): Promise<Writing> {
  return apiCall<Writing>(`/writings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteWriting(id: number): Promise<void> {
  return apiCall<void>(`/writings/${id}`, { method: 'DELETE' });
}

// ============ ALBUMS API ============

export async function getAlbums(contentType?: 'art' | 'writings'): Promise<Album[]> {
  const query = contentType ? `?contentType=${contentType}` : '';
  return apiCall<Album[]>(`/albums${query}`);
}

export async function getAlbum(id: number): Promise<Album> {
  return apiCall<Album>(`/albums/${id}`);
}

export async function createAlbum(album: Omit<Album, 'id'>): Promise<Album> {
  return apiCall<Album>('/albums', {
    method: 'POST',
    body: JSON.stringify(album),
  });
}

export async function updateAlbum(id: number, updates: Partial<Album>): Promise<Album> {
  return apiCall<Album>(`/albums/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteAlbum(id: number): Promise<void> {
  return apiCall<void>(`/albums/${id}`, { method: 'DELETE' });
}

// Convenience helpers for album membership
export async function addItemToAlbum(album: Album, itemId: number): Promise<Album> {
  const next = Array.from(new Set([...(album.itemIds || []), itemId]));
  return updateAlbum(album.id, { itemIds: next } as Partial<Album>);
}

export async function removeItemFromAlbum(album: Album, itemId: number): Promise<Album> {
  const next = (album.itemIds || []).filter((id) => id !== itemId);
  return updateAlbum(album.id, { itemIds: next } as Partial<Album>);
}

// ============ TAGS API ============

export async function getTags(): Promise<Tag[]> {
  return apiCall<Tag[]>('/tags');
}

export async function getTag(id: number): Promise<Tag> {
  return apiCall<Tag>(`/tags/${id}`);
}

export async function createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
  return apiCall<Tag>('/tags', {
    method: 'POST',
    body: JSON.stringify(tag),
  });
}

export async function updateTag(id: number, updates: Partial<Tag>): Promise<Tag> {
  return apiCall<Tag>(`/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteTag(id: number): Promise<void> {
  return apiCall<void>(`/tags/${id}`, {
    method: 'DELETE',
  });
}

// ============ PROJECTS API ============

export async function getProjects(): Promise<Project[]> {
  return apiCall<Project[]>('/projects');
}

export async function getProject(id: number): Promise<Project> {
  return apiCall<Project>(`/projects/${id}`);
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  return apiCall<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function updateProject(id: number, updates: Partial<Project>): Promise<Project> {
  return apiCall<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(id: number): Promise<void> {
  return apiCall<void>(`/projects/${id}`, { method: 'DELETE' });
}

// ============ GALLERY ITEMS API ============

export async function getGalleryItems(): Promise<GalleryItem[]> {
  return apiCall<GalleryItem[]>('/gallery');
}

export async function getGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
  return apiCall<GalleryItem[]>(`/gallery/category/${encodeURIComponent(category)}`);
}

export async function getTrashedGalleryItems(): Promise<GalleryItem[]> {
  return apiCall<GalleryItem[]>('/gallery/trash');
}

export async function getTrashedGalleryItemsByCategory(category: string): Promise<GalleryItem[]> {
  return apiCall<GalleryItem[]>(`/gallery/trash/category/${encodeURIComponent(category)}`);
}

export async function getGalleryItem(id: number): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/gallery/${id}`);
}

export async function createGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<GalleryItem> {
  return apiCall<GalleryItem>('/gallery', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateGalleryItem(id: number, updates: Partial<GalleryItem>): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/gallery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteGalleryItem(id: number): Promise<void> {
  return apiCall<void>(`/gallery/${id}`, { method: 'DELETE' });
}

// Soft delete helper (sets deletedAt instead of hard delete)
export async function softDeleteGalleryItem(id: number): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/gallery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
  });
}

export async function restoreGalleryItem(id: number): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/gallery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: null }),
  });
}
