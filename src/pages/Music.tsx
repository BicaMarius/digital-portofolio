import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { 
  Music2, Disc3, Mic2, Play, Pause, Download, Search, Plus, Upload, 
  Headphones, Library, ListMusic, Trash2, RotateCcw, X, 
  SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, 
  ChevronUp, ChevronDown, ExternalLink, Loader2, FileText, User, Music as MusicIcon,
  MoreVertical, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as api from '@/lib/api';
import type { MusicTrack, SpotifyFavorite } from '@shared/schema';
import type { SpotifySearchResult } from '@/lib/api';

// Fallback image
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="%2394a3b8"><rect x="4" y="4" width="72" height="72" rx="10" fill="%23f8fafc"/><path d="M26 54c3.5-4.5 7-7 11.5-7 4.5 0 8 2.5 11.5 7" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="%2394a3b8"/><circle cx="48" cy="32" r="4" fill="%2394a3b8"/></svg>';

type SpotifyType = 'artist' | 'album' | 'track';

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
  const [spotifyConfigured, setSpotifyConfigured] = useState(false);

  // Stats state
  const [viewMode, setViewMode] = useState<'personal' | 'stats'>('personal');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [statsTimeRange, setStatsTimeRange] = useState<'short_term' | 'medium_term' | 'long_term'>('medium_term');
  const [statsTopArtists, setStatsTopArtists] = useState<api.SpotifyTopItem[]>([]);
  const [statsTopTracks, setStatsTopTracks] = useState<api.SpotifyTopItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState<SpotifyType>('artist');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Track upload dialog state
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [trackForm, setTrackForm] = useState({
    title: '',
    author: '',
    description: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const miniProgressBarRef = useRef<HTMLDivElement | null>(null);

  // Trash dialog state
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'track' | 'favorite'; id: number } | null>(null);

  // Check Spotify status and auth callback
  useEffect(() => {
    api.getSpotifyStatus()
      .then(status => setSpotifyConfigured(status.configured))
      .catch(() => setSpotifyConfigured(false));
    
    // Check if user is already authenticated
    api.getSpotifyAuthStatus()
      .then(status => {
        if (status.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => setIsAuthenticated(false));
    
    // Check for auth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      setIsAuthenticated(true);
      setViewMode('stats');
      toast({ title: 'Conectat cu succes!', description: 'Acum poți vedea statisticile tale Spotify.' });
      // Clean URL
      window.history.replaceState({}, '', '/#/music');
    } else if (urlParams.get('auth') === 'error') {
      toast({ title: 'Eroare la autentificare', description: 'Nu am putut conecta contul Spotify.', variant: 'destructive' });
      window.history.replaceState({}, '', '/#/music');
    }
  }, [toast]);

  // Load stats when switching to stats view
  useEffect(() => {
    if (viewMode === 'stats' && isAuthenticated) {
      loadStats();
    }
  }, [viewMode, isAuthenticated, statsTimeRange]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const [artists, tracks] = await Promise.all([
        api.getSpotifyUserTopArtists(statsTimeRange),
        api.getSpotifyUserTopTracks(statsTimeRange),
      ]);
      setStatsTopArtists(artists);
      setStatsTopTracks(tracks);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      if (error?.message?.includes('401') || error?.message?.includes('not authenticated')) {
        setIsAuthenticated(false);
        toast({ title: 'Sesiune expirată', description: 'Te rugăm să te autentifici din nou.', variant: 'destructive' });
      } else {
        toast({ title: 'Eroare', description: 'Nu am putut încărca statisticile.', variant: 'destructive' });
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      const { url } = await api.getSpotifyAuthUrl();
      window.location.href = url;
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu am putut genera link-ul de autentificare.', variant: 'destructive' });
    }
  };

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
      
      // Separate favorites by type and sort by rank
      setTopArtists(favs.filter(f => f.type === 'artist' && f.listType === 'top10').sort((a, b) => (a.rank || 0) - (b.rank || 0)));
      setTopAlbums(favs.filter(f => f.type === 'album' && f.listType === 'top10').sort((a, b) => (a.rank || 0) - (b.rank || 0)));
      setTopTracks(favs.filter(f => f.type === 'track' && f.listType === 'top10').sort((a, b) => (a.rank || 0) - (b.rank || 0)));
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

  // Spotify search handler - uses real API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchSpotify(searchType, searchQuery, 10);
      setSearchResults(results);
    } catch (error: any) {
      console.error('Search failed:', error);
      if (error?.message?.includes('503') || error?.message?.includes('not configured')) {
        toast({ title: 'Spotify nu e configurat', description: 'Adaugă SPOTIFY_CLIENT_ID și SPOTIFY_CLIENT_SECRET.', variant: 'destructive' });
      } else {
        toast({ title: 'Eroare la căutare', description: 'Nu am putut căuta pe Spotify.', variant: 'destructive' });
      }
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
        albumName: item.albumName || null,
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

  // Add or update custom track
  const handleAddTrack = async () => {
    if (!trackForm.title.trim() || !trackForm.author.trim()) {
      toast({ title: 'Eroare', description: 'Titlu și autor sunt obligatorii.', variant: 'destructive' });
      return;
    }

    // Audio is required only for new tracks
    if (!editingTrack && !audioFile) {
      toast({ title: 'Eroare', description: 'Fișier audio este obligatoriu.', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      
      // Upload files if provided
      const audioUrl = audioFile 
        ? await uploadFile(audioFile, 'portfolio-music', 'audio') 
        : (editingTrack?.audioUrl || '');
      const artworkUrl = artworkFile 
        ? await uploadFile(artworkFile, 'portfolio-music-artwork', 'image') 
        : (editingTrack?.coverUrl || null);

      if (editingTrack) {
        // Update existing track
        await api.updateMusicTrack(editingTrack.id, {
          title: trackForm.title.trim(),
          artist: trackForm.author.trim(),
          album: trackForm.description.trim() || null,
          ...(audioFile && { audioUrl }),
          ...(artworkFile && { coverUrl: artworkUrl }),
        });
        toast({ title: 'Succes', description: 'Piesa a fost actualizată.' });
      } else {
        // Create new track
        await api.createMusicTrack({
          title: trackForm.title.trim(),
          artist: trackForm.author.trim(),
          album: trackForm.description.trim() || null,
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
      }

      resetTrackForm();
      setShowTrackDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save track:', error);
      toast({ title: 'Eroare', description: 'Nu am putut salva piesa.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetTrackForm = () => {
    setTrackForm({ title: '', author: '', description: '' });
    setAudioFile(null);
    setArtworkFile(null);
    setLyricsFile(null);
    setEditingTrack(null);
  };

  const openEditTrackDialog = (track: MusicTrack) => {
    setEditingTrack(track);
    setTrackForm({
      title: track.title,
      author: track.artist,
      description: track.album || '',
    });
    setShowTrackDialog(true);
  };

  // ========== PLAYER CONTROLS ==========
  
  const playTrack = (track: MusicTrack, index?: number) => {
    if (currentTrack?.id === track.id) {
      // Toggle play/pause if same track
      togglePlayPause();
      return;
    }
    
    setCurrentTrack(track);
    setCurrentTrackIndex(index ?? customTracks.findIndex(t => t.id === track.id));
    setIsPlaying(true);
    setProgress(0);
    
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(console.error);
    }
    
    // Load lyrics if available
    if (track.lyricsUrl) {
      fetch(track.lyricsUrl)
        .then(res => res.text())
        .then(text => setLyrics(text))
        .catch(() => setLyrics(''));
    } else {
      setLyrics('');
    }
  };

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    // If no track is loaded, do nothing
    if (!currentTrack) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const playNext = useCallback(() => {
    if (customTracks.length === 0) return;
    
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * customTracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % customTracks.length;
    }
    
    const nextTrack = customTracks[nextIndex];
    setCurrentTrack(nextTrack);
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setProgress(0);
    
    if (audioRef.current) {
      audioRef.current.src = nextTrack.audioUrl;
      audioRef.current.play().catch(console.error);
    }
  }, [customTracks, currentTrackIndex, shuffle]);

  const playPrevious = () => {
    if (customTracks.length === 0) return;
    
    // If more than 3 seconds in, restart current track
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    let prevIndex: number;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * customTracks.length);
    } else {
      prevIndex = currentTrackIndex <= 0 ? customTracks.length - 1 : currentTrackIndex - 1;
    }
    
    const prevTrack = customTracks[prevIndex];
    setCurrentTrack(prevTrack);
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
    setProgress(0);
    
    if (audioRef.current) {
      audioRef.current.src = prevTrack.audioUrl;
      audioRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const v = value[0] / 100;
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleRepeat = () => {
    setRepeat(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Use requestAnimationFrame for smooth progress updates without re-renders
    let animationId: number | null = null;
    let lastStateUpdate = 0;
    const STATE_UPDATE_INTERVAL = 1000; // Update React state only once per second
    
    const updateProgressBars = () => {
      if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        
        // Update progress bar directly via ref (no re-render - smooth!)
        if (miniProgressBarRef.current) {
          miniProgressBarRef.current.style.width = `${progressPercent}%`;
        }
        
        // Update React state less frequently (for slider to stay in sync)
        const now = Date.now();
        if (now - lastStateUpdate > STATE_UPDATE_INTERVAL) {
          lastStateUpdate = now;
          setProgress(progressPercent);
        }
      }
    };

    const onTimeUpdate = () => {
      // Cancel previous animation frame
      if (animationId) cancelAnimationFrame(animationId);
      // Schedule update on next frame for smooth animation
      animationId = requestAnimationFrame(updateProgressBars);
    };
    
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeat === 'all' || currentTrackIndex < customTracks.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [repeat, currentTrackIndex, customTracks.length, playNext]);

  // Trash handlers
  const handleSoftDeleteTrack = async (id: number) => {
    try {
      await api.softDeleteMusicTrack(id);
      toast({ title: 'Șters', description: 'Piesa a fost mutată în coș.' });
      if (currentTrack?.id === id) {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
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

  const trashedCount = trashedTracks.length + trashedFavorites.length;
  const playerVisible = currentTrack !== null;

  // TopList component
  const TopList = ({
    title,
    icon,
    items,
    type,
  }: {
    title: string;
    icon: React.ReactNode;
    items: SpotifyFavorite[];
    badgeLabel?: string;
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
              onClick={() => item.spotifyUrl && window.open(item.spotifyUrl, '_blank')}
            >
              <Badge variant="outline" className="px-2 py-1 text-[11px] border-primary/50 text-primary font-bold min-w-[32px] justify-center">
                {idx + 1}
              </Badge>
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
                  <div className="h-full w-full flex items-center justify-center">
                    <Library className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.artist || item.type}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.spotifyUrl && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); window.open(item.spotifyUrl!, '_blank'); }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-destructive hover:text-destructive" 
                    onClick={(e) => { e.stopPropagation(); removeFromTop(item); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {isAdmin && items.length < 10 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 mt-2" 
            onClick={() => openSearchDialog(type)}
            disabled={!spotifyConfigured}
          >
            <Plus className="h-4 w-4" /> 
            {spotifyConfigured ? 'Adaugă din Spotify' : 'Spotify neconfigurat'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // ========== PLAYER UI COMPONENTS ==========
  
  // Mini Player (bottom bar)
  const MiniPlayer = () => (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl",
        "transform transition-transform duration-300 ease-out",
        playerVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Progress bar at top of mini player */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          ref={miniProgressBarRef}
          className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
          style={{ width: `${progress}%`, transition: 'none' }}
        />
      </div>
      
      <div className="flex items-center gap-3 p-3 pt-4">
        {/* Artwork */}
        <div 
          className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer shadow-lg"
          onClick={() => setIsExpanded(true)}
        >
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Music2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(true)}>
          <p className="font-semibold truncate text-sm">{currentTrack?.title || 'Nicio piesă'}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack?.artist}</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Volume control (desktop) */}
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-16 lg:w-20"
              />
            </div>
          )}

          <Button size="icon" variant="ghost" className="h-10 w-10" onClick={playPrevious}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-12 w-12 rounded-full" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10" onClick={playNext}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Expand & Close buttons */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => setIsExpanded(true)}>
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-10 w-10 text-muted-foreground hover:text-foreground" 
            onClick={() => {
              setCurrentTrack(null);
              setIsPlaying(false);
              if (audioRef.current) {
                audioRef.current.pause();
              }
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Fullscreen Player
  const FullscreenPlayer = () => (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-background",
        "transform transition-transform duration-300 ease-out",
        isExpanded ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Button size="icon" variant="ghost" onClick={() => setIsExpanded(false)}>
            <ChevronDown className="h-5 w-5" />
          </Button>
          <p className="text-sm font-medium text-muted-foreground">În redare</p>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setShowLyrics(!showLyrics)}
            className={cn(showLyrics && "text-primary")}
          >
            <FileText className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className={cn(
          "flex-1 overflow-hidden",
          showLyrics && !isMobile ? "grid grid-cols-2 gap-6 p-6" : "flex flex-col p-6"
        )}>
          {/* Artwork section */}
          <div className={cn(
            "flex flex-col items-center justify-center",
            showLyrics && !isMobile ? "" : "flex-1"
          )}>
            {/* Artwork container with proper aspect ratio handling */}
            <div className="relative w-full max-w-sm aspect-square mx-auto">
              <div className="absolute inset-0 rounded-2xl overflow-hidden bg-muted shadow-2xl">
                {currentTrack?.coverUrl ? (
                  currentTrack.coverUrl.includes('.mp4') || currentTrack.coverUrl.includes('.webm') ? (
                    <video
                      src={currentTrack.coverUrl}
                      className="w-full h-full object-contain bg-black"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      className="w-full h-full object-contain"
                      style={{ backgroundColor: 'var(--muted)' }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Track info */}
            <div className="text-center mt-6 w-full max-w-sm">
              <h2 className="text-2xl font-bold truncate">{currentTrack?.title}</h2>
              <p className="text-lg text-muted-foreground truncate">{currentTrack?.artist}</p>
              {currentTrack?.album && (
                <p className="text-sm text-muted-foreground/70 truncate mt-1">{currentTrack.album}</p>
              )}
            </div>
          </div>

          {/* Lyrics section */}
          {showLyrics && (
            <div className={cn(
              "bg-muted/30 rounded-xl p-4",
              isMobile ? "flex-1 mt-4" : ""
            )}>
              <ScrollArea className="h-full">
                {lyrics ? (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{lyrics}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Nu sunt versuri disponibile</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Player controls section */}
        <div className="p-6 pt-2 space-y-4 border-t border-border/50">
          {/* Progress */}
          <div className="space-y-2">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime((progress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls - symmetric layout */}
          <div className="flex items-center justify-center">
            {/* Mobile: all controls in one row, symmetric */}
            {isMobile ? (
              <div className="flex items-center justify-center gap-3">
                {/* Left 3 buttons */}
                <Button size="icon" variant="ghost" className="h-10 w-10" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShuffle(!shuffle)}
                  className={cn("h-10 w-10", shuffle && "text-primary")}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10" onClick={playPrevious}>
                  <SkipBack className="h-5 w-5" />
                </Button>

                {/* Center play button */}
                <Button size="icon" className="h-14 w-14 rounded-full mx-2" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
                </Button>

                {/* Right 3 buttons */}
                <Button size="icon" variant="ghost" className="h-10 w-10" onClick={playNext}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={toggleRepeat}
                  className={cn("h-10 w-10 relative", repeat !== 'off' && "text-primary")}
                >
                  <Repeat className="h-5 w-5" />
                  {repeat === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={cn("h-10 w-10", showLyrics && "text-primary")}
                >
                  <FileText className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              /* Desktop layout */
              <div className="flex items-center justify-between w-full">
                {/* Left spacer */}
                <div className="w-32" />

                {/* Center controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setShuffle(!shuffle)}
                    className={cn("h-10 w-10", shuffle && "text-primary")}
                  >
                    <Shuffle className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12" onClick={playPrevious}>
                    <SkipBack className="h-6 w-6" />
                  </Button>
                  <Button size="icon" className="h-16 w-16 rounded-full" onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-12 w-12" onClick={playNext}>
                    <SkipForward className="h-6 w-6" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={toggleRepeat}
                    className={cn("h-10 w-10 relative", repeat !== 'off' && "text-primary")}
                  >
                    <Repeat className="h-5 w-5" />
                    {repeat === 'one' && <span className="absolute text-[10px] font-bold">1</span>}
                  </Button>
                </div>

                {/* Right side - Volume only */}
                <div className="flex items-center gap-2 w-32 justify-end">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Muzică</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Topuri Spotify și biblioteca personală cu player modern.
          </p>
        </div>
      </section>

      <section className="page-content-section">
        <div className={cn("page-container space-y-6", playerVisible && "pb-24")}>
          <Tabs defaultValue="spotify" className="space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
              <TabsList className="w-full max-w-2xl grid grid-cols-3 gap-1 sm:gap-0">
                <TabsTrigger value="spotify" className="text-xs sm:text-sm px-2">Topuri</TabsTrigger>
                <TabsTrigger value="library" className="text-xs sm:text-sm px-2">Albume</TabsTrigger>
                <TabsTrigger value="tracks" className="text-xs sm:text-sm px-2">Piese</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {/* Trash button */}
                {isAdmin && trashedCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowTrashDialog(true)} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Coș</span> ({trashedCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Topuri Tab */}
            <TabsContent value="spotify" className="space-y-4 pt-2">
              {/* Personal/Stats Toggle - only in Topuri tab */}
              <div className="flex justify-end">
                <div className="relative inline-flex items-center h-9 rounded-full border border-border bg-muted/30 p-0.5">
                  <button
                    onClick={() => setViewMode('personal')}
                    className={cn(
                      "relative z-10 text-xs font-medium transition-all px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap",
                      viewMode === 'personal' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Personal
                  </button>
                  <button
                    onClick={() => setViewMode('stats')}
                    className={cn(
                      "relative z-10 text-xs font-medium transition-all px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap",
                      viewMode === 'stats' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Stats
                  </button>
                </div>
              </div>

              {!spotifyConfigured && isAdmin && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="text-amber-500 mt-0.5">⚠️</div>
                    <div>
                      <p className="font-semibold text-amber-500">Spotify API neconfigurat</p>
                      <p className="text-sm text-muted-foreground">
                        Pentru a căuta și adăuga artiști/albume/piese din Spotify, adaugă variabilele de mediu:
                        <code className="mx-1 px-1 bg-muted rounded">SPOTIFY_CLIENT_ID</code> și 
                        <code className="mx-1 px-1 bg-muted rounded">SPOTIFY_CLIENT_SECRET</code>.
                        <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="ml-2 text-primary underline">
                          Spotify Developer Dashboard →
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : viewMode === 'stats' ? (
                // Stats view
                <div className="space-y-6">
                  {!isAuthenticated ? (
                    <Card className="border-border/60 bg-muted/20">
                      <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Music2 className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Conectează-te cu Spotify</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Vezi top 10 piese/artiști calculați de Spotify, timp de ascultare pe ani și genuri preferate.
                          </p>
                        </div>
                        <Button onClick={handleSpotifyLogin} className="gap-2">
                          <Music2 className="h-4 w-4" />
                          Conectează cu Spotify
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Time range selector */}
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant={statsTimeRange === 'short_term' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsTimeRange('short_term')}
                        >
                          Ultima lună
                        </Button>
                        <Button
                          variant={statsTimeRange === 'medium_term' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsTimeRange('medium_term')}
                        >
                          Ultimele 6 luni
                        </Button>
                        <Button
                          variant={statsTimeRange === 'long_term' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsTimeRange('long_term')}
                        >
                          Toți anii
                        </Button>
                      </div>

                      {loadingStats ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Top Artists */}
                          <Card className="border-border/60 bg-muted/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" /> Top 10 Artiști
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">Calculat de Spotify</p>
                            </CardHeader>
                            <CardContent>
                              {statsTopArtists.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">Nu există date</p>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                  {statsTopArtists.slice(0, 10).map((item, index) => (
                                    <div key={item.id} className="group relative">
                                      <a
                                        href={item.spotifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
                                      >
                                        <div className="aspect-square relative">
                                          {item.imageUrl ? (
                                            <img 
                                              src={item.imageUrl} 
                                              alt={item.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                              <User className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                          )}
                                          {/* Rank badge */}
                                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                            #{index + 1}
                                          </div>
                                        </div>
                                        <div className="p-2 bg-background">
                                          <p className="font-medium text-sm truncate">{item.name}</p>
                                        </div>
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Top Tracks */}
                          <Card className="border-border/60 bg-muted/20">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2">
                                <MusicIcon className="h-4 w-4" /> Top 10 Piese
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">Calculat de Spotify</p>
                            </CardHeader>
                            <CardContent>
                              {statsTopTracks.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">Nu există date</p>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                  {statsTopTracks.slice(0, 10).map((item, index) => (
                                    <div key={item.id} className="group relative">
                                      <a
                                        href={item.spotifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
                                      >
                                        <div className="aspect-square relative">
                                          {item.imageUrl ? (
                                            <img 
                                              src={item.imageUrl} 
                                              alt={item.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = FALLBACK_IMAGE;
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                              <MusicIcon className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                          )}
                                          {/* Rank badge */}
                                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                                            #{index + 1}
                                          </div>
                                        </div>
                                        <div className="p-2 bg-background">
                                          <p className="font-medium text-sm truncate">{item.name}</p>
                                          {item.artist && (
                                            <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                                          )}
                                        </div>
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className={isMobile ? 'space-y-3' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                  <TopList title="Top 10 artiști" icon={<Mic2 className="h-4 w-4" />} items={topArtists} type="artist" />
                  <TopList title="Top 10 albume" icon={<Disc3 className="h-4 w-4" />} items={topAlbums} type="album" />
                  <TopList title="Top 10 piese" icon={<Headphones className="h-4 w-4" />} items={topTracks} type="track" />
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4" /> Piese proprii
                    </CardTitle>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTrackDialog(true)}>
                        <Upload className="h-4 w-4" /> Adaugă piesă
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {customTracks.length === 0 ? (
                    <Card className="border-dashed border-border/70 bg-background/60">
                      <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                        <Music2 className="h-8 w-8 text-muted-foreground" />
                        <p className="font-semibold">Nu ai încă piese</p>
                        <p className="text-sm text-muted-foreground">Încarcă audio, artwork și versuri.</p>
                        {isAdmin && (
                          <Button size="sm" onClick={() => setShowTrackDialog(true)} className="gap-2 mt-2">
                            <Upload className="h-4 w-4" /> Adaugă piesă
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-1">
                      {customTracks.map((track, index) => (
                        <div 
                          key={track.id} 
                          className={cn(
                            "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors cursor-pointer group",
                            currentTrack?.id === track.id 
                              ? "bg-primary/10 border border-primary/30" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => playTrack(track, index)}
                        >
                          {/* Track number / Play indicator - hidden on mobile */}
                          <div className="hidden sm:flex w-8 h-8 items-center justify-center text-sm text-muted-foreground">
                            {currentTrack?.id === track.id && isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
                                <span className="w-0.5 h-4 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                                <span className="w-0.5 h-2 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.4s' }} />
                              </div>
                            ) : (
                              <span className="group-hover:hidden">{index + 1}</span>
                            )}
                            <Play className="h-4 w-4 hidden group-hover:block" />
                          </div>

                          {/* Artwork */}
                          <div className="h-10 w-10 sm:h-10 sm:w-10 rounded overflow-hidden bg-muted flex-shrink-0">
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
                              <div className="h-full w-full flex items-center justify-center">
                                <Music2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Track info - more space on mobile */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium truncate text-sm",
                              currentTrack?.id === track.id && "text-primary"
                            )}>
                              {track.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>

                          {/* Duration - always visible */}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {track.duration ? formatTime(track.duration) : '--:--'}
                          </span>

                          {/* Options menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 flex-shrink-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {isAdmin && (
                                <DropdownMenuItem onClick={() => openEditTrackDialog(track)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editează
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <a 
                                  href={track.audioUrl} 
                                  download={`${track.title}.mp3`}
                                  className="flex items-center"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Descarcă
                                </a>
                              </DropdownMenuItem>
                              {isAdmin && (
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleSoftDeleteTrack(track.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Șterge
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" preload="metadata" />

      {/* Mini Player */}
      <MiniPlayer />

      {/* Fullscreen Player */}
      <FullscreenPlayer />

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Caută pe Spotify
            </DialogTitle>
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
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {searching && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching && searchResults.length === 0 && searchQuery && (
                  <p className="text-center text-muted-foreground py-8">Niciun rezultat găsit.</p>
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
                        <div className="h-full w-full flex items-center justify-center">
                          <Library className="h-5 w-5 text-muted-foreground" />
                        </div>
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
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Upload/Edit Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={(open) => { if (!open) resetTrackForm(); setShowTrackDialog(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTrack ? 'Editează piesa' : 'Adaugă piesă proprie'}</DialogTitle>
            <DialogDescription>
              {editingTrack ? 'Modifică detaliile piesei sau înlocuiește fișierele' : 'Încarcă o piesă cu artwork și versuri'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Current artwork preview when editing */}
          {editingTrack && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                {editingTrack.coverUrl ? (
                  <img
                    src={editingTrack.coverUrl}
                    alt={editingTrack.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Music2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{editingTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{editingTrack.artist}</p>
              </div>
            </div>
          )}
          
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
              <Label>Fișier audio {editingTrack ? '(înlocuiește)' : '*'} (MP3, WAV, etc.)</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
              {audioFile && <p className="text-xs text-muted-foreground">{audioFile.name}</p>}
              {editingTrack && !audioFile && (
                <p className="text-xs text-muted-foreground">Păstrează fișierul audio existent</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Artwork {editingTrack ? '(înlocuiește)' : ''} (imagine, GIF sau video)</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
              />
              {artworkFile && <p className="text-xs text-muted-foreground">{artworkFile.name}</p>}
              {editingTrack && !artworkFile && editingTrack.coverUrl && (
                <p className="text-xs text-muted-foreground">Păstrează artwork-ul existent</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Versuri {editingTrack ? '(înlocuiește)' : ''} (fișier text)</Label>
              <Input
                type="file"
                accept=".txt,.lrc"
                onChange={(e) => setLyricsFile(e.target.files?.[0] || null)}
              />
              {lyricsFile && <p className="text-xs text-muted-foreground">{lyricsFile.name}</p>}
              {editingTrack && !lyricsFile && editingTrack.lyricsUrl && (
                <p className="text-xs text-muted-foreground">Păstrează versurile existente</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackDialog(false)}>Anulează</Button>
            <Button onClick={handleAddTrack} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                editingTrack ? 'Salvează modificările' : 'Adaugă piesă'
              )}
            </Button>
          </DialogFooter>
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
