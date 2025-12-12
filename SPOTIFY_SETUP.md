# Spotify API Integration Setup

## Quick Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in:
   - App name: `Digital Portfolio`
   - App description: `Personal portfolio music integration`
   - **Redirect URIs**: ADD BOTH:
     - `http://127.0.0.1:5000/api/spotify/callback` (for local development)
     - `https://marius-digital-portofolio.vercel.app/api/spotify/callback` (for production)
   - Check "Web API" checkbox
5. Click "Save"
6. Go to Settings and copy:
   - **Client ID**
   - **Client Secret**

## Environment Variables

Add these to your `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
# Local development:
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/api/spotify/callback
# Production (set in Vercel):
# SPOTIFY_REDIRECT_URI=https://marius-digital-portofolio.vercel.app/api/spotify/callback
```

Or set them in your hosting provider (Vercel, Render, etc.)

⚠️ **IMPORTANT**: You MUST add BOTH redirect URIs in Spotify Developer Dashboard:
- Settings → Redirect URIs → Add:
  1. `http://127.0.0.1:5000/api/spotify/callback` (use 127.0.0.1, not localhost!)
  2. `https://marius-digital-portofolio.vercel.app/api/spotify/callback`
- Click "Add" after each one, then "Save"

✅ **Why 127.0.0.1 instead of localhost?**: Spotify may reject `localhost` as "not secure". Using `127.0.0.1` bypasses this issue.

## Features Available

### Search API (No user login required)
- Search for artists, albums, and tracks
- Get artist/album/track details
- Add items to your Top 10 lists

### What You Can Do
1. **Top 10 Artists** - Search and add your favorite artists
2. **Top 10 Albums** - Search and add your favorite albums  
3. **Top 10 Tracks** - Search and add your favorite tracks

All searches use Spotify's catalog. Results include:
- Cover images
- Spotify links (opens in Spotify app/web)
- Artist names
- Popularity scores

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/spotify/status` | Check if Spotify is configured |
| `GET /api/spotify/search?type=artist&q=query` | Search artists |
| `GET /api/spotify/search?type=album&q=query` | Search albums |
| `GET /api/spotify/search?type=track&q=query` | Search tracks |
| `GET /api/spotify/item/:type/:id` | Get item details |

## OAuth Features (Implemented)

- [x] User authentication (OAuth 2.0 with PKCE)
- [x] Personal Spotify stats
- [x] Top tracks/artists from your account (short/medium/long term)
- [x] Token persistence (auto-login after first auth)

## Additional Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/spotify/auth/url` | Generate OAuth URL |
| `GET /api/spotify/callback?code=...&state=...` | OAuth callback |
| `GET /api/spotify/me/top/artists?time_range=medium_term` | User's top artists |
| `GET /api/spotify/me/top/tracks?time_range=medium_term` | User's top tracks |
| `GET /api/spotify/me/recently-played` | Recently played tracks |
| `GET /api/spotify/me/profile` | User profile |
