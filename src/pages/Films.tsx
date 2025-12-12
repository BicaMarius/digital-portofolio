import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/contexts/AdminContext';
import { Clapperboard, Plus, Film, Search, CheckCircle2, Undo2, Eye, Star, ArrowUpDown, Trash2, RotateCcw, Pencil, Loader2, Trash, Filter, X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFilms, createFilm, updateFilm, softDeleteFilm as apiSoftDeleteFilm, restoreFilm as apiRestoreFilm, deleteFilm, getTrashedFilms, getFilmGenres, createFilmGenre, updateFilmGenre, deleteFilmGenre, type FilmGenre } from '@/lib/api';
import type { FilmItem as ApiFilmItem } from '@shared/schema';

// Local interface for UI compatibility
interface LocalFilmItem {
  id: number;
  title: string;
  genres: string[];  // Changed to array
  year?: number;
  status: 'todo' | 'watched';
  rating?: number;
  category?: string;
  notes?: string;
}

// Convert API FilmItem to local format
function toLocalFilm(f: ApiFilmItem): LocalFilmItem {
  return {
    id: f.id,
    title: f.title,
    genres: f.genre && f.genre.length > 0 ? f.genre : [],
    year: f.year ? parseInt(f.year) : undefined,
    status: f.status === 'watched' ? 'watched' : 'todo',
    rating: f.rating ?? undefined,
    category: f.director ?? undefined, // Using director field as category for now
    notes: f.notes ?? undefined,
  };
}

// Convert local format to API format
function toApiFilm(f: Omit<LocalFilmItem, 'id'>): Omit<ApiFilmItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: f.title,
    genre: f.genres,  // Now directly passing array
    year: f.year ? String(f.year) : null,
    status: f.status === 'watched' ? 'watched' : 'to-watch',
    rating: f.rating ?? null,
    director: f.category ?? null, // Using director field as category
    notes: f.notes ?? null,
    posterUrl: null,
    tmdbId: null,
    watchedDate: null,
    runtime: null,
    isPrivate: false,
    deletedAt: null,
  };
}

// Content type options
const contentTypeOptions = [
  { value: 'Film', label: 'Film' },
  { value: 'Serial', label: 'Serial' },
  { value: 'Anime', label: 'Anime' },
  { value: 'Desen animat', label: 'Desen animat' },
];

const sortOptions: { value: 'none' | 'name' | 'genre' | 'category' | 'year' | 'rating'; label: string }[] = [
  { value: 'none', label: 'Fără sortare' },
  { value: 'name', label: 'Nume' },
  { value: 'genre', label: 'Gen' },
  { value: 'category', label: 'Tip' },
  { value: 'year', label: 'An' },
  { value: 'rating', label: 'Rating (văzute)' },
];

