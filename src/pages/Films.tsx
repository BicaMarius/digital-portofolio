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
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdmin } from '@/contexts/AdminContext';
import { Clapperboard, Plus, Film, Search, CheckCircle2, Undo2, Eye, Star, ArrowUpDown, Trash2, RotateCcw, Pencil, Loader2, Trash } from 'lucide-react';
import { getFilms, createFilm, updateFilm, softDeleteFilm as apiSoftDeleteFilm, restoreFilm as apiRestoreFilm, deleteFilm, getTrashedFilms } from '@/lib/api';
import type { FilmItem as ApiFilmItem } from '@shared/schema';

// Local interface for UI compatibility
interface LocalFilmItem {
  id: number;
  title: string;
  genre: string;
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
    genre: (f.genre && f.genre.length > 0) ? f.genre[0] : 'Necunoscut',
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
    genre: f.genre ? [f.genre] : [],
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

const sortOptions: { value: 'none' | 'name' | 'genre' | 'category' | 'year' | 'rating'; label: string }[] = [
  { value: 'none', label: 'Fără sortare' },
  { value: 'name', label: 'Nume' },
  { value: 'genre', label: 'Gen' },
  { value: 'category', label: 'Categorie' },
  { value: 'year', label: 'An' },
  { value: 'rating', label: 'Rating (văzute)' },
];

export default function Films() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const [films, setFilms] = useState<LocalFilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'none' | 'name' | 'genre' | 'category' | 'year' | 'rating'>('none');
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<LocalFilmItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', genre: '', year: '' as number | string | '', status: 'todo' as LocalFilmItem['status'], rating: '', category: '', notes: '' });
  const [trashed, setTrashed] = useState<LocalFilmItem[]>([]);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [swipeState, setSwipeState] = useState<Record<number, 'left' | 'right' | null>>({});
  const touchStart = useRef<number | null>(null);
  const touchId = useRef<number | null>(null);

  // Load data from cloud
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [filmsData, trashedData] = await Promise.all([
        getFilms(),
        getTrashedFilms()
      ]);
      setFilms(filmsData.map(toLocalFilm));
      setTrashed(trashedData.map(toLocalFilm));
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

  const filteredFilms = useMemo(() => {
    const query = search.trim().toLowerCase();
    const copy = [...films];
    if (sortBy === 'name') copy.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'genre') copy.sort((a, b) => a.genre.localeCompare(b.genre));
    if (sortBy === 'category') copy.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    if (sortBy === 'year') copy.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    if (sortBy === 'rating') copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!query) return copy;
    return copy.filter((film) =>
      [film.title, film.genre, film.category, film.notes]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query)),
    );
  }, [films, search, sortBy]);

  const toWatch = filteredFilms.filter(f => f.status === 'todo');
  const watched = filteredFilms.filter(f => f.status === 'watched');

  const handleDialogOpenChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      setEditingId(null);
      setForm({ title: '', genre: '', year: '', status: 'todo', rating: '', category: '', notes: '' });
    }
  };

  const openAddForStatus = (status: LocalFilmItem['status']) => {
    setEditingId(null);
    setForm({ title: '', genre: '', year: '', status, rating: '', category: '', notes: '' });
    handleDialogOpenChange(true);
  };

  const submitFilm = async () => {
    if (!form.title.trim()) return;
    const baseFilm: Omit<LocalFilmItem, 'id'> = {
      title: form.title.trim(),
      genre: form.genre.trim() || 'Necunoscut',
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
      genre: film.genre,
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
      if (sortBy === 'genre' || sortBy === 'category') {
        const map = new Map<string, LocalFilmItem[]>();
        items.forEach((f) => {
          const key = (sortBy === 'category' ? f.category : f.genre) || 'Neclasificat';
          const bucket = map.get(key) || [];
          bucket.push(f);
          map.set(key, bucket);
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, list]) => ({ label, list }));
      }
      return null;
    }, [items, sortBy]);

    const renderFilmCard = (film: LocalFilmItem) => (
      <div
        key={film.id}
        onClick={() => setShowDetail(film)}
        onTouchStart={(e) => {
          touchStart.current = e.changedTouches[0]?.clientX ?? null;
          touchId.current = film.id;
        }}
        onTouchEnd={(e) => {
          if (touchId.current !== film.id || touchStart.current === null) return;
          const deltaX = e.changedTouches[0]?.clientX - touchStart.current;
          touchStart.current = null;
          touchId.current = null;
          if (Math.abs(deltaX) < 40) return;
          if (deltaX > 40) {
            setSwipeState((prev) => ({ ...prev, [film.id]: 'right' }));
            toggleStatus(film.id);
            toast({ title: 'Marcat', description: film.status === 'todo' ? `${film.title} marcat ca văzut.` : `${film.title} mutat la de văzut.` });
            setTimeout(() => setSwipeState((prev) => ({ ...prev, [film.id]: null })), 240);
          }
          if (deltaX < -40) {
            setSwipeState((prev) => ({ ...prev, [film.id]: 'left' }));
            softDeleteFilm(film);
            setTimeout(() => setSwipeState((prev) => ({ ...prev, [film.id]: null })), 240);
          }
        }}
        className={`flex flex-col gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 transition hover:-translate-y-[1px] hover:border-primary/40 md:flex-row md:items-center md:justify-between ${swipeState[film.id] === 'left' ? 'swipe-action-left' : ''} ${swipeState[film.id] === 'right' ? 'swipe-action-right' : ''}`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{film.title}</span>
            {sortBy === 'rating' && film.rating && film.status === 'watched' && (
              <Badge variant="outline">⭐ {film.rating}</Badge>
            )}
          </div>
            <span className="text-xs text-muted-foreground hidden sm:block">{film.year ?? '—'} • {film.genre}</span>
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
    );

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
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-[220px] h-11 rounded-full shadow-sm">
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
                        className="gap-2 rounded-full"
                        onClick={() => setShowTrashDialog(true)}
                      >
                        <Trash className="h-4 w-4" />
                        <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                          {trashed.length}
                        </Badge>
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
                <Label>Gen</Label>
                <Input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
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
                <Label>Categorie (opțional)</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
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
              <p className="text-sm text-muted-foreground">{showDetail.genre} • {showDetail.year}</p>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded bg-muted flex-shrink-0">
                  <Film className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{film.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {film.genre} • {film.year ?? '—'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreFilmHandler(film.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restaurează
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteForever(film.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
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
    </PageLayout>
  );
}
