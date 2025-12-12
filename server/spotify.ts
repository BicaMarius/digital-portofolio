/**
 * Spotify Web API Integration
 * 
 * Two authentication flows:
 * 1. Client Credentials - for searching (no user login)
 * 2. Authorization Code with PKCE - for user stats (requires login)
 * 
 * Required env variables:
 * - SPOTIFY_CLIENT_ID
 * - SPOTIFY_CLIENT_SECRET
 * - SPOTIFY_REDIRECT_URI (for OAuth)
 */

import { db } from './db.js';
import { spotifyUserTokens } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface SpotifyToken {
  accessToken: string;
  expiresAt: number;
}

interface UserToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let cachedToken: SpotifyToken | null = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env variables.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Spotify token: ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.accessToken;
}

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

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  external_urls: { spotify: string };
  genres?: string[];
  popularity?: number;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images?: SpotifyImage[];
  artists: { name: string }[];
  external_urls: { spotify: string };
  release_date?: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  album: SpotifyAlbum;
  artists: { name: string }[];
  external_urls: { spotify: string };
  preview_url?: string;
  popularity?: number;
}

/**
 * Search Spotify for artists, albums, or tracks
 */
export async function searchSpotify(
  type: 'artist' | 'album' | 'track',
  query: string,
  limit: number = 10
): Promise<SpotifySearchResult[]> {
  if (!query.trim()) return [];

  const token = await getAccessToken();
  
  const params = new URLSearchParams({
    q: query,
    type: type,
    limit: String(limit),
    market: 'RO', // Romania market
  });

  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify search failed: ${error}`);
  }

  const data = await response.json() as {
    artists?: { items: SpotifyArtist[] };
    albums?: { items: SpotifyAlbum[] };
    tracks?: { items: SpotifyTrack[] };
  };

  // Parse results based on type
  if (type === 'artist') {
    return (data.artists?.items || []).map((artist: SpotifyArtist): SpotifySearchResult => ({
      id: artist.id,
      spotifyId: `spotify:artist:${artist.id}`,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url,
      spotifyUrl: artist.external_urls.spotify,
      type: 'artist',
      popularity: artist.popularity,
      genres: artist.genres,
    }));
  }

  if (type === 'album') {
    return (data.albums?.items || []).map((album: SpotifyAlbum): SpotifySearchResult => ({
      id: album.id,
      spotifyId: `spotify:album:${album.id}`,
      name: album.name,
      artist: album.artists.map(a => a.name).join(', '),
      imageUrl: album.images?.[0]?.url,
      spotifyUrl: album.external_urls.spotify,
      type: 'album',
      releaseDate: album.release_date,
    }));
  }

  // tracks
  return (data.tracks?.items || []).map((track: SpotifyTrack): SpotifySearchResult => ({
    id: track.id,
    spotifyId: `spotify:track:${track.id}`,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    albumName: track.album.name,
    imageUrl: track.album.images?.[0]?.url,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url || undefined,
    type: 'track',
    popularity: track.popularity,
  }));
}

/**
 * Get details for a specific Spotify item by ID
 */
export async function getSpotifyItem(
  type: 'artist' | 'album' | 'track',
  id: string
): Promise<SpotifySearchResult | null> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1/${type}s/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.text();
    throw new Error(`Spotify fetch failed: ${error}`);
  }

  const item = await response.json();

  if (type === 'artist') {
    const artist = item as SpotifyArtist;
    return {
      id: artist.id,
      spotifyId: `spotify:artist:${artist.id}`,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url,
      spotifyUrl: artist.external_urls.spotify,
      type: 'artist',
      popularity: artist.popularity,
      genres: artist.genres,
    };
  }

  if (type === 'album') {
    const album = item as SpotifyAlbum;
    return {
      id: album.id,
      spotifyId: `spotify:album:${album.id}`,
      name: album.name,
      artist: album.artists.map(a => a.name).join(', '),
      imageUrl: album.images?.[0]?.url,
      spotifyUrl: album.external_urls.spotify,
      type: 'album',
      releaseDate: album.release_date,
    };
  }

  const track = item as SpotifyTrack;
  return {
    id: track.id,
    spotifyId: `spotify:track:${track.id}`,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    albumName: track.album.name,
    imageUrl: track.album.images?.[0]?.url,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url || undefined,
    type: 'track',
    popularity: track.popularity,
  };
}

/**
 * Check if Spotify credentials are configured
 */
export function isSpotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}
// ========== USER AUTHENTICATION (OAuth 2.0 with PKCE) ==========

const SPOTIFY_SCOPES = [
  'user-top-read',           // Top artists, tracks
  'user-read-recently-played', // Recently played
  'user-read-playback-state',  // Current playback
].join(' ');

/**
 * Generate authorization URL for user login
 */
export function getAuthorizationUrl(state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5000/api/spotify/callback';

  if (!clientId) {
    throw new Error('Missing SPOTIFY_CLIENT_ID');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state: state,
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<UserToken> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5000/api/spotify/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
}

/**
 * Refresh user access token
 */
export async function refreshUserToken(refreshToken: string): Promise<UserToken> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
}

/**
 * Store user token in database
 */
export async function storeUserToken(userId: string, token: UserToken): Promise<void> {
  const existing = await db
    .select()
    .from(spotifyUserTokens)
    .where(eq(spotifyUserTokens.userId, userId))
    .limit(1);

  const tokenData = {
    userId,
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: Math.floor(token.expiresAt / 1000), // Convert to seconds
    scope: SPOTIFY_SCOPES,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    // Update existing token
    await db
      .update(spotifyUserTokens)
      .set(tokenData)
      .where(eq(spotifyUserTokens.userId, userId));
  } else {
    // Insert new token
    await db.insert(spotifyUserTokens).values(tokenData);
  }
}

/**
 * Get user token from database and refresh if needed
 */
export async function getUserToken(userId: string): Promise<string> {
  const rows = await db
    .select()
    .from(spotifyUserTokens)
    .where(eq(spotifyUserTokens.userId, userId))
    .limit(1);
  
  if (rows.length === 0) {
    throw new Error('User not authenticated. Please login with Spotify.');
  }

  const tokenRecord = rows[0];
  const tokenData: UserToken = {
    accessToken: tokenRecord.accessToken,
    refreshToken: tokenRecord.refreshToken,
    expiresAt: tokenRecord.expiresAt * 1000, // Convert back to milliseconds
  };

  // Refresh if expired or expiring soon
  if (Date.now() >= tokenData.expiresAt - 60000) {
    const newToken = await refreshUserToken(tokenData.refreshToken);
    await storeUserToken(userId, newToken);
    return newToken.accessToken;
  }

  return tokenData.accessToken;
}

// ========== USER STATS ENDPOINTS ==========

export interface SpotifyTopItem {
  id: string;
  name: string;
  artist?: string;
  imageUrl?: string;
  spotifyUrl: string;
  playCount?: number;
  type: 'artist' | 'album' | 'track';
}

export interface ListeningStats {
  totalMinutes: number;
  topGenres: string[];
  year: number;
}

/**
 * Get user's top artists
 */
export async function getUserTopArtists(
  userId: string,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 10
): Promise<SpotifyTopItem[]> {
  const token = await getUserToken(userId);
  
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });

  const response = await fetch(`https://api.spotify.com/v1/me/top/artists?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get top artists: ${error}`);
  }

  const data = await response.json() as { items: SpotifyArtist[] };

  return data.items.map((artist, idx): SpotifyTopItem => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images?.[0]?.url,
    spotifyUrl: artist.external_urls.spotify,
    playCount: undefined, // Spotify doesn't provide exact play counts
    type: 'artist',
  }));
}

/**
 * Get user's top tracks
 */
export async function getUserTopTracks(
  userId: string,
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 10
): Promise<SpotifyTopItem[]> {
  const token = await getUserToken(userId);
  
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });

  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get top tracks: ${error}`);
  }

  const data = await response.json() as { items: SpotifyTrack[] };

  return data.items.map((track): SpotifyTopItem => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    imageUrl: track.album.images?.[0]?.url,
    spotifyUrl: track.external_urls.spotify,
    playCount: undefined,
    type: 'track',
  }));
}

/**
 * Get user's recently played tracks
 */
export async function getRecentlyPlayed(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  const token = await getUserToken(userId);
  
  const params = new URLSearchParams({ limit: String(limit) });

  const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get recently played: ${error}`);
  }

  const data = await response.json() as { items: any[] };
  return data.items || [];
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<any> {
  const token = await getUserToken(userId);

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user profile: ${error}`);
  }

  return response.json();
}