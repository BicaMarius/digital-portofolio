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

export async function getAlbums(): Promise<Album[]> {
  return apiCall<Album[]>('/albums');
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
  return apiCall<GalleryItem[]>('/galleryItems');
}

export async function getGalleryItem(id: number): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/galleryItems/${id}`);
}

export async function createGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<GalleryItem> {
  return apiCall<GalleryItem>('/galleryItems', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateGalleryItem(id: number, updates: Partial<GalleryItem>): Promise<GalleryItem> {
  return apiCall<GalleryItem>(`/galleryItems/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteGalleryItem(id: number): Promise<void> {
  return apiCall<void>(`/galleryItems/${id}`, { method: 'DELETE' });
}
