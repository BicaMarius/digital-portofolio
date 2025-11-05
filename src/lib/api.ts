// API helper functions for Creative Writing and Projects
import type { Writing, Album, Tag, Project } from '@shared/schema';

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
  try {
    return await apiCall<Writing>(`/writings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      // Fallback to POST command endpoint
      return apiCall<Writing>(`/writings-update`, {
        method: 'POST',
        body: JSON.stringify({ id, updates }),
      });
    }
    throw err;
  }
}

export async function deleteWriting(id: number): Promise<void> {
  try {
    return await apiCall<void>(`/writings/${id}`, { method: 'DELETE' });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      return apiCall<void>(`/writings-delete`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
    }
    throw err;
  }
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
  try {
    return await apiCall<Album>(`/albums/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      return apiCall<Album>(`/albums-update`, {
        method: 'POST',
        body: JSON.stringify({ id, updates }),
      });
    }
    throw err;
  }
}

export async function deleteAlbum(id: number): Promise<void> {
  try {
    return await apiCall<void>(`/albums/${id}`, { method: 'DELETE' });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      return apiCall<void>(`/albums-delete`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
    }
    throw err;
  }
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
  try {
    return await apiCall<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      return apiCall<Project>(`/projects-update?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    }
    throw err;
  }
}

export async function deleteProject(id: number): Promise<void> {
  try {
    return await apiCall<void>(`/projects/${id}`, { method: 'DELETE' });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err?.status === 405) {
      return apiCall<void>(`/projects-delete?id=${id}`, {
        method: 'DELETE',
      });
    }
    throw err;
  }
}
