import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Music2, Disc3, Mic2, Play, Pause, Download, Search, Plus, Upload, ArrowUpRight, Headphones, Library, ListMusic, Trash2, RotateCcw, X, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';
import * as api from '@/lib/api';
import type { MusicTrack, SpotifyFavorite } from '@shared/schema';

// Fallback image
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="%2394a3b8"><rect x="4" y="4" width="72" height="72" rx="10" fill="%23f8fafc"/><path d="M26 54c3.5-4.5 7-7 11.5-7 4.5 0 8 2.5 11.5 7" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="%2394a3b8"/><circle cx="48" cy="32" r="4" fill="%2394a3b8"/></svg>';

// Types
type SpotifyType = 'artist' | 'album' | 'track';

interface SpotifySearchResult {
  id: string;
  spotifyId: string;
  name: string;
  artist?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  type: SpotifyType;
}

// Mock Spotify search - în viitor va fi înlocuit cu API-ul real Spotify
const mockSpotifySearch = async (type: SpotifyType, query: string): Promise<SpotifySearchResult[]> => {
  if (!query.trim()) return [];
  
  // Simulate API delay
  await new Promise(r => setTimeout(r, 300));
  
  // Generate mock results based on search query
  const results: SpotifySearchResult[] = [];
  const baseImages = [
    'https://i.scdn.co/image/ab67616d0000b273ff9ca10b55ce82ae553c8228',
    'https://i.scdn.co/image/ab67616d0000b2734ae1c4c5c45aabe565499163',
    'https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f',
  ];
  
  for (let i = 0; i < 5; i++) {
    results.push({
      id: `${type}-${query}-${i}`,
      spotifyId: `spotify:${type}:${Date.now()}${i}`,
      name: `${query} ${type === 'track' ? 'Song' : type === 'album' ? 'Album' : 'Artist'} ${i + 1}`,
      artist: type !== 'artist' ? `Artist for ${query}` : undefined,
      imageUrl: baseImages[i % 3],
      spotifyUrl: `https://open.spotify.com/${type}/example${i}`,
      previewUrl: type === 'track' ? 'https://p.scdn.co/mp3-preview/example' : undefined,
      type,
    });
  }
  
  return results;
};