export default function Films() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const [films, setFilms] = useState<LocalFilmItem[]>([]);
  const [genres, setGenres] = useState<FilmGenre[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'none' | 'name' | 'genre' | 'category' | 'year' | 'rating'>('none');
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<LocalFilmItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', genres: [] as string[], year: '' as number | string | '', status: 'todo' as LocalFilmItem['status'], rating: '', category: '', notes: '' });
  const [trashed, setTrashed] = useState<LocalFilmItem[]>([]);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  // Filter state
  const [filterYears, setFilterYears] = useState<string[]>([]);
  const [filterGenres, setFilterGenres] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterRatingMin, setFilterRatingMin] = useState<string>('');
  const [filterRatingMax, setFilterRatingMax] = useState<string>('');
  // Swipe state: tracks current X offset for each film being swiped
  const [swipeOffset, setSwipeOffset] = useState<Record<number, number>>({});
  const [swipeCompleted, setSwipeCompleted] = useState<Record<number, 'left' | 'right' | null>>({});
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchId = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  
  const SWIPE_THRESHOLD = 100; // Pixels needed to trigger action
  const SWIPE_MAX = 150; // Max visual offset

  // Load data from cloud
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [filmsData, trashedData, genresData] = await Promise.all([
        getFilms(),
        getTrashedFilms(),
        getFilmGenres()
      ]);
      setFilms(filmsData.map(toLocalFilm));
      setTrashed(trashedData.map(toLocalFilm));
      setGenres(genresData);
    } catch (error) {
      console.error('Error loading films:', error);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca filmele.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Genre management handlers
  const handleAddGenre = async (name: string) => {
    try {
      const newGenre = await createFilmGenre(name);
      setGenres(prev => [...prev, newGenre].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Gen adăugat', description: `${name} a fost adăugat.` });
    } catch (error) {
      console.error('Error adding genre:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga genul.', variant: 'destructive' });
    }
  };

  const handleEditGenre = async (oldName: string, newName: string) => {
    const genre = genres.find(g => g.name === oldName);
    if (!genre) return;
    try {
      await updateFilmGenre(genre.id, newName);
      setGenres(prev => prev.map(g => g.id === genre.id ? { ...g, name: newName } : g).sort((a, b) => a.name.localeCompare(b.name)));
      // Update films that had this genre
      setFilms(prev => prev.map(f => ({
        ...f,
        genres: f.genres.map(g => g === oldName ? newName : g)
      })));
      toast({ title: 'Gen actualizat', description: `${oldName} → ${newName}` });
    } catch (error) {
      console.error('Error updating genre:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut actualiza genul.', variant: 'destructive' });
    }
  };

  const handleDeleteGenre = async (name: string) => {
    const genre = genres.find(g => g.name === name);
    if (!genre) return;
    try {
      await deleteFilmGenre(genre.id);
      setGenres(prev => prev.filter(g => g.id !== genre.id));
      toast({ title: 'Gen șters', description: `${name} a fost șters.` });
    } catch (error) {
      console.error('Error deleting genre:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge genul.', variant: 'destructive' });
    }
  };

  const genreOptions = useMemo(() => 
    genres.map(g => ({ value: g.name, label: g.name })),
    [genres]
  );

  // Compute available filter options from films data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    films.forEach(f => { if (f.year) years.add(String(f.year)); });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Descending
  }, [films]);

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    films.forEach(f => f.genres.forEach(g => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [films]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    films.forEach(f => { if (f.category) cats.add(f.category); });
    return Array.from(cats).sort();
  }, [films]);

  // Check if any filter is active
  const hasActiveFilters = filterYears.length > 0 || filterGenres.length > 0 || filterCategories.length > 0 || filterRatingMin !== '' || filterRatingMax !== '';

  // Clear all filters
  const clearFilters = () => {
    setFilterYears([]);
    setFilterGenres([]);
    setFilterCategories([]);
    setFilterRatingMin('');
    setFilterRatingMax('');
  };

  const filteredFilms = useMemo(() => {
    const query = search.trim().toLowerCase();
    let copy = [...films];
    
    // Apply filters
    if (filterYears.length > 0) {
      copy = copy.filter(f => f.year && filterYears.includes(String(f.year)));
    }
    if (filterGenres.length > 0) {
      copy = copy.filter(f => f.genres.some(g => filterGenres.includes(g)));
    }
    if (filterCategories.length > 0) {
      copy = copy.filter(f => f.category && filterCategories.includes(f.category));
    }
    if (filterRatingMin !== '') {
      const min = Number(filterRatingMin);
      copy = copy.filter(f => f.rating !== undefined && f.rating >= min);
    }
    if (filterRatingMax !== '') {
      const max = Number(filterRatingMax);
      copy = copy.filter(f => f.rating !== undefined && f.rating <= max);
    }
    
    // Apply sorting
    // Default sort by ID (addition order) - oldest first, newest last
    if (sortBy === 'none') copy.sort((a, b) => a.id - b.id);
    if (sortBy === 'name') copy.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'genre') copy.sort((a, b) => (a.genres[0] || '').localeCompare(b.genres[0] || ''));
    if (sortBy === 'category') copy.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    if (sortBy === 'year') copy.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    if (sortBy === 'rating') copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    // Apply search
    if (!query) return copy;
    return copy.filter((film) =>
      [film.title, ...film.genres, film.category, film.notes]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query)),
    );
  }, [films, search, sortBy, filterYears, filterGenres, filterCategories, filterRatingMin, filterRatingMax]);

  const toWatch = filteredFilms.filter(f => f.status === 'todo');
  const watched = filteredFilms.filter(f => f.status === 'watched');

  const handleDialogOpenChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setEditingId(null);
      setForm({ title: '', genres: [], year: '', status: 'todo', rating: '', category: '', notes: '' });
    }
  };

  const openAddForStatus = (status: LocalFilmItem['status']) => {
    setEditingId(null);
    setForm({ title: '', genres: [], year: '', status, rating: '', category: '', notes: '' });
    handleDialogOpenChange(true);
  };

  const submitFilm = async () => {
    if (!form.title.trim()) return;
    const baseFilm: Omit<LocalFilmItem, 'id'> = {
      title: form.title.trim(),
      genres: form.genres.length > 0 ? form.genres : [],
      year: form.year ? Number(form.year) : undefined,
      status: form.status,
      rating: form.rating ? Number(form.rating) : undefined,
      category: form.category.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editingId) {
        const updated = await updateFilm(editingId, toApiFilm(baseFilm));
        setFilms(prev => prev.map(f => f.id === editingId ? toLocalFilm(updated) : f));
        toast({ title: 'Salvat', description: `${baseFilm.title} a fost actualizat.` });
      } else {
        const created = await createFilm(toApiFilm(baseFilm));
        setFilms(prev => [...prev, toLocalFilm(created)]);
        toast({ title: 'Adăugat', description: `${baseFilm.title} a fost adăugat.` });
      }
      handleDialogOpenChange(false);
    } catch (error) {
      console.error('Error saving film:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva filmul.', variant: 'destructive' });
    }
  };

  const softDeleteFilm = async (film: LocalFilmItem) => {
    try {
      await apiSoftDeleteFilm(film.id);
      setFilms(prev => prev.filter(f => f.id !== film.id));
      setTrashed(prev => [film, ...prev]);
      toast({ title: 'Mutat în coș', description: `${film.title} a fost mutat în coșul de gunoi.` });
    } catch (error) {
      console.error('Error soft deleting film:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut muta în coș.', variant: 'destructive' });
    }
  };

  const restoreFilmHandler = async (id: number) => {
    const film = trashed.find(f => f.id === id);
    if (!film) return;
    try {
      await apiRestoreFilm(id);
      setTrashed(prev => prev.filter(f => f.id !== id));
      setFilms(prev => [...prev, film]);
      toast({ title: 'Restaurat', description: `${film.title} a fost restaurat.` });
    } catch (error) {
      console.error('Error restoring film:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
    }
  };

  const deleteForever = async (id: number) => {
    const film = trashed.find(f => f.id === id);
    try {
      await deleteFilm(id);
      setTrashed(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Șters definitiv', description: film ? film.title : 'Element șters.' });
    } catch (error) {
      console.error('Error deleting film permanently:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge definitiv.', variant: 'destructive' });
    }
  };

  const emptyTrash = async () => {
    try {
      await Promise.all(trashed.map(f => deleteFilm(f.id)));
      setTrashed([]);
      toast({ title: 'Coș golit', description: 'Ai șters definitiv toate elementele din coș.' });
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut goli coșul.', variant: 'destructive' });
    }
  };

  const toggleStatus = async (id: number) => {
    const film = films.find(f => f.id === id);
    if (!film) return;
    const newStatus = film.status === 'todo' ? 'watched' : 'todo';
    try {
      const updated = await updateFilm(id, { status: newStatus === 'watched' ? 'watched' : 'to-watch' });
      setFilms(prev => prev.map(f => f.id === id ? toLocalFilm(updated) : f));
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut schimba statusul.', variant: 'destructive' });
    }
  };

  const startEdit = (film: LocalFilmItem) => {
    setEditingId(film.id);
    setForm({
      title: film.title,
      genres: film.genres,
      year: film.year ?? '',
      status: film.status,
      rating: film.rating ? String(film.rating) : '',
      category: film.category || '',
      notes: film.notes || '',
    });
    setShowDialog(true);
  };

  const FilmList = ({ items, title }: { items: LocalFilmItem[]; title: string }) => {
    const grouped = useMemo(() => {
      if (sortBy === 'year') {
        const map = new Map<string, LocalFilmItem[]>();
        items.forEach((f) => {
          const key = typeof f.year === 'number' ? String(f.year) : 'Fără an';
          const bucket = map.get(key) || [];
          bucket.push(f);
          map.set(key, bucket);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, list]) => ({ label, list }));
      }
      if (sortBy === 'genre') {
        // Group by first genre when sorting by genre
        const map = new Map<string, LocalFilmItem[]>();
        items.forEach((f) => {
          const key = f.genres.length > 0 ? f.genres[0] : 'Fără gen';
          const bucket = map.get(key) || [];
          bucket.push(f);
          map.set(key, bucket);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, list]) => ({ label, list }));
      }
      if (sortBy === 'category') {
        const map = new Map<string, LocalFilmItem[]>();
        items.forEach((f) => {
          const key = f.category || 'Neclasificat';
          const bucket = map.get(key) || [];
          bucket.push(f);
          map.set(key, bucket);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, list]) => ({ label, list }));
      }
      return null;
    }, [items, sortBy]);

    const handleTouchStart = (e: React.TouchEvent, filmId: number) => {
      touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      touchStartY.current = e.changedTouches[0]?.clientY ?? null;
      touchId.current = filmId;
      isHorizontalSwipe.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent, filmId: number) => {
      if (touchId.current !== filmId || touchStartX.current === null || touchStartY.current === null) return;
      
      const currentX = e.changedTouches[0]?.clientX ?? 0;
      const currentY = e.changedTouches[0]?.clientY ?? 0;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;
      
      // Determine if this is a horizontal or vertical swipe (only once)
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }
      
      // Only track horizontal swipes
      if (isHorizontalSwipe.current) {
        e.preventDefault();
        // Clamp the offset between -SWIPE_MAX and SWIPE_MAX
        const clampedOffset = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, deltaX));
        setSwipeOffset(prev => ({ ...prev, [filmId]: clampedOffset }));
      }
    };

    const handleTouchEnd = (e: React.TouchEvent, film: LocalFilmItem) => {
      if (touchId.current !== film.id || touchStartX.current === null) {
        return;
      }
      
      const offset = swipeOffset[film.id] || 0;
      
      // Reset refs
      touchStartX.current = null;
      touchStartY.current = null;
      touchId.current = null;
      isHorizontalSwipe.current = null;
      
      // Check if threshold was reached
      if (Math.abs(offset) >= SWIPE_THRESHOLD) {
        if (offset > 0) {
          // Swipe right -> mark as watched/unwatched
          setSwipeCompleted(prev => ({ ...prev, [film.id]: 'right' }));
          setTimeout(() => {
            toggleStatus(film.id);
            toast({ 
              title: film.status === 'todo' ? 'Marcat ca văzut' : 'Mutat la de văzut', 
              description: film.title 
            });
            setSwipeOffset(prev => ({ ...prev, [film.id]: 0 }));
            setSwipeCompleted(prev => ({ ...prev, [film.id]: null }));
          }, 200);
        } else {
          // Swipe left -> delete
          setSwipeCompleted(prev => ({ ...prev, [film.id]: 'left' }));
          setTimeout(() => {
            softDeleteFilm(film);
            setSwipeOffset(prev => ({ ...prev, [film.id]: 0 }));
            setSwipeCompleted(prev => ({ ...prev, [film.id]: null }));
          }, 200);
        }
      } else {
        // Reset position with animation
        setSwipeOffset(prev => ({ ...prev, [film.id]: 0 }));
      }
    };

    const renderFilmCard = (film: LocalFilmItem) => {
      const offset = swipeOffset[film.id] || 0;
      const completed = swipeCompleted[film.id];
      const showDeleteHint = offset < -20;
      const showWatchedHint = offset > 20;
      const deleteReady = offset <= -SWIPE_THRESHOLD;
      const watchedReady = offset >= SWIPE_THRESHOLD;
      
      return (
        <div
          key={film.id}
          className="relative overflow-hidden rounded-lg"
        >
          {/* Background action indicators */}
          <div className="absolute inset-0 flex">
            {/* Left side - Delete (shown when swiping left) */}
            <div 
              className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-all duration-200 ${
                showDeleteHint ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                width: Math.abs(Math.min(offset, 0)),
                backgroundColor: deleteReady ? '#ef4444' : '#fca5a5',
              }}
            >
              <Trash2 className={`h-5 w-5 transition-transform duration-200 ${deleteReady ? 'text-white scale-110' : 'text-rose-700'}`} />
            </div>
            
            {/* Right side - Mark watched (shown when swiping right) */}
            <div 
              className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-all duration-200 ${
                showWatchedHint ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                width: Math.max(offset, 0),
                backgroundColor: watchedReady ? '#22c55e' : '#86efac',
              }}
            >
              {film.status === 'todo' ? (
                <CheckCircle2 className={`h-5 w-5 transition-transform duration-200 ${watchedReady ? 'text-white scale-110' : 'text-green-700'}`} />
              ) : (
                <Undo2 className={`h-5 w-5 transition-transform duration-200 ${watchedReady ? 'text-white scale-110' : 'text-green-700'}`} />
              )}
            </div>
          </div>
          
          {/* The actual card content */}
          <div
            onClick={() => !offset && setShowDetail(film)}
            onTouchStart={(e) => handleTouchStart(e, film.id)}
            onTouchMove={(e) => handleTouchMove(e, film.id)}
            onTouchEnd={(e) => handleTouchEnd(e, film)}
            style={{ 
              transform: `translateX(${offset}px)`,
              transition: completed || offset === 0 ? 'transform 0.2s ease-out' : 'none',
            }}
            className={`relative flex flex-col gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 hover:-translate-y-[1px] hover:border-primary/40 md:flex-row md:items-center md:justify-between ${
              completed === 'left' ? 'translate-x-[-100%]' : ''
            } ${completed === 'right' ? 'translate-x-[100%]' : ''}`}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{film.title}</span>
                {sortBy === 'rating' && film.rating && film.status === 'watched' && (
                  <Badge variant="outline">⭐ {film.rating}</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{film.year ?? '—'} • {film.genres.length > 0 ? film.genres.join(', ') : 'Fără gen'}</span>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2 self-start md:self-auto">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); toggleStatus(film.id); }}
                  className={film.status === 'todo' ? 'hover:text-emerald-500' : 'hover:text-amber-500'}
                >
                  {film.status === 'todo' ? <CheckCircle2 className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
                </Button>
                {isAdmin && (
                  <>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEdit(film); }} className="hover:text-indigo-500">
                      ✎
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); softDeleteFilm(film); }} className="hover:text-rose-500">
                      ✕
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <Card className="border-border/60 bg-muted/20">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clapperboard className="h-4 w-4" /> {title}
          </CardTitle>
          <Badge variant="secondary">{items.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nimic aici încă.</p>}
          {grouped
            ? grouped.map((group) => (
                <div key={group.label} className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                    <div className="h-px flex-1 rounded-full bg-border/60" />
                    <span className="px-2 py-1 rounded-full bg-muted/40 border border-border/50">{group.label}</span>
                    <div className="h-px flex-1 rounded-full bg-border/60" />
                  </div>
                  <div className="space-y-2">
                    {group.list.map((film) => renderFilmCard(film))}
                  </div>
                </div>
              ))
            : items.map((film) => renderFilmCard(film))}
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container text-center space-y-3">
          <h1 className="text-3xl font-bold gradient-text">Filme</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Listă rapidă pentru ce ai de văzut și ce ai bifat deja. Sortare după nume, gen sau an.</p>
        </div>
      </section>

      <section className="page-content-section">
        <div className="page-container space-y-6">
          <Tabs defaultValue="todo" value={activeTab} onValueChange={(v) => setActiveTab(v as 'todo' | 'done')} className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <TabsList className="w-full max-w-sm lg:max-w-md h-12">
                <TabsTrigger value="todo" className="flex-1 text-sm sm:text-base">De văzut</TabsTrigger>
                <TabsTrigger value="done" className="flex-1 text-sm sm:text-base">Văzute</TabsTrigger>
              </TabsList>

              {isMobile ? (
                <div className="flex w-full items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Caută rapid în listă"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 rounded-full"
                    />
                  </div>
                  {/* Filter button */}
                  <Button
                    size="icon"
                    variant="outline"
                    className={`h-11 w-11 rounded-full relative ${hasActiveFilters ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => setShowFilterDialog(true)}
                  >
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                        !
                      </span>
                    )}
                  </Button>
                  {/* Sort button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="outline" className="h-11 w-11 rounded-full">
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56">
                      <div className="space-y-1">
                        {sortOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={sortBy === opt.value ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-2"
                            onClick={() => setSortBy(opt.value)}
                          >
                            {sortBy === opt.value ? <CheckCircle2 className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {/* Trash button in popover for mobile */}
                  {isAdmin && trashed.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-full relative"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                            {trashed.length}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48 p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                          onClick={() => setShowTrashDialog(true)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Deschide coșul
                        </Button>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 flex items-center justify-center order-3 lg:order-none">
                    <div 
                      className={`relative transition-all duration-300 ease-in-out ${
                        searchFocused ? 'w-[20rem] lg:w-[24rem]' : 'w-[10rem] sm:w-[12rem] lg:w-[14rem]'
                      }`}
                    >
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Caută..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        className="pl-9 rounded-full w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto lg:justify-end">
                    {/* Filter button for desktop */}
                    <Button
                      variant="outline"
                      className={`gap-2 rounded-full h-11 ${hasActiveFilters ? 'border-primary bg-primary/10' : ''}`}
                      onClick={() => setShowFilterDialog(true)}
                    >
                      <Filter className="h-4 w-4" />
                      Filtrare
                      {hasActiveFilters && (
                        <Badge variant="default" className="px-1.5 py-0.5 text-xs ml-1">
                          Activ
                        </Badge>
                      )}
                    </Button>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-[180px] h-11 rounded-full shadow-sm">
                        <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Fără sortare" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isAdmin && trashed.length > 0 && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-full relative"
                        onClick={() => setShowTrashDialog(true)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                          {trashed.length}
                        </span>
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        className="gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                        onClick={() => openAddForStatus(activeTab === 'todo' ? 'todo' : 'watched')}
                      >
                        {activeTab === 'todo' ? <Eye className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        Adaugă
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="todo" className="space-y-3">
                  <FilmList items={toWatch} title="Listă filme de văzut" />
                </TabsContent>
                <TabsContent value="done" className="space-y-3">
                  <FilmList items={watched} title="Filme văzute" />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>

      {isAdmin && isMobile && (
        <Button
          className="fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl"
          size="icon"
          onClick={() => openAddForStatus(activeTab === 'todo' ? 'todo' : 'watched')}
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Adaugă / editează film</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Titlu</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Gen(uri)</Label>
                <MultiSelect
                  options={genreOptions}
                  selected={form.genres}
                  onChange={(genres) => setForm({ ...form, genres })}
                  onAddOption={handleAddGenre}
                  onEditOption={handleEditGenre}
                  onDeleteOption={handleDeleteGenre}
                  placeholder="Selectează genurile..."
                  isAdmin={isAdmin}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>An</Label>
                <Input
                  type="number"
                  placeholder="Opțional"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  {form.status === 'watched' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Eye className="h-4 w-4 text-primary" />}
                  {form.status === 'watched' ? 'Văzut' : 'De văzut'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {form.status === 'watched' && (
                <div>
                  <Label>Rating (opțional)</Label>
                  <Input type="number" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
                </div>
              )}
              <div>
                <Label>Tip conținut</Label>
                <Select value={form.category || ''} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează tipul..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notițe</Label>
              <Textarea
                placeholder="Observații rapide despre film"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Anulează</Button>
            <Button onClick={submitFilm} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex-row items-center justify-between">
            <DialogTitle>Detalii film</DialogTitle>
            {isMobile && isAdmin && showDetail && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => { startEdit(showDetail); setShowDetail(null); }}
                title="Editează"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogHeader>
          {showDetail && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Film className="h-4 w-4" /> {showDetail.title}</h3>
              <div className="flex flex-wrap gap-1">
                {showDetail.genres.length > 0 ? (
                  showDetail.genres.map((g) => (
                    <Badge key={g} variant="secondary">{g}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Fără gen</span>
                )}
                <span className="text-sm text-muted-foreground ml-2">• {showDetail.year ?? '—'}</span>
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{showDetail.status === 'watched' ? 'Văzut' : 'De văzut'}</p>
              {showDetail.category && <p className="text-sm">Categorie: {showDetail.category}</p>}
              {showDetail.rating && <p className="text-sm">Rating: {showDetail.rating}/10</p>}
              {showDetail.notes && (
                <div className="text-sm text-muted-foreground rounded-md border border-border/60 bg-muted/30 p-3">
                  {showDetail.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trash Management Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)] sm:w-auto">
          <DialogHeader>
            <DialogTitle>Coș de gunoi ({trashed.length})</DialogTitle>
            <DialogDescription>
              Restaurează sau șterge permanent filmele.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {trashed.map((film) => (
              <div
                key={film.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded bg-muted flex-shrink-0">
                    <Film className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm sm:text-base">{film.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {film.genres.length > 0 ? film.genres.join(', ') : 'Fără gen'} • {film.year ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    onClick={() => restoreFilmHandler(film.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden xs:inline">Restaurează</span>
                    <span className="xs:hidden">Restab.</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                    onClick={() => deleteForever(film.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    Șterge
                  </Button>
                </div>
              </div>
            ))}
            {trashed.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Coșul de gunoi este gol.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full p-4 sm:p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtrare
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Year filter dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">An</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 text-sm font-normal"
                  >
                    {filterYears.length === 0 
                      ? <span className="text-muted-foreground">Toate anii</span>
                      : <span>{filterYears.length} selectat{filterYears.length > 1 ? 'e' : ''}</span>
                    }
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div 
                    className="max-h-48 overflow-y-auto p-1 overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {availableYears.map((year) => (
                      <div
                        key={year}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent",
                          filterYears.includes(year) && "bg-primary/10"
                        )}
                        onClick={() => setFilterYears(prev => 
                          prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          filterYears.includes(year) ? "bg-primary border-primary" : "border-input"
                        )}>
                          {filterYears.includes(year) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        {year}
                      </div>
                    ))}
                    {availableYears.length === 0 && (
                      <div className="text-sm text-muted-foreground p-2 text-center">Niciun an</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Type filter dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tip</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 text-sm font-normal"
                  >
                    {filterCategories.length === 0 
                      ? <span className="text-muted-foreground">Toate tipurile</span>
                      : <span>{filterCategories.join(', ')}</span>
                    }
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-1">
                    {availableCategories.map((cat) => (
                      <div
                        key={cat}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent",
                          filterCategories.includes(cat) && "bg-primary/10"
                        )}
                        onClick={() => setFilterCategories(prev => 
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          filterCategories.includes(cat) ? "bg-primary border-primary" : "border-input"
                        )}>
                          {filterCategories.includes(cat) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        {cat}
                      </div>
                    ))}
                    {availableCategories.length === 0 && (
                      <div className="text-sm text-muted-foreground p-2 text-center">Niciun tip</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Genre filter dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gen</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 text-sm font-normal"
                  >
                    {filterGenres.length === 0 
                      ? <span className="text-muted-foreground">Toate genurile</span>
                      : <span>{filterGenres.length} selectat{filterGenres.length > 1 ? 'e' : ''}</span>
                    }
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <div 
                    className="max-h-48 overflow-y-auto p-1 overscroll-contain"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    {availableGenres.map((genre) => (
                      <div
                        key={genre}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent",
                          filterGenres.includes(genre) && "bg-primary/10"
                        )}
                        onClick={() => setFilterGenres(prev => 
                          prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          filterGenres.includes(genre) ? "bg-primary border-primary" : "border-input"
                        )}>
                          {filterGenres.includes(genre) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        {genre}
                      </div>
                    ))}
                    {availableGenres.length === 0 && (
                      <div className="text-sm text-muted-foreground p-2 text-center">Niciun gen</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Rating filter (only for watched) */}
            {activeTab === 'done' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rating</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Min"
                    value={filterRatingMin}
                    onChange={(e) => setFilterRatingMin(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Max"
                    value={filterRatingMax}
                    onChange={(e) => setFilterRatingMax(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected filters summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1 pt-2 border-t mt-3">
              {filterYears.map(y => (
                <Badge key={y} variant="secondary" className="text-xs gap-1">
                  {y}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterYears(prev => prev.filter(x => x !== y))} />
                </Badge>
              ))}
              {filterCategories.map(c => (
                <Badge key={c} variant="secondary" className="text-xs gap-1">
                  {c}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterCategories(prev => prev.filter(x => x !== c))} />
                </Badge>
              ))}
              {filterGenres.map(g => (
                <Badge key={g} variant="secondary" className="text-xs gap-1">
                  {g}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterGenres(prev => prev.filter(x => x !== g))} />
                </Badge>
              ))}
              {(filterRatingMin || filterRatingMax) && (
                <Badge variant="secondary" className="text-xs gap-1">
                  ⭐ {filterRatingMin || '1'}–{filterRatingMax || '10'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setFilterRatingMin(''); setFilterRatingMax(''); }} />
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-3">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={clearFilters}
              >
                Resetează
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setShowFilterDialog(false)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs"
            >
              Vezi {filteredFilms.filter(f => activeTab === 'todo' ? f.status === 'todo' : f.status === 'watched').length} rezultate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
