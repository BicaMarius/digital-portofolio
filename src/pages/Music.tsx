import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Music2, Disc3, Mic2, Play, Pause, Download, Search, Plus, Sparkles, Upload, ArrowUpRight, Headphones, Library, ListMusic } from 'lucide-react';

// Lightweight data-uri fallback to avoid broken Spotify thumbs
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="%2394a3b8"><rect x="4" y="4" width="72" height="72" rx="10" fill="%23f8fafc"/><path d="M26 54c3.5-4.5 7-7 11.5-7 4.5 0 8 2.5 11.5 7" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="%2394a3b8"/><circle cx="48" cy="32" r="4" fill="%2394a3b8"/></svg>';

// Types for Spotify-like items and custom library
 type SpotifyType = 'artist' | 'album' | 'track';

 interface SpotifyItem {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  url?: string;
  type: SpotifyType;
 }

 interface CustomAlbum {
  id: number;
  title: string;
  description?: string;
  cover?: string;
 }

 interface CustomTrack {
  id: number;
  title: string;
  author: string;
  audioUrl: string;
  artworkUrl?: string;
  lyrics?: string;
  description?: string;
  albumId?: number;
 }

 // Mock data for Spotify-style listings and search results
 const sampleArtists: SpotifyItem[] = [
  { id: '1', title: 'Tame Impala', subtitle: 'Psychedelic / AU', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/artist/5INjqkS1o8h1imAzPqGZBb', type: 'artist' },
  { id: '2', title: 'Radiohead', subtitle: 'Alternative / UK', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb', type: 'artist' },
  { id: '3', title: 'Bicep', subtitle: 'Electronic / UK', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/artist/5rGrDvrLOV2VV8Sc8PSBSW', type: 'artist' },
 ];

 const sampleAlbums: SpotifyItem[] = [
  { id: 'a1', title: 'Currents', subtitle: 'Tame Impala • 2015', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/album/79dL7FLiJFOmV3qF5bZ7jc', type: 'album' },
  { id: 'a2', title: 'Isles', subtitle: 'Bicep • 2021', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/album/1t7qDXarEr0J1KJG1P6U4Z', type: 'album' },
  { id: 'a3', title: 'In Rainbows', subtitle: 'Radiohead • 2007', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/album/5vkqYmiPBYLaalcmjujWxK', type: 'album' },
 ];

 const sampleTracks: SpotifyItem[] = [
  { id: 't1', title: 'Breathe Deeper', subtitle: 'Tame Impala', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/track/6KBYefIoo7KydImq1uUQlL', type: 'track' },
  { id: 't2', title: 'Glue', subtitle: 'Bicep', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/track/6BsiO2T0pU7W3q5rDHxYXb', type: 'track' },
  { id: 't3', title: 'Weird Fishes / Arpeggi', subtitle: 'Radiohead', image: FALLBACK_IMAGE, url: 'https://open.spotify.com/track/5GO8vr7yltr8DclM3Wm4cW', type: 'track' },
 ];

 const mockSpotifySearch = (type: SpotifyType, query: string): SpotifyItem[] => {
  const q = query.trim() || 'Suggestion';
  const pool = type === 'artist' ? sampleArtists : type === 'album' ? sampleAlbums : sampleTracks;
  return pool
    .map((item, idx) => ({
      ...item,
      id: `${item.id}-${q}-${idx}`,
      title: `${item.title}`,
      subtitle: item.subtitle,
    }))
    .slice(0, 5);
 };

 export default function Music() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();

  const [topArtists, setTopArtists] = useState<SpotifyItem[]>(sampleArtists);
  const [topAlbums, setTopAlbums] = useState<SpotifyItem[]>(sampleAlbums);
  const [topTracks, setTopTracks] = useState<SpotifyItem[]>(sampleTracks);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SpotifyType>('artist');
  const [searchResults, setSearchResults] = useState<SpotifyItem[]>([]);

  const [albums, setAlbums] = useState<CustomAlbum[]>([]);
  const [tracks, setTracks] = useState<CustomTrack[]>([]);

    const [showAlbumForm, setShowAlbumForm] = useState(false);
    const [showTrackForm, setShowTrackForm] = useState(false);

  const [albumForm, setAlbumForm] = useState({ title: '', description: '', cover: '' });
   const [trackForm, setTrackForm] = useState({ title: '', author: '', audioUrl: '', artworkUrl: '', lyrics: '', description: '', albumId: null as number | null });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSearch = () => {
    const results = mockSpotifySearch(searchType, searchTerm);
    setSearchResults(results);
  };

  const addToTop = (item: SpotifyItem) => {
    const limit = 10;
    const addUnique = (list: SpotifyItem[]) => {
      const exists = list.find((i) => i.title === item.title && i.type === item.type);
      if (exists) return list;
      const next = [item, ...list];
      return next.slice(0, limit);
    };
    if (item.type === 'artist') setTopArtists((prev) => addUnique(prev));
    if (item.type === 'album') setTopAlbums((prev) => addUnique(prev));
    if (item.type === 'track') setTopTracks((prev) => addUnique(prev));
  };

  const addAlbum = () => {
    if (!albumForm.title.trim()) return;
    setAlbums((prev) => [
      ...prev,
      { id: Date.now(), title: albumForm.title.trim(), description: albumForm.description.trim(), cover: albumForm.cover.trim() },
    ]);
    setAlbumForm({ title: '', description: '', cover: '' });
    setShowAlbumForm(false);
  };

  const addTrack = () => {
    if (!trackForm.title.trim() || !trackForm.audioUrl.trim()) return;
    const newTrack: CustomTrack = {
      id: Date.now(),
      title: trackForm.title.trim(),
      author: trackForm.author.trim() || 'Unknown',
      audioUrl: trackForm.audioUrl.trim(),
      artworkUrl: trackForm.artworkUrl.trim() || undefined,
      lyrics: trackForm.lyrics.trim() || undefined,
      description: trackForm.description.trim() || undefined,
      albumId: trackForm.albumId ?? undefined,
    };
    setTracks((prev) => [...prev, newTrack]);
    setTrackForm({ title: '', author: '', audioUrl: '', artworkUrl: '', lyrics: '', description: '', albumId: null });
    setShowTrackForm(false);
  };

  const togglePlay = (track: CustomTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === track.id) {
      audio.paused ? audio.play() : audio.pause();
      return;
    }
    setPlayingId(track.id);
    audio.src = track.audioUrl;
    audio.play();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    const onEnd = () => setPlayingId(null);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const albumLookup = useMemo(() => Object.fromEntries(albums.map((a) => [a.id, a.title])), [albums]);

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Muzică</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Topuri Spotify custom și bibliotecă personală cu player modern, artwork și versuri sincronizate.
          </p>
        </div>
      </section>

      <section className="page-content-section">
        <div className="page-container space-y-6">
          <Tabs defaultValue="spotify" className="space-y-4">
            <TabsList className="w-full max-w-2xl grid grid-cols-3 gap-1 sm:gap-0">
              <TabsTrigger value="spotify" className="text-xs sm:text-sm px-2">Topuri</TabsTrigger>
              <TabsTrigger value="library" className="text-xs sm:text-sm px-2">Albume</TabsTrigger>
              <TabsTrigger value="tracks" className="text-xs sm:text-sm px-2">Piese</TabsTrigger>
            </TabsList>

            <TabsContent value="spotify" className="space-y-4 pt-2">
              <Card className="border-border/60 bg-muted/20">
                <CardHeader className="pb-3 flex flex-col gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="h-4 w-4" /> Caută pe Spotify și construiește top 10
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tastează artist / album / piesă"
                        className="pl-9"
                      />
                    </div>
                    <Select value={searchType} onValueChange={(v) => setSearchType(v as SpotifyType)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Tip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="album">Album</SelectItem>
                        <SelectItem value="track">Piesă</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="gap-2" onClick={handleSearch}>
                      <Sparkles className="h-4 w-4" /> Caută
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">Introdu un termen și apasă Caută (mock Spotify search).</p>
                  )}
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 p-3"
                    >
                      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        ) : (
                          <Library className="h-5 w-5 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.url && (
                          <Button size="icon" variant="ghost" asChild>
                            <a href={item.url} target="_blank" rel="noreferrer" title="Deschide pe Spotify">
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="sm" onClick={() => addToTop(item)} className="gap-1">
                          <Plus className="h-4 w-4" />
                          Adaugă în top
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className={isMobile ? 'space-y-3' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                <TopList title="Top 10 artiști" icon={<Mic2 className="h-4 w-4" />} items={topArtists} badgeLabel="AR" isMobile={isMobile} />
                <TopList title="Top 10 albume" icon={<Disc3 className="h-4 w-4" />} items={topAlbums} badgeLabel="AL" isMobile={isMobile} />
                <TopList title="Top 10 piese" icon={<Headphones className="h-4 w-4" />} items={topTracks} badgeLabel="TR" showPlay isMobile={isMobile} />
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <Card className="border-border/60 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Library className="h-4 w-4" /> Albume proprii
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Colecția ta de albume</p>
                      <p className="text-xs text-muted-foreground">Încarcă artwork, descrieri și grupează piesele.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => setShowAlbumForm((v) => !v)}>
                      <Plus className="h-4 w-4" /> {showAlbumForm ? 'Ascunde formularul' : 'Adaugă album'}
                    </Button>
                  </div>

                  {showAlbumForm && (
                    <div className="grid gap-3 md:grid-cols-2 border border-dashed border-border/60 rounded-lg p-3 bg-background/70">
                      <div className="space-y-2">
                        <Label>Titlu album</Label>
                        <Input
                          value={albumForm.title}
                          onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                          placeholder="Nume album/EP"
                        />
                        <Label>Descriere (opțional)</Label>
                        <Textarea
                          rows={3}
                          value={albumForm.description}
                          onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                        />
                        <Label>Cover (URL imagine/video)</Label>
                        <Input
                          value={albumForm.cover}
                          onChange={(e) => setAlbumForm({ ...albumForm, cover: e.target.value })}
                          placeholder="https://..."
                        />
                        <Button className="w-full gap-2" onClick={addAlbum}>
                          <Plus className="h-4 w-4" /> Salvează album
                        </Button>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Tips</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Pune un cover pătrat 800x800 pentru cel mai bun aspect.</li>
                          <li>Poți folosi linkuri externe (Cloudinary/Spotify) sau încărcări proprii.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {albums.length === 0 && !showAlbumForm && (
                      <Card className="border-dashed border-border/70 bg-background/60">
                        <CardContent className="p-4 flex flex-col items-start gap-2">
                          <p className="font-semibold">Nu ai încă albume</p>
                          <p className="text-sm text-muted-foreground">Creează primul album pentru a grupa piesele.</p>
                          <Button size="sm" onClick={() => setShowAlbumForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" /> Adaugă album
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    {albums.map((album) => (
                      <Card key={album.id} className="border-border/60 bg-background/80 shadow-sm">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-16 rounded-md bg-muted overflow-hidden">
                              {album.cover ? (
                                <img
                                  src={album.cover}
                                  alt={album.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = FALLBACK_IMAGE;
                                  }}
                                />
                              ) : (
                                <Disc3 className="h-5 w-5 m-auto text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{album.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {album.description || 'Album propriu'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[11px]">Album salvat</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracks" className="space-y-4">
              <Card className="border-border/60 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <ListMusic className="h-4 w-4" /> Piese proprii cu player
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Biblioteca ta de piese</p>
                      <p className="text-xs text-muted-foreground">Upload audio, artwork, versuri și atribuie albume.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => setShowTrackForm((v) => !v)}>
                      <Upload className="h-4 w-4" /> {showTrackForm ? 'Ascunde formularul' : 'Adaugă piesă'}
                    </Button>
                  </div>

                  {showTrackForm && (
                    <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr] border border-dashed border-border/60 rounded-lg p-3 bg-background/70">
                      <div className="space-y-3">
                        <Label>Titlu</Label>
                        <Input
                          value={trackForm.title}
                          onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                          placeholder="Titlu piesă"
                        />
                        <Label>Autor</Label>
                        <Input
                          value={trackForm.author}
                          onChange={(e) => setTrackForm({ ...trackForm, author: e.target.value })}
                          placeholder="Artist / featuring"
                        />
                        <Label>URL audio (mp3/wav)</Label>
                        <Input
                          value={trackForm.audioUrl}
                          onChange={(e) => setTrackForm({ ...trackForm, audioUrl: e.target.value })}
                          placeholder="https://..."
                        />
                        <Label>Artwork / video (URL)</Label>
                        <Input
                          value={trackForm.artworkUrl}
                          onChange={(e) => setTrackForm({ ...trackForm, artworkUrl: e.target.value })}
                          placeholder="URL imagine/video"
                        />
                        <Label>Versuri (vor fi sincronizate automat)</Label>
                        <Textarea
                          rows={3}
                          value={trackForm.lyrics}
                          onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value })}
                          placeholder="Lipeste textul versurilor"
                        />
                        <Label>Descriere (opțional)</Label>
                        <Textarea
                          rows={2}
                          value={trackForm.description}
                          onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                        />
                        <Label>Album (opțional)</Label>
                        <Select
                          value={trackForm.albumId === null ? 'none' : String(trackForm.albumId)}
                          onValueChange={(v) =>
                            setTrackForm({ ...trackForm, albumId: v === 'none' ? null : Number(v) })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Alege album" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Fără album</SelectItem>
                            {albums.map((a) => (
                              <SelectItem key={a.id} value={String(a.id)}>
                                {a.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button className="w-full gap-2" onClick={addTrack}>
                          <Upload className="h-4 w-4" /> Încarcă piesa
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">Recomandări</p>
                          <p>Folosește linkuri HTTPS valide. Lyrics pot fi editate ulterior pentru sync.</p>
                        </div>
                        <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 p-3 text-xs text-foreground">
                          <p className="font-semibold text-sm">Player preview</p>
                          <p>După salvare poți reda, descărca și vedea progresul în stil Spotify.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {tracks.length === 0 && !showTrackForm && (
                      <Card className="border-dashed border-border/70 bg-background/60">
                        <CardContent className="p-4 flex flex-col items-start gap-2">
                          <p className="font-semibold">Nu ai încă piese</p>
                          <p className="text-sm text-muted-foreground">Încarcă audio, artwork și versuri.</p>
                          <Button size="sm" onClick={() => setShowTrackForm(true)} className="gap-2">
                            <Upload className="h-4 w-4" /> Adaugă piesă
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    {tracks.map((track) => (
                      <Card key={track.id} className="border-border/60 bg-background/80 shadow-sm">
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
                            <div className="h-24 w-full sm:w-24 sm:h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-inner">
                              {track.artworkUrl ? (
                                <img
                                  src={track.artworkUrl}
                                  alt={track.title}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = FALLBACK_IMAGE;
                                  }}
                                />
                              ) : (
                                <Music2 className="h-8 w-8 m-auto text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 w-full space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="font-semibold truncate">{track.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{track.author}</p>
                                  {track.albumId && (
                                    <p className="text-[11px] text-muted-foreground">Album: {albumLookup[track.albumId]}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button size="icon" variant="ghost" onClick={() => togglePlay(track)}>
                                    {playingId === track.id && audioRef.current && !audioRef.current.paused ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="icon" variant="ghost" asChild>
                                    <a href={track.audioUrl} download title="Descarcă piesa">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                              {track.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{track.description}</p>
                              )}
                              <div className="space-y-2">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-[width] duration-150"
                                    style={{ width: `${playingId === track.id ? progress : 0}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>{playingId === track.id ? 'În redare' : 'Ready'}</span>
                                  <span className="uppercase tracking-wide">Hi-Fi</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {track.lyrics && (
                            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground max-h-28 overflow-auto">
                              {track.lyrics}
                              <p className="mt-2 text-[11px] text-primary">Sincronizare automată simulată (API ready).</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <audio ref={audioRef} className="hidden" />
    </PageLayout>
  );
 }

 const TopList = ({
  title,
  icon,
  items,
  badgeLabel,
  showPlay = false,
  isMobile = false,
 }: {
  title: string;
  icon: React.ReactNode;
  items: SpotifyItem[];
  badgeLabel: string;
  showPlay?: boolean;
  isMobile?: boolean;
 }) => {
  return (
    <Card className="border-border/60 bg-background/70">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Completează topul.</p>}
        <div className="space-y-2">
          {items.slice(0, 10).map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2"
            >
              <Badge variant="outline" className="px-2 py-1 text-[11px] border-primary/50 text-primary">{badgeLabel}{idx + 1}</Badge>
              <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                ) : (
                  <Library className="h-4 w-4 m-auto text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
              </div>
              {item.url && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {showPlay && (
                <Button size="icon" variant="ghost" asChild>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <Play className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
 };