export default function Music() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Cloud data state
  const [topArtists, setTopArtists] = useState<SpotifyFavorite[]>([]);
  const [topAlbums, setTopAlbums] = useState<SpotifyFavorite[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyFavorite[]>([]);
  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([]);
  const [trashedTracks, setTrashedTracks] = useState<MusicTrack[]>([]);
  const [trashedFavorites, setTrashedFavorites] = useState<SpotifyFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  // Search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState<SpotifyType>('artist');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Track upload dialog state
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [trackForm, setTrackForm] = useState({
    title: '',
    author: '',
    description: '',
    albumId: null as number | null,
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Media player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Trash dialog state
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'track' | 'favorite'; id: number } | null>(null);

  // Load data from cloud
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tracks, favs, trashedT, trashedF] = await Promise.all([
        api.getMusicTracks(),
        api.getSpotifyFavorites(),
        api.getTrashedMusicTracks(),
        api.getTrashedSpotifyFavorites(),
      ]);
      
      setCustomTracks(tracks);
      setTrashedTracks(trashedT);
      setTrashedFavorites(trashedF);
      
      // Separate favorites by type
      setTopArtists(favs.filter(f => f.type === 'artist' && f.listType === 'top10'));
      setTopAlbums(favs.filter(f => f.type === 'album' && f.listType === 'top10'));
      setTopTracks(favs.filter(f => f.type === 'track' && f.listType === 'top10'));
    } catch (error) {
      console.error('Failed to load music data:', error);
      toast({ title: 'Eroare', description: 'Nu am putut încărca datele.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Spotify search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await mockSpotifySearch(searchType, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // Add to top 10
  const addToTop = async (item: SpotifySearchResult) => {
    const currentList = searchType === 'artist' ? topArtists : searchType === 'album' ? topAlbums : topTracks;
    
    if (currentList.length >= 10) {
      toast({ title: 'Limită atinsă', description: 'Poți avea maxim 10 elemente în top.', variant: 'destructive' });
      return;
    }
    
    // Check if already exists
    if (currentList.some(f => f.spotifyId === item.spotifyId)) {
      toast({ title: 'Deja adăugat', description: 'Acest element este deja în top.', variant: 'destructive' });
      return;
    }
    
    try {
      await api.createSpotifyFavorite({
        spotifyId: item.spotifyId,
        type: item.type,
        name: item.name,
        artist: item.artist || null,
        albumName: null,
        imageUrl: item.imageUrl || null,
        spotifyUrl: item.spotifyUrl || null,
        previewUrl: item.previewUrl || null,
        rank: currentList.length + 1,
        listType: 'top10',
        deletedAt: null,
      });
      
      toast({ title: 'Adăugat', description: `${item.name} a fost adăugat în top.` });
      setSearchDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (error) {
      console.error('Failed to add to top:', error);
      toast({ title: 'Eroare', description: 'Nu am putut adăuga în top.', variant: 'destructive' });
    }
  };

  // Remove from top
  const removeFromTop = async (favorite: SpotifyFavorite) => {
    try {
      await api.softDeleteSpotifyFavorite(favorite.id);
      toast({ title: 'Eliminat', description: `${favorite.name} a fost mutat în coș.` });
      loadData();
    } catch (error) {
      console.error('Failed to remove from top:', error);
      toast({ title: 'Eroare', description: 'Nu am putut elimina din top.', variant: 'destructive' });
    }
  };

  // File upload handler
  const uploadFile = async (file: File, folder: string, type: 'audio' | 'image'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const endpoint = type === 'audio' ? '/api/upload/audio' : '/api/upload/image';
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    
    if (!res.ok) throw new Error('Upload failed');
    
    const data = await res.json();
    return data.url;
  };

  // Add custom track
  const handleAddTrack = async () => {
    if (!trackForm.title.trim() || !trackForm.author.trim() || !audioFile) {
      toast({ title: 'Eroare', description: 'Titlu, autor și fișier audio sunt obligatorii.', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      
      // Upload files
      const audioUrl = await uploadFile(audioFile, 'portfolio-music', 'audio');
      const artworkUrl = artworkFile ? await uploadFile(artworkFile, 'portfolio-music-artwork', 'image') : null;
      
      // Read lyrics if provided
      let lyrics = null;
      if (lyricsFile) {
        lyrics = await lyricsFile.text();
      }

      await api.createMusicTrack({
        title: trackForm.title.trim(),
        artist: trackForm.author.trim(),
        album: null,
        audioUrl,
        coverUrl: artworkUrl,
        lyricsUrl: null,
        duration: null,
        genre: null,
        year: null,
        isPrivate: false,
        deletedAt: null,
      });

      toast({ title: 'Succes', description: 'Piesa a fost adăugată.' });
      resetTrackForm();
      setShowTrackDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to add track:', error);
      toast({ title: 'Eroare', description: 'Nu am putut adăuga piesa.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetTrackForm = () => {
    setTrackForm({ title: '', author: '', description: '', albumId: null });
    setAudioFile(null);
    setArtworkFile(null);
    setLyricsFile(null);
  };

  // Media player controls
  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setPlayerOpen(true);
    setIsPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play();
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Trash handlers
  const handleSoftDeleteTrack = async (id: number) => {
    try {
      await api.softDeleteMusicTrack(id);
      toast({ title: 'Șters', description: 'Piesa a fost mutată în coș.' });
      loadData();
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu am putut șterge piesa.', variant: 'destructive' });
    }
  };

  const handleRestoreTrack = async (id: number) => {
    try {
      await api.restoreMusicTrack(id);
      toast({ title: 'Restaurat', description: 'Piesa a fost restaurată.' });
      loadData();
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu am putut restaura piesa.', variant: 'destructive' });
    }
  };

  const handleRestoreFavorite = async (id: number) => {
    try {
      await api.restoreSpotifyFavorite(id);
      toast({ title: 'Restaurat', description: 'Elementul a fost restaurat.' });
      loadData();
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu am putut restaura elementul.', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      if (confirmDelete.type === 'track') {
        await api.deleteMusicTrack(confirmDelete.id);
      } else {
        await api.deleteSpotifyFavorite(confirmDelete.id);
      }
      toast({ title: 'Șters permanent', description: 'Elementul a fost șters definitiv.' });
      setConfirmDelete(null);
      loadData();
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu am putut șterge permanent.', variant: 'destructive' });
    }
  };

  const openSearchDialog = (type: SpotifyType) => {
    setSearchType(type);
    setSearchQuery('');
    setSearchResults([]);
    setSearchDialogOpen(true);
  };

  // Handle click on spotify item
  const handleSpotifyItemClick = (item: SpotifyFavorite) => {
    if (item.type === 'track' && item.previewUrl) {
      // Play preview
      if (audioRef.current) {
        audioRef.current.src = item.previewUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else if (item.spotifyUrl) {
      // Open in Spotify
      window.open(item.spotifyUrl, '_blank');
    }
  };

  const trashedCount = trashedTracks.length + trashedFavorites.length;

  // TopList component
  const TopList = ({
    title,
    icon,
    items,
    badgeLabel,
    type,
  }: {
    title: string;
    icon: React.ReactNode;
    items: SpotifyFavorite[];
    badgeLabel: string;
    type: SpotifyType;
  }) => (
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
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-2 cursor-pointer hover:bg-muted/50 transition-colors group"
              onClick={() => handleSpotifyItemClick(item)}
            >
              <Badge variant="outline" className="px-2 py-1 text-[11px] border-primary/50 text-primary">{badgeLabel}{idx + 1}</Badge>
              <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
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
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.artist || item.type}</p>
              </div>
              {type === 'track' && (
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleSpotifyItemClick(item); }}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {item.spotifyUrl && type !== 'track' && (
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100" asChild onClick={(e) => e.stopPropagation()}>
                  <a href={item.spotifyUrl} target="_blank" rel="noreferrer">
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {isAdmin && (
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={(e) => { e.stopPropagation(); removeFromTop(item); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {isAdmin && items.length < 10 && (
          <Button variant="outline" size="sm" className="w-full gap-2 mt-2" onClick={() => openSearchDialog(type)}>
            <Plus className="h-4 w-4" /> Adaugă în top
          </Button>
        )}
      </CardContent>
    </Card>
  );

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
          {/* Trash button */}
          {isAdmin && trashedCount > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowTrashDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Coș ({trashedCount})
              </Button>
            </div>
          )}

          <Tabs defaultValue="spotify" className="space-y-4">
            <TabsList className="w-full max-w-2xl grid grid-cols-3 gap-1 sm:gap-0">
              <TabsTrigger value="spotify" className="text-xs sm:text-sm px-2">Topuri</TabsTrigger>
              <TabsTrigger value="library" className="text-xs sm:text-sm px-2">Albume</TabsTrigger>
              <TabsTrigger value="tracks" className="text-xs sm:text-sm px-2">Piese</TabsTrigger>
            </TabsList>

            {/* Topuri Tab */}
            <TabsContent value="spotify" className="space-y-4 pt-2">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Se încarcă...</p>
              ) : (
                <div className={isMobile ? 'space-y-3' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                  <TopList title="Top 10 artiști" icon={<Mic2 className="h-4 w-4" />} items={topArtists} badgeLabel="AR" type="artist" />
                  <TopList title="Top 10 albume" icon={<Disc3 className="h-4 w-4" />} items={topAlbums} badgeLabel="AL" type="album" />
                  <TopList title="Top 10 piese" icon={<Headphones className="h-4 w-4" />} items={topTracks} badgeLabel="TR" type="track" />
                </div>
              )}
            </TabsContent>

            {/* Albume Tab */}
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
                    {isAdmin && (
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" /> Adaugă album
                      </Button>
                    )}
                  </div>
                  
                  <Card className="border-dashed border-border/70 bg-background/60">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <Disc3 className="h-8 w-8 text-muted-foreground" />
                      <p className="font-semibold">În curând</p>
                      <p className="text-sm text-muted-foreground">Funcționalitatea de albume proprii va fi disponibilă în curând.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Piese Tab */}
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
                    {isAdmin && (
                      <Button variant="outline" className="gap-2" onClick={() => setShowTrackDialog(true)}>
                        <Upload className="h-4 w-4" /> Adaugă piesă
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {customTracks.length === 0 ? (
                      <Card className="border-dashed border-border/70 bg-background/60">
                        <CardContent className="p-4 flex flex-col items-start gap-2">
                          <p className="font-semibold">Nu ai încă piese</p>
                          <p className="text-sm text-muted-foreground">Încarcă audio, artwork și versuri.</p>
                          {isAdmin && (
                            <Button size="sm" onClick={() => setShowTrackDialog(true)} className="gap-2">
                              <Upload className="h-4 w-4" /> Adaugă piesă
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      customTracks.map((track) => (
                        <Card key={track.id} className="border-border/60 bg-background/80 shadow-sm group">
                          <CardContent className="p-3 space-y-3">
                            <div className="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
                              <div 
                                className="h-24 w-full sm:w-24 sm:h-24 rounded-md overflow-hidden bg-muted flex-shrink-0 shadow-inner cursor-pointer"
                                onClick={() => playTrack(track)}
                              >
                                {track.coverUrl ? (
                                  <img
                                    src={track.coverUrl}
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
                                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                    {track.album && (
                                      <p className="text-[11px] text-muted-foreground">Album: {track.album}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => playTrack(track)}>
                                      <Play className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" asChild>
                                      <a href={track.audioUrl} download title="Descarcă piesa">
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                    {isAdmin && (
                                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleSoftDeleteTrack(track.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-[width] duration-150"
                                      style={{ width: `${currentTrack?.id === track.id ? progress : 0}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>{currentTrack?.id === track.id && isPlaying ? 'În redare' : 'Ready'}</span>
                                    <span className="uppercase tracking-wide">Hi-Fi</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Caută pe Spotify</DialogTitle>
            <DialogDescription>
              Caută {searchType === 'artist' ? 'artiști' : searchType === 'album' ? 'albume' : 'piese'} și adaugă în top 10
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Caută ${searchType === 'artist' ? 'artist' : searchType === 'album' ? 'album' : 'piesă'}...`}
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searching && <p className="text-center text-muted-foreground py-4">Se caută...</p>}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-center text-muted-foreground py-4">Niciun rezultat găsit.</p>
              )}
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => addToTop(item)}
                >
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <Library className="h-5 w-5 m-auto text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.artist && <p className="text-sm text-muted-foreground truncate">{item.artist}</p>}
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Upload Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={(open) => { if (!open) resetTrackForm(); setShowTrackDialog(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adaugă piesă proprie</DialogTitle>
            <DialogDescription>Încarcă o piesă cu artwork și versuri</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titlu *</Label>
                <Input
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  placeholder="Titlu piesă"
                />
              </div>
              <div className="space-y-2">
                <Label>Artist *</Label>
                <Input
                  value={trackForm.author}
                  onChange={(e) => setTrackForm({ ...trackForm, author: e.target.value })}
                  placeholder="Nume artist"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fișier audio * (MP3, WAV, etc.)</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
              {audioFile && <p className="text-xs text-muted-foreground">{audioFile.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Artwork (imagine, GIF sau video)</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
              />
              {artworkFile && <p className="text-xs text-muted-foreground">{artworkFile.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Versuri (fișier text)</Label>
              <Input
                type="file"
                accept=".txt,.lrc"
                onChange={(e) => setLyricsFile(e.target.files?.[0] || null)}
              />
              {lyricsFile && <p className="text-xs text-muted-foreground">{lyricsFile.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Descriere (opțional)</Label>
              <Textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                placeholder="Descriere piesă..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackDialog(false)}>Anulează</Button>
            <Button onClick={handleAddTrack} disabled={uploading}>
              {uploading ? 'Se încarcă...' : 'Adaugă piesă'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Player Dialog */}
      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent className="max-w-md">
          {currentTrack && (
            <div className="space-y-6">
              {/* Artwork */}
              <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-muted shadow-xl">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold">{currentTrack.title}</h3>
                <p className="text-muted-foreground">{currentTrack.artist}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime((progress / 100) * duration)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button size="icon" variant="ghost" onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button size="icon" className="h-14 w-14 rounded-full" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                </Button>
                <Button size="icon" variant="ghost">
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3">
                <Button size="icon" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) / 100;
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                    if (v > 0) setIsMuted(false);
                  }}
                  className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trash Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coș de gunoi ({trashedTracks.length + trashedFavorites.length})</DialogTitle>
            <DialogDescription>
              Restaurează sau șterge permanent elementele.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {trashedTracks.length === 0 && trashedFavorites.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Coșul este gol.</p>
            ) : (
              <>
                {trashedTracks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Music2 className="h-4 w-4" /> Piese ({trashedTracks.length})
                    </p>
                    {trashedTracks.map((track) => (
                      <div
                        key={`track-${track.id}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                      >
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 rounded bg-muted">
                            <Music2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{track.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreTrack(track.id)}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Restaurează
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete({ type: 'track', id: track.id })}>
                            <Trash2 className="w-4 h-4 mr-1" /> Șterge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {trashedFavorites.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Disc3 className="h-4 w-4" /> Favorite Spotify ({trashedFavorites.length})
                    </p>
                    {trashedFavorites.map((fav) => (
                      <div
                        key={`fav-${fav.id}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                      >
                        {fav.imageUrl ? (
                          <img src={fav.imageUrl} alt={fav.name} className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 rounded bg-muted">
                            <Disc3 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{fav.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{fav.type}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleRestoreFavorite(fav.id)}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Restaurează
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete({ type: 'favorite', id: fav.id })}>
                            <Trash2 className="w-4 h-4 mr-1" /> Șterge
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergere permanentă</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi permanent acest element? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground">
              Șterge permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
