// API helper functions for Creative Writing, Projects, Albums, and Gallery Items
import type { Writing, Album, Tag, Project, GalleryItem, PhotoLocation, PhotoDevice, MusicTrack, SpotifyFavorite, FilmItem, NoteItem } from '@shared/schema';

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

export async function softDeleteProject(id: number): Promise<void> {
  return apiCall<void>(`/projects/${id}/soft-delete`, { method: 'POST' });
}

export async function restoreProject(id: number): Promise<void> {
  return apiCall<void>(`/projects/${id}/restore`, { method: 'POST' });
}

export async function permanentDeleteProject(id: number): Promise<void> {
  return apiCall<void>(`/projects/${id}/permanent`, { method: 'DELETE' });
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

// ============ PHOTO LOCATIONS API ============

export async function getPhotoLocations(): Promise<PhotoLocation[]> {
  return apiCall<PhotoLocation[]>('/photo-locations');
}

export async function getPhotoLocation(id: number): Promise<PhotoLocation> {
  return apiCall<PhotoLocation>(`/photo-locations/${id}`);
}

export async function createPhotoLocation(location: Omit<PhotoLocation, 'id'>): Promise<PhotoLocation> {
  return apiCall<PhotoLocation>('/photo-locations', {
    method: 'POST',
    body: JSON.stringify(location),
  });
}

export async function updatePhotoLocation(id: number, updates: Partial<PhotoLocation>): Promise<PhotoLocation> {
  return apiCall<PhotoLocation>(`/photo-locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deletePhotoLocation(id: number): Promise<void> {
  return apiCall<void>(`/photo-locations/${id}`, {
    method: 'DELETE',
  });
}

// ============ PHOTO DEVICES API ============

export async function getPhotoDevices(): Promise<PhotoDevice[]> {
  return apiCall<PhotoDevice[]>('/photo-devices');
}

export async function getPhotoDevice(id: number): Promise<PhotoDevice> {
  return apiCall<PhotoDevice>(`/photo-devices/${id}`);
}

export async function createPhotoDevice(device: Omit<PhotoDevice, 'id'>): Promise<PhotoDevice> {
  return apiCall<PhotoDevice>('/photo-devices', {
    method: 'POST',
    body: JSON.stringify(device),
  });
}

export async function updatePhotoDevice(id: number, updates: Partial<PhotoDevice>): Promise<PhotoDevice> {
  return apiCall<PhotoDevice>(`/photo-devices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deletePhotoDevice(id: number): Promise<void> {
  return apiCall<void>(`/photo-devices/${id}`, {
    method: 'DELETE',
  });
}

// ============ MUSIC TRACKS API ============

export async function getMusicTracks(): Promise<MusicTrack[]> {
  return apiCall<MusicTrack[]>('/music-tracks');
}

export async function getMusicTrack(id: number): Promise<MusicTrack> {
  return apiCall<MusicTrack>(`/music-tracks/${id}`);
}

export async function getTrashedMusicTracks(): Promise<MusicTrack[]> {
  return apiCall<MusicTrack[]>('/music-tracks/trash');
}

export async function createMusicTrack(track: Omit<MusicTrack, 'id' | 'createdAt' | 'updatedAt'>): Promise<MusicTrack> {
  return apiCall<MusicTrack>('/music-tracks', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}

export async function updateMusicTrack(id: number, updates: Partial<MusicTrack>): Promise<MusicTrack> {
  return apiCall<MusicTrack>(`/music-tracks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteMusicTrack(id: number): Promise<void> {
  return apiCall<void>(`/music-tracks/${id}`, { method: 'DELETE' });
}

export async function softDeleteMusicTrack(id: number): Promise<MusicTrack> {
  return apiCall<MusicTrack>(`/music-tracks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
  });
}

export async function restoreMusicTrack(id: number): Promise<MusicTrack> {
  return apiCall<MusicTrack>(`/music-tracks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: null }),
  });
}

// ============ SPOTIFY API ============

export interface SpotifySearchResult {
  id: string;
  spotifyId: string;
  name: string;
  artist?: string;
  albumName?: string;
  imageUrl?: string;
  spotifyUrl: string;
  previewUrl?: string;
  type: 'artist' | 'album' | 'track';
  popularity?: number;
  releaseDate?: string;
  genres?: string[];
}

export async function searchSpotify(type: 'artist' | 'album' | 'track', query: string, limit: number = 10): Promise<SpotifySearchResult[]> {
  return apiCall<SpotifySearchResult[]>(`/spotify/search?type=${type}&q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getSpotifyItem(type: 'artist' | 'album' | 'track', id: string): Promise<SpotifySearchResult> {
  return apiCall<SpotifySearchResult>(`/spotify/item/${type}/${id}`);
}

export async function getSpotifyStatus(): Promise<{ configured: boolean }> {
  return apiCall<{ configured: boolean }>('/spotify/status');
}

// ============ SPOTIFY USER AUTH & STATS ============

export interface SpotifyAuthUrl {
  url: string;
  state: string;
}

export interface SpotifyTopItem {
  id: string;
  name: string;
  artist?: string;
  imageUrl?: string;
  spotifyUrl: string;
  playCount?: number;
  type: 'artist' | 'album' | 'track';
}

export async function getSpotifyAuthUrl(): Promise<SpotifyAuthUrl> {
  return apiCall<SpotifyAuthUrl>('/spotify/auth/url');
}

export async function getSpotifyAuthStatus(): Promise<{ authenticated: boolean }> {
  return apiCall<{ authenticated: boolean }>('/spotify/auth/status');
}

export async function getSpotifyUserTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyTopItem[]> {
  return apiCall<SpotifyTopItem[]>(`/spotify/me/top/artists?time_range=${timeRange}&limit=10`);
}

export async function getSpotifyUserTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyTopItem[]> {
  return apiCall<SpotifyTopItem[]>(`/spotify/me/top/tracks?time_range=${timeRange}&limit=10`);
}

export async function getSpotifyRecentlyPlayed(limit: number = 50): Promise<any[]> {
  return apiCall<any[]>(`/spotify/me/recently-played?limit=${limit}`);
}

export async function getSpotifyUserProfile(): Promise<any> {
  return apiCall<any>('/spotify/me/profile');
}

// ============ SPOTIFY FAVORITES API ============

export async function getSpotifyFavorites(): Promise<SpotifyFavorite[]> {
  return apiCall<SpotifyFavorite[]>('/spotify-favorites');
}

export async function getSpotifyFavoritesByListType(listType: string): Promise<SpotifyFavorite[]> {
  return apiCall<SpotifyFavorite[]>(`/spotify-favorites/list/${listType}`);
}

export async function getSpotifyFavorite(id: number): Promise<SpotifyFavorite> {
  return apiCall<SpotifyFavorite>(`/spotify-favorites/${id}`);
}

export async function getTrashedSpotifyFavorites(): Promise<SpotifyFavorite[]> {
  return apiCall<SpotifyFavorite[]>('/spotify-favorites/trash');
}

export async function createSpotifyFavorite(favorite: Omit<SpotifyFavorite, 'id' | 'createdAt'>): Promise<SpotifyFavorite> {
  return apiCall<SpotifyFavorite>('/spotify-favorites', {
    method: 'POST',
    body: JSON.stringify(favorite),
  });
}

export async function updateSpotifyFavorite(id: number, updates: Partial<SpotifyFavorite>): Promise<SpotifyFavorite> {
  return apiCall<SpotifyFavorite>(`/spotify-favorites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSpotifyFavorite(id: number): Promise<void> {
  return apiCall<void>(`/spotify-favorites/${id}`, { method: 'DELETE' });
}

export async function softDeleteSpotifyFavorite(id: number): Promise<SpotifyFavorite> {
  return apiCall<SpotifyFavorite>(`/spotify-favorites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
  });
}

export async function restoreSpotifyFavorite(id: number): Promise<SpotifyFavorite> {
  return apiCall<SpotifyFavorite>(`/spotify-favorites/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: null }),
  });
}

// ============ FILM ITEMS API ============

export async function getFilms(): Promise<FilmItem[]> {
  return apiCall<FilmItem[]>('/films');
}

export async function getFilmsByStatus(status: string): Promise<FilmItem[]> {
  return apiCall<FilmItem[]>(`/films/status/${status}`);
}

export async function getFilm(id: number): Promise<FilmItem> {
  return apiCall<FilmItem>(`/films/${id}`);
}

export async function getTrashedFilms(): Promise<FilmItem[]> {
  return apiCall<FilmItem[]>('/films/trash');
}

export async function createFilm(film: Omit<FilmItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FilmItem> {
  return apiCall<FilmItem>('/films', {
    method: 'POST',
    body: JSON.stringify(film),
  });
}

export async function updateFilm(id: number, updates: Partial<FilmItem>): Promise<FilmItem> {
  return apiCall<FilmItem>(`/films/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteFilm(id: number): Promise<void> {
  return apiCall<void>(`/films/${id}`, { method: 'DELETE' });
}

export async function softDeleteFilm(id: number): Promise<FilmItem> {
  return apiCall<FilmItem>(`/films/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
  });
}

export async function restoreFilm(id: number): Promise<FilmItem> {
  return apiCall<FilmItem>(`/films/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: null }),
  });
}

// ============ NOTE ITEMS API ============

export async function getNotes(): Promise<NoteItem[]> {
  return apiCall<NoteItem[]>('/notes');
}

export async function getNotesByType(type: string): Promise<NoteItem[]> {
  return apiCall<NoteItem[]>(`/notes/type/${type}`);
}

export async function getNote(id: number): Promise<NoteItem> {
  return apiCall<NoteItem>(`/notes/${id}`);
}

export async function getTrashedNotes(): Promise<NoteItem[]> {
  return apiCall<NoteItem[]>('/notes/trash');
}

export async function createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoteItem> {
  return apiCall<NoteItem>('/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
}

export async function updateNote(id: number, updates: Partial<NoteItem>): Promise<NoteItem> {
  return apiCall<NoteItem>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteNote(id: number): Promise<void> {
  return apiCall<void>(`/notes/${id}`, { method: 'DELETE' });
}

export async function softDeleteNote(id: number): Promise<NoteItem> {
  return apiCall<NoteItem>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: new Date().toISOString() }),
  });
}

export async function restoreNote(id: number): Promise<NoteItem> {
  return apiCall<NoteItem>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ deletedAt: null }),
  });
}

// ============ FILM GENRES API ============

export interface FilmGenre {
  id: number;
  name: string;
}

export async function getFilmGenres(): Promise<FilmGenre[]> {
  return apiCall<FilmGenre[]>('/film-genres');
}

export async function createFilmGenre(name: string): Promise<FilmGenre> {
  return apiCall<FilmGenre>('/film-genres', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateFilmGenre(id: number, name: string): Promise<FilmGenre> {
  return apiCall<FilmGenre>(`/film-genres/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteFilmGenre(id: number): Promise<void> {
  return apiCall<void>(`/film-genres/${id}`, { method: 'DELETE' });
}
