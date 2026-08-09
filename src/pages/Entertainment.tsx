import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tv2, Plus, BookOpen, Gamepad2, Search, Star, ArrowUpDown, Trash2, 
  RotateCcw, Pencil, Loader2, Filter, CheckCircle2, Eye, Map as MapIcon, Lock, Star as StarIcon,
  ChevronDown, ChevronRight, ChevronsUpDown, Check, X, Image as ImageIcon, Upload, Calendar, User, Compass, ExternalLink, Trophy
} from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { cn } from '@/lib/utils';
import {
  getFilms, createFilm, updateFilm, softDeleteFilm as apiSoftDeleteFilm, restoreFilm as apiRestoreFilm, deleteFilm, getTrashedFilms,
  getFilmGenres, createFilmGenre, updateFilmGenre, deleteFilmGenre,
  getBooks, createBook, updateBook, softDeleteBook, restoreBook, deleteBook, getTrashedBooks,
  getGames, createGame, updateGame, softDeleteGame, restoreGame, deleteGame, getTrashedGames,
} from '@/lib/api';
import type { FilmItem, BookItem, GameItem } from '@shared/schema';

// --- STYLING CONSTANTS ---
const inputCls = 'w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-purple-500/50 transition-all';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';
const rowCls = 'flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5 cursor-pointer';
const cardCls = 'bg-[#12121a] border border-white/5 rounded-[1.25rem] p-4 hover:border-purple-500/20 transition-all duration-300 group relative flex flex-col h-full cursor-pointer';

const GENRE_COLORS: Record<string, string> = {
  'Action': 'bg-red-500/20 text-red-300 border-red-500/20',
  'Aventura': 'bg-orange-500/20 text-orange-300 border-orange-500/20',
  'Comedie': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  'Drama': 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  'SF': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  'Horror': 'bg-red-900/40 text-red-400 border-red-900/30',
  'Thriller': 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  'Animatie': 'bg-pink-500/20 text-pink-300 border-pink-500/20',
  'Documentar': 'bg-slate-500/20 text-slate-300 border-slate-500/20',
  'Romance': 'bg-rose-500/20 text-rose-300 border-rose-500/20',
  'Fantasy': 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  'Mister': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20',
  'Biografie': 'bg-teal-500/20 text-teal-300 border-teal-500/20',
  'RPG': 'bg-purple-600/20 text-purple-300 border-purple-600/20',
  'Strategy': 'bg-blue-600/20 text-blue-300 border-blue-600/20',
  'Puzzle': 'bg-green-500/20 text-green-300 border-green-500/20',
  'Indie': 'bg-pink-600/20 text-pink-300 border-pink-600/20',
};
const getGenreColor = (g: string) => GENRE_COLORS[g] || 'bg-white/5 text-slate-400 border-white/10';

function getPrimaryGenre(item: any): string {
  if (Array.isArray(item.genre) && item.genre.length > 0) return item.genre[0];
  if (typeof item.genre === 'string' && item.genre.trim()) return item.genre;
  if (Array.isArray(item.genres) && item.genres.length > 0) return item.genres[0];
  return 'Fără gen';
}

function getItemCategory(item: any): string {
  return item.director || item.format || item.platform || item.developer || 'Altele';
}

function parseMediaUrls(rawUrls: string | null | undefined, rawNotes?: string | null): string[] {
  const urls: string[] = [];

  const addValidUrl = (candidate: string) => {
    let clean = candidate.trim().replace(/^[|,]+|[|,]+$/g, '');
    if (clean.includes('\n')) {
      clean = clean.split('\n')[0].trim();
    }
    if ((clean.startsWith('data:image/') || clean.startsWith('http://') || clean.startsWith('https://')) && clean.length > 50) {
      urls.push(clean);
    }
  };

  const extractString = (str: string | null | undefined) => {
    if (!str) return;
    let s = str.trim();
    if (!s) return;

    const chunks = s.split('|||');
    for (const chunk of chunks) {
      let c = chunk.trim();
      if (!c) continue;

      if (c.includes('data:image/')) {
        const subImages = c.split(/(?=data:image\/)/);
        for (const sub of subImages) {
          addValidUrl(sub);
        }
      } else if (c.startsWith('http://') || c.startsWith('https://')) {
        addValidUrl(c);
      }
    }
  };

  extractString(rawUrls);

  if (rawNotes && rawNotes.includes('MEDIA:::')) {
    const parts = rawNotes.split('MEDIA:::');
    if (parts[1]) {
      extractString(parts[1]);
    }
  }

  return Array.from(new Set(urls));
}

const COUNTRIES_BY_CONTINENT: Record<string, string[]> = {
  'Europa': ['Albania','Andorra','Austria','Belarus','Belgia','Bosnia și Herțegovina','Bulgaria','Cipru','Croatia','Cehia','Danemarca','Estonia','Finlanda','Franța','Germania','Grecia','Ungaria','Islanda','Irlanda','Italia','Kosovo','Letonia','Liechtenstein','Lituania','Luxemburg','Malta','Moldova','Monaco','Muntenegru','Olanda','Macedonia de Nord','Norvegia','Polonia','Portugalia','România','Rusia','San Marino','Serbia','Slovacia','Slovenia','Spania','Suedia','Elveția','Ucraina','Regatul Unit','Vatican'],
  'Asia': ['Afghanistan','Armenia','Azerbaidjan','Bahrain','Bangladesh','Bhutan','Brunei','Cambodgia','China','Cipru','Georgia','India','Indonezia','Iran','Irak','Israel','Japonia','Iordania','Kazahstan','Kuwait','Kârgâzstan','Laos','Liban','Malaysia','Maldive','Mongolia','Myanmar','Nepal','Coreea de Nord','Oman','Pakistan','Palestina','Filipine','Qatar','Arabia Saudită','Singapore','Coreea de Sud','Sri Lanka','Siria','Taiwan','Tadjikistan','Tailanda','Timor-Leste','Turcia','Turkmenistan','Emiratele Arabe Unite','Uzbekistan','Vietnam','Yemen'],
  'America de Nord': ['Antigua și Barbuda','Bahamas','Barbados','Belize','Canada','Costa Rica','Cuba','Dominica','Republica Dominicană','El Salvador','Grenada','Guatemala','Haiti','Honduras','Jamaica','Mexic','Nicaragua','Panama','Saint Kitts și Nevis','Saint Lucia','Saint Vincent','Trinidad și Tobago','SUA'],
  'America de Sud': ['Argentina','Bolivia','Brazilia','Chile','Columbia','Ecuador','Guyana','Paraguay','Peru','Surinam','Uruguay','Venezuela'],
  'Africa': ['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Camerun','Capul Verde','Republica Centrafricană','Ciad','Comore','Congo','Coasta de Fildeș','Djibouti','Egipt','Eritreea','Eswatini','Etiopia','Gabon','Gambia','Ghana','Guineea','Guineea-Bissau','Kenya','Lesotho','Liberia','Libia','Madagascar','Malawi','Mali','Mauritania','Mauritius','Maroc','Mozambic','Namibia','Niger','Nigeria','Rwanda','São Tomé și Príncipe','Senegal','Sierra Leone','Somalia','Africa de Sud','Sudan de Sud','Sudan','Tanzania','Togo','Tunisia','Uganda','Zambia','Zimbabwe'],
  'Oceania': ['Australia','Fiji','Kiribati','Insulele Marshall','Micronezia','Nauru','Noua Zeelandă','Palau','Papua Noua Guinee','Samoa','Solomon','Tonga','Tuvalu','Vanuatu'],
  'Antarctica': ['Antarctica (Stație de cercetare)']
};

export default function Entertainment() {
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<'films'|'books'|'games'|'travels'>('films');
  const [activeSubTab, setActiveSubTab] = useState<'todo'|'done'>('todo');
  const [loading, setLoading] = useState(true);

  const [films, setFilms] = useState<FilmItem[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('none');

  // Filter dialog states
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterYears, setFilterYears] = useState<string[]>([]);
  const [filterGenres, setFilterGenres] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [genreAndMode, setGenreAndMode] = useState(false);

  // Group collapsing
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);

  // Trash Data
  const [trashedFilms, setTrashedFilms] = useState<FilmItem[]>([]);
  const [trashedBooks, setTrashedBooks] = useState<BookItem[]>([]);
  const [trashedGames, setTrashedGames] = useState<GameItem[]>([]);

  const [genres, setGenres] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fRes, bRes, gRes, gfRes] = await Promise.allSettled([
        getFilms(), getBooks(), getGames(), getFilmGenres()
      ]);

      if (fRes.status === 'fulfilled') setFilms(fRes.value || []);
      if (bRes.status === 'fulfilled') setBooks(bRes.value || []);
      if (gRes.status === 'fulfilled') setGames(gRes.value || []);
      if (gfRes.status === 'fulfilled') setGenres(gfRes.value || []);

      if (isAdmin) {
        const [tfRes, tbRes, tgRes] = await Promise.allSettled([
          getTrashedFilms(), getTrashedBooks(), getTrashedGames()
        ]);
        if (tfRes.status === 'fulfilled') setTrashedFilms(tfRes.value || []);
        if (tbRes.status === 'fulfilled') setTrashedBooks(tbRes.value || []);
        if (tgRes.status === 'fulfilled') setTrashedGames(tgRes.value || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSearch('');
    setSortBy('none');
    setActiveSubTab('todo');
    setFilterYears([]);
    setFilterGenres([]);
    setFilterCategories([]);
  }, [activeTab]);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Derive default status from current sub-tab
  const getDefaultStatus = () => {
    if (activeSubTab === 'done') {
      if (activeTab === 'films') return 'watched';
      if (activeTab === 'books') return 'read';
      return 'played';
    }
    if (activeTab === 'films') return 'to-watch';
    if (activeTab === 'books') return 'to-read';
    return 'to-play';
  };

  const openEditModal = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSoftDelete = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    try {
      if (activeTab === 'films') {
        await apiSoftDeleteFilm(item.id);
      } else if (activeTab === 'books') {
        await softDeleteBook(item.id);
      } else {
        await softDeleteGame(item.id);
      }
      toast({ title: 'Mutat în coș' });
      loadData();
    } catch (err) {
      toast({ title: 'Eroare la ștergere', variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, item: any, type: string) => {
    e.stopPropagation();
    try {
      if (type === 'films') {
        const newStatus = item.status === 'watched' ? 'to-watch' : 'watched';
        await updateFilm(item.id, { ...item, status: newStatus });
      } else if (type === 'books') {
        const newStatus = item.status === 'read' ? 'to-read' : 'read';
        await updateBook(item.id, { ...item, status: newStatus });
      } else if (type === 'games' || type === 'travels') {
        const newStatus = item.status === 'played' ? 'to-play' : 'played';
        await updateGame(item.id, { ...item, status: newStatus });
      }
      toast({ title: 'Status actualizat' });
      loadData();
    } catch (err) {
      toast({ title: 'Eroare', variant: 'destructive' });
    }
  };

  // derived lists
  const travels = games.filter(g => g.mode === 'travel');
  const regularGames = games.filter(g => g.mode !== 'travel');

  const activeRawItems = useMemo(() => {
    if (activeTab === 'films') return films;
    if (activeTab === 'books') return books;
    if (activeTab === 'games') return regularGames;
    return travels;
  }, [activeTab, films, books, regularGames, travels]);

  const getTrashCount = () => {
    if (activeTab === 'films') return trashedFilms.length;
    if (activeTab === 'books') return trashedBooks.length;
    if (activeTab === 'games') return trashedGames.filter(g => g.mode !== 'travel').length;
    return trashedGames.filter(g => g.mode === 'travel').length;
  };

  const getCategoryName = () => {
    if (activeTab === 'films') return 'FILME';
    if (activeTab === 'books') return 'CĂRȚI';
    if (activeTab === 'games') return 'JOCURI';
    return 'CĂLĂTORII';
  };

  const getTodoLabel = () => {
    if (activeTab === 'films') return 'De văzut';
    if (activeTab === 'books') return 'De citit';
    if (activeTab === 'games') return 'De jucat';
    return 'De vizitat';
  };

  const getDoneLabel = () => {
    if (activeTab === 'films') return 'Văzute';
    if (activeTab === 'books') return 'Citite';
    if (activeTab === 'games') return 'Jucate';
    return 'Vizitate';
  };

  // Compute available filter options
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    activeRawItems.forEach(i => { if (i.year) years.add(String(i.year)); });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [activeRawItems]);

  const availableGenres = useMemo(() => {
    const gSet = new Set<string>();
    activeRawItems.forEach(i => {
      const gList = Array.isArray(i.genre) ? i.genre : (i.genre ? [i.genre] : []);
      gList.forEach(g => gSet.add(g));
    });
    return Array.from(gSet).sort();
  }, [activeRawItems]);

  const availableCategories = useMemo(() => {
    const cSet = new Set<string>();
    activeRawItems.forEach(i => {
      const typeVal = getItemCategory(i);
      if (typeVal && typeVal !== 'Altele') cSet.add(typeVal);
    });
    return Array.from(cSet).sort();
  }, [activeRawItems]);

  const hasActiveFilters = filterYears.length > 0 || filterGenres.length > 0 || filterCategories.length > 0;

  const resetFilters = () => {
    setFilterYears([]);
    setFilterGenres([]);
    setFilterCategories([]);
    toast({ title: 'Filtre resetate' });
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Stats rendering on the right
  const renderStats = () => {
    let stats: any[] = [];
    if (activeTab === 'films') {
      const watched = films.filter(f => f.status === 'watched').length;
      const totalRatings = films.filter(f => f.rating).length;
      const avgRating = totalRatings ? (films.reduce((acc, f) => acc + (f.rating || 0), 0) / totalRatings).toFixed(1) : '-';
      stats = [
        { l: 'Total', v: films.length },
        { l: 'Văzute', v: watched },
        { l: 'De văzut', v: films.length - watched },
        { l: '⭐ Rating', v: avgRating }
      ];
    } else if (activeTab === 'books') {
      const read = books.filter(b => b.status === 'read').length;
      const totalRatings = books.filter(b => b.rating).length;
      const avgRating = totalRatings ? (books.reduce((acc, b) => acc + (b.rating || 0), 0) / totalRatings).toFixed(1) : '-';
      stats = [
        { l: 'Total', v: books.length },
        { l: 'Citite', v: read },
        { l: 'De citit', v: books.length - read },
        { l: '⭐ Rating', v: avgRating }
      ];
    } else if (activeTab === 'games') {
      const played = regularGames.filter(g => g.status === 'played').length;
      const totalRatings = regularGames.filter(g => g.rating).length;
      const avgRating = totalRatings ? (regularGames.reduce((acc, g) => acc + (g.rating || 0), 0) / totalRatings).toFixed(1) : '-';
      stats = [
        { l: 'Total', v: regularGames.length },
        { l: 'Jucate', v: played },
        { l: 'De jucat', v: regularGames.length - played },
        { l: '⭐ Rating', v: avgRating }
      ];
    } else if (activeTab === 'travels') {
      const visited = travels.filter(g => g.status === 'played').length;
      const continents = new Set(travels.flatMap(t => Array.isArray(t.genre) ? t.genre : [t.genre]).filter(Boolean)).size;
      stats = [
        { l: 'Total', v: travels.length },
        { l: 'Vizitate', v: visited },
        { l: 'De vizitat', v: travels.length - visited },
        { l: '🌍 Continente', v: continents || 0 }
      ];
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        {stats.map((s: any, idx: number) => (
          <span key={idx} className="text-[11px] font-medium text-slate-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 whitespace-nowrap shadow-sm">
            {s.l}: <strong className="text-white font-bold ml-1">{s.v}</strong>
          </span>
        ))}
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 min-h-screen bg-[#080810]">
        
        {/* HEADER AREA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 group cursor-pointer focus:outline-none w-fit">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 uppercase transition-opacity hover:opacity-90">
                  {getCategoryName()}
                </h1>
                <ChevronDown className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#111111] border-white/10 text-slate-300 rounded-xl min-w-[200px]">
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 hover:text-white" onClick={() => setActiveTab('films')}>🎬 Filme</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 hover:text-white" onClick={() => setActiveTab('books')}>📚 Cărți</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 hover:text-white" onClick={() => setActiveTab('games')}>🎮 Jocuri</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white/5 hover:text-white" onClick={() => setActiveTab('travels')}>🗺️ Călătorii</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stats on the right */}
          <div className="flex items-center gap-2">
            {renderStats()}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111111]/80 backdrop-blur border border-white/10 rounded-2xl p-2.5 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#09090b] border border-white/10 rounded-xl p-1 shrink-0">
            <button onClick={() => setActiveSubTab('todo')} className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all", activeSubTab === 'todo' ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>
              {getTodoLabel()}
            </button>
            <button onClick={() => setActiveSubTab('done')} className={cn("px-5 py-2 rounded-lg text-sm font-semibold transition-all", activeSubTab === 'done' ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>
              {getDoneLabel()}
            </button>
          </div>

          {/* Search - compact center, expands on focus */}
          <div className="relative w-44 sm:w-52 focus-within:w-72 sm:focus-within:w-80 transition-all duration-300">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Caută..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-[#09090b] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all duration-300" 
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button 
              onClick={() => setShowFilterDialog(true)} 
              variant="outline" 
              className={cn("bg-[#09090b] border-white/10 hover:bg-white/5 rounded-xl text-slate-300 gap-2 px-4 h-10 font-medium", hasActiveFilters && "border-purple-500/50 text-purple-300 bg-purple-500/10")}
            >
              <Filter className="w-4 h-4"/> Filtrare
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] bg-[#09090b] border-white/10 rounded-xl text-slate-300 h-10 font-medium">
                <SelectValue placeholder="Fără sortare" />
              </SelectTrigger>
              <SelectContent className="bg-[#111111] border-white/10 text-slate-300">
                <SelectItem value="none">Fără sortare</SelectItem>
                <SelectItem value="name">Nume</SelectItem>
                <SelectItem value="genre">Gen</SelectItem>
                <SelectItem value="category">Tip</SelectItem>
                <SelectItem value="year">An</SelectItem>
                <SelectItem value="rating">Rating (văzute)</SelectItem>
                {activeTab === 'books' && <SelectItem value="author">Autor</SelectItem>}
              </SelectContent>
            </Select>
            
            {isAdmin && (
              <>
                {getTrashCount() > 0 && (
                  <Button onClick={() => setIsTrashOpen(true)} variant="outline" size="icon" className="bg-[#09090b] border-white/10 hover:bg-white/5 shrink-0 rounded-xl relative h-10 w-10">
                    <Trash2 className="w-4 h-4 text-slate-400" />
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{getTrashCount()}</span>
                  </Button>
                )}
                <Button onClick={openAddModal} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shrink-0 gap-1.5 px-4 h-10 font-medium shadow-lg shadow-purple-600/20">
                  <Plus className="w-4 h-4" /> Adaugă
                </Button>
              </>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : (
          <div>
            {activeTab === 'films' && <FilmList items={films} search={search} sortBy={sortBy} activeSubTab={activeSubTab} onEdit={openEditModal} onDelete={handleSoftDelete} onToggle={handleToggleStatus} onView={setViewingItem} isAdmin={isAdmin} filterYears={filterYears} filterGenres={filterGenres} filterCategories={filterCategories} genreAndMode={genreAndMode} collapsedGroups={collapsedGroups} toggleGroupCollapse={toggleGroupCollapse} setCollapsedGroups={setCollapsedGroups} />}
            {activeTab === 'books' && <BookList items={books} search={search} sortBy={sortBy} activeSubTab={activeSubTab} onEdit={openEditModal} onDelete={handleSoftDelete} onToggle={handleToggleStatus} onView={setViewingItem} isAdmin={isAdmin} filterYears={filterYears} filterGenres={filterGenres} filterCategories={filterCategories} genreAndMode={genreAndMode} collapsedGroups={collapsedGroups} toggleGroupCollapse={toggleGroupCollapse} setCollapsedGroups={setCollapsedGroups} />}
            {activeTab === 'games' && <GameList items={regularGames} search={search} sortBy={sortBy} activeSubTab={activeSubTab} onEdit={openEditModal} onDelete={handleSoftDelete} onToggle={handleToggleStatus} onView={setViewingItem} isAdmin={isAdmin} filterYears={filterYears} filterGenres={filterGenres} filterCategories={filterCategories} genreAndMode={genreAndMode} collapsedGroups={collapsedGroups} toggleGroupCollapse={toggleGroupCollapse} setCollapsedGroups={setCollapsedGroups} />}
            {activeTab === 'travels' && <TravelList items={travels} search={search} sortBy={sortBy} activeSubTab={activeSubTab} onEdit={openEditModal} onDelete={handleSoftDelete} onToggle={handleToggleStatus} onView={setViewingItem} isAdmin={isAdmin} filterYears={filterYears} filterGenres={filterGenres} filterCategories={filterCategories} genreAndMode={genreAndMode} collapsedGroups={collapsedGroups} toggleGroupCollapse={toggleGroupCollapse} setCollapsedGroups={setCollapsedGroups} />}
          </div>
        )}
      </div>

      {/* View Detail Modal */}
      {viewingItem && (
        <ViewModal
          item={viewingItem}
          type={activeTab}
          onClose={() => setViewingItem(null)}
          onEdit={openEditModal}
          isAdmin={isAdmin}
        />
      )}

      {/* Forms & Edit Modals */}
      {isAdmin && isModalOpen && (
        <ItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={editingItem}
          type={activeTab}
          onSave={loadData}
          genres={genres}
          setGenres={setGenres}
          defaultStatus={editingItem ? undefined : getDefaultStatus()}
        />
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="bg-[#111111] border-white/10 text-slate-200 max-w-sm rounded-3xl p-6">
          <DialogHeader className="pb-2 flex flex-row items-center justify-between border-b border-white/5">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Filter className="h-4 w-4 text-purple-400" />
              Filtrare
            </DialogTitle>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-1 rounded-lg transition-colors"
                title="Resetează toate filtrele"
              >
                <RotateCcw className="w-3 h-3" />
                Resetează
              </button>
            )}
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Year filter */}
            <div>
              <Label className={labelCls}>AN</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10 bg-[#09090b] border-white/10 text-slate-300">
                    {filterYears.length === 0 ? <span className="text-slate-500">Toate anii</span> : <span>{filterYears.length} selectați</span>}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] bg-[#161622] border-white/10 p-1 text-slate-300 max-h-48 overflow-y-auto">
                  {availableYears.map((y) => (
                    <div key={y} className={cn("flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 text-xs", filterYears.includes(y) && "bg-purple-500/20 text-purple-300")}
                      onClick={() => setFilterYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])}>
                      <div className={cn("w-4 h-4 border rounded flex items-center justify-center border-white/20", filterYears.includes(y) && "bg-purple-600 border-purple-600")}>
                        {filterYears.includes(y) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {y}
                    </div>
                  ))}
                  {availableYears.length === 0 && <p className="p-2 text-xs text-slate-500 text-center">Fără an</p>}
                </PopoverContent>
              </Popover>
            </div>

            {/* Type filter */}
            <div>
              <Label className={labelCls}>TIP</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10 bg-[#09090b] border-white/10 text-slate-300">
                    {filterCategories.length === 0 ? <span className="text-slate-500">Toate tipurile</span> : <span>{filterCategories.join(', ')}</span>}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] bg-[#161622] border-white/10 p-1 text-slate-300">
                  {availableCategories.map((c) => (
                    <div key={c} className={cn("flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 text-xs", filterCategories.includes(c) && "bg-purple-500/20 text-purple-300")}
                      onClick={() => setFilterCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}>
                      <div className={cn("w-4 h-4 border rounded flex items-center justify-center border-white/20", filterCategories.includes(c) && "bg-purple-600 border-purple-600")}>
                        {filterCategories.includes(c) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {c}
                    </div>
                  ))}
                  {availableCategories.length === 0 && <p className="p-2 text-xs text-slate-500 text-center">Fără tipuri</p>}
                </PopoverContent>
              </Popover>
            </div>

            {/* Genre filter with OR/AND toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className={labelCls}>GEN</Label>
                <button
                  type="button"
                  onClick={() => setGenreAndMode(v => !v)}
                  className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-slate-300 hover:text-white"
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  {genreAndMode ? "Toate (AND)" : "Oricare (OR)"}
                </button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10 bg-[#09090b] border-white/10 text-slate-300">
                    {filterGenres.length === 0 ? <span className="text-slate-500">Toate genurile</span> : <span>{filterGenres.length} selectate</span>}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] bg-[#161622] border-white/10 p-1 text-slate-300 max-h-48 overflow-y-auto">
                  {availableGenres.map((g) => (
                    <div key={g} className={cn("flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 text-xs", filterGenres.includes(g) && "bg-purple-500/20 text-purple-300")}
                      onClick={() => setFilterGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}>
                      <div className={cn("w-4 h-4 border rounded flex items-center justify-center border-white/20", filterGenres.includes(g) && "bg-purple-600 border-purple-600")}>
                        {filterGenres.includes(g) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {g}
                    </div>
                  ))}
                  {availableGenres.length === 0 && <p className="p-2 text-xs text-slate-500 text-center">Fără genuri</p>}
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={() => setShowFilterDialog(false)} className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-11 font-semibold shadow-lg shadow-purple-600/30 mt-2">
              Vezi rezultatele
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TrashModal 
        isOpen={isTrashOpen} 
        onClose={() => setIsTrashOpen(false)} 
        type={activeTab} 
        trashedFilms={trashedFilms}
        trashedBooks={trashedBooks}
        trashedGames={trashedGames}
        setTrashedFilms={setTrashedFilms}
        setTrashedBooks={setTrashedBooks}
        setTrashedGames={setTrashedGames}
        onRefresh={loadData}
      />
    </PageLayout>
  );
}

// ==========================================
// LIST RENDERERS & GROUPING LOGIC
// ==========================================
function applyFiltersAndSort(items: any[], search: string, sortBy: string, filterYears: string[], filterGenres: string[], filterCategories: string[], genreAndMode: boolean) {
  let copy = [...items];

  if (filterYears.length > 0) {
    copy = copy.filter(i => i.year && filterYears.includes(String(i.year)));
  }
  if (filterGenres.length > 0) {
    copy = copy.filter(i => {
      const gList = Array.isArray(i.genre) ? i.genre : (i.genre ? [i.genre] : []);
      return genreAndMode ? filterGenres.every(g => gList.includes(g)) : filterGenres.some(g => gList.includes(g));
    });
  }
  if (filterCategories.length > 0) {
    copy = copy.filter(i => {
      const typeVal = getItemCategory(i);
      return typeVal && filterCategories.includes(typeVal);
    });
  }
  if (search) {
    const q = search.toLowerCase();
    copy = copy.filter(i => (i.title || '').toLowerCase().includes(q) || (i.developer || '').toLowerCase().includes(q) || (i.author || '').toLowerCase().includes(q));
  }

  // Sorting
  if (sortBy === 'name') {
    copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortBy === 'year') {
    copy.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  } else if (sortBy === 'rating') {
    copy.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  } else if (sortBy === 'genre') {
    copy.sort((a, b) => getPrimaryGenre(a).localeCompare(getPrimaryGenre(b)));
  } else if (sortBy === 'category') {
    copy.sort((a, b) => getItemCategory(a).localeCompare(getItemCategory(b)));
  } else if (sortBy === 'author') {
    copy.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
  } else {
    // sortBy === 'none': Newly added items at top
    copy.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }

  return copy;
}

function GroupedContainer({ items, sortBy, renderRow, titleLabel, collapsedGroups, toggleGroupCollapse, setCollapsedGroups }: any) {
  const grouped = useMemo(() => {
    if (sortBy === 'none' || sortBy === 'name') return null;

    const map = new window.Map<string, any[]>();
    items.forEach((item: any) => {
      let key = 'Nedefinit';
      if (sortBy === 'year') key = item.year ? String(item.year) : 'Fără an';
      else if (sortBy === 'genre') key = getPrimaryGenre(item);
      else if (sortBy === 'category') key = getItemCategory(item);
      else if (sortBy === 'rating') key = item.rating ? `Rating ${item.rating}` : 'Fără rating';
      else if (sortBy === 'author') key = item.author ? item.author : 'Autor necunoscut';

      const bucket = map.get(key) || [];
      bucket.push(item);
      map.set(key, bucket);
    });

    return Array.from(map.entries()).map(([key, list]) => ({ key, list }));
  }, [items, sortBy]);

  const allKeys = useMemo(() => grouped?.map(g => g.key) || [], [grouped]);
  const isAllCollapsed = allKeys.length > 0 && allKeys.every(k => collapsedGroups.has(k));

  const toggleAll = () => {
    if (isAllCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(allKeys));
    }
  };

  if (!grouped) {
    return (
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
            <span>🎬</span> {titleLabel}
          </div>
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{items.length}</span>
        </div>
        <div className="space-y-1">
          {items.map((item: any) => renderRow(item))}
          {items.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">Nu există elemente în această listă.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
          <span>🎬</span> {titleLabel}
        </div>
        <div className="flex items-center gap-2">
          {/* Punctul 4: Iconita reprezentativa in loc de scris pe extinde/restrange */}
          <button 
            onClick={toggleAll} 
            title={isAllCollapsed ? "Extinde toate grupurile" : "Restrânge toate grupurile"}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 border border-white/5"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-bold">{items.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map(({ key, list }) => {
          const collapsed = collapsedGroups.has(key);
          return (
            <div key={key} className="space-y-1">
              <button onClick={() => toggleGroupCollapse(key)} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 w-full justify-between border border-white/5">
                <div className="flex items-center gap-2 font-semibold">
                  {collapsed ? <ChevronRight className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
                  <span>{key}</span>
                </div>
                <span className="text-[11px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">{list.length}</span>
              </button>
              {!collapsed && (
                <div className="pl-2 space-y-1 mt-1">
                  {list.map((item: any) => renderRow(item))}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">Nu există elemente în această listă.</p>}
      </div>
    </div>
  );
}

function FilmList({ items, search, sortBy, activeSubTab, onEdit, onDelete, onToggle, onView, isAdmin, filterYears, filterGenres, filterCategories, genreAndMode, collapsedGroups, toggleGroupCollapse, setCollapsedGroups }: any) {
  const filtered = applyFiltersAndSort(items, search, sortBy, filterYears, filterGenres, filterCategories, genreAndMode);
  const currentList = activeSubTab === 'todo' ? filtered.filter(i => i.status === 'to-watch' || i.status === 'todo') : filtered.filter(i => i.status === 'watched');

  const Row = (f: any) => (
    <div key={f.id} onClick={() => onView(f)} className={rowCls}>
      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm shrink-0">
        {f.director === 'Serial' ? '📺' : f.director === 'Anime' ? '🌸' : '🎬'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-200 truncate group-hover:text-purple-300 transition-colors">{f.title}</span>
          {f.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
          {f.rating && f.status === 'watched' && <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1"><StarIcon className="w-3 h-3 fill-amber-400"/>{f.rating}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">{f.year || '—'}</span>
          {f.genre && (Array.isArray(f.genre) ? f.genre : [f.genre]).slice(0, 3).map((g: string, i: number) => (
            <span key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded border", getGenreColor(g))}>{g}</span>
          ))}
          <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{f.director || 'Film'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {isAdmin && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-indigo-400" onClick={e => onEdit(e, f)}><Pencil className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-400" onClick={e => onDelete(e, f)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        )}
        <Button onClick={e => onToggle(e, f, 'films')} size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
          {f.status === 'watched' ? <RotateCcw className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
          {f.status === 'watched' ? 'Undo' : 'Văzut'}
        </Button>
      </div>
    </div>
  );

  return (
    <GroupedContainer 
      items={currentList} 
      sortBy={sortBy} 
      renderRow={Row} 
      titleLabel={activeSubTab === 'todo' ? 'Listă filme de văzut' : 'Listă filme văzute'} 
      collapsedGroups={collapsedGroups} 
      toggleGroupCollapse={toggleGroupCollapse} 
      setCollapsedGroups={setCollapsedGroups} 
    />
  );
}

function BookList({ items, search, sortBy, activeSubTab, onEdit, onDelete, onToggle, onView, isAdmin, filterYears, filterGenres, filterCategories, genreAndMode, collapsedGroups, toggleGroupCollapse, setCollapsedGroups }: any) {
  const filtered = applyFiltersAndSort(items, search, sortBy, filterYears, filterGenres, filterCategories, genreAndMode);
  const currentList = activeSubTab === 'todo' ? filtered.filter(i => i.status === 'to-read' || i.status === 'reading') : filtered.filter(i => i.status === 'read');

  const Row = (b: any) => (
    <div key={b.id} onClick={() => onView(b)} className={rowCls}>
      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm shrink-0">
        {b.format === 'Audio' ? '🎧' : b.format === 'Digital' ? '📱' : '📚'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-slate-200 truncate group-hover:text-purple-300 transition-colors">{b.title}</span>
          <span className="text-xs text-slate-400 truncate hidden sm:inline">- {b.author}</span>
          {b.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
          {b.rating && b.status === 'read' && <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1"><StarIcon className="w-3 h-3 fill-amber-400"/>{b.rating}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500">{b.year || '—'}</span>
          {b.genre && (Array.isArray(b.genre) ? b.genre : [b.genre]).slice(0, 3).map((g: string, i: number) => (
            <span key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded border", getGenreColor(g))}>{g}</span>
          ))}
          <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{b.format || 'Fizic'}</span>
          {b.status === 'reading' && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">În citire</span>}
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {isAdmin && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-indigo-400" onClick={e => onEdit(e, b)}><Pencil className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-400" onClick={e => onDelete(e, b)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        )}
        <Button onClick={e => onToggle(e, b, 'books')} size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
          {b.status === 'read' ? <RotateCcw className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
          {b.status === 'read' ? 'Undo' : 'Citit'}
        </Button>
      </div>
    </div>
  );

  return (
    <GroupedContainer 
      items={currentList} 
      sortBy={sortBy} 
      renderRow={Row} 
      titleLabel={activeSubTab === 'todo' ? 'Listă cărți de citit' : 'Listă cărți citite'} 
      collapsedGroups={collapsedGroups} 
      toggleGroupCollapse={toggleGroupCollapse} 
      setCollapsedGroups={setCollapsedGroups} 
    />
  );
}

function GameList({ items, search, sortBy, activeSubTab, onEdit, onDelete, onToggle, onView, isAdmin, filterYears, filterGenres, filterCategories, genreAndMode, collapsedGroups, toggleGroupCollapse, setCollapsedGroups }: any) {
  const filtered = applyFiltersAndSort(items, search, sortBy, filterYears, filterGenres, filterCategories, genreAndMode);
  const currentList = activeSubTab === 'todo' ? filtered.filter(i => i.status === 'to-play' || i.status === 'playing') : filtered.filter(i => i.status === 'played');

  const Row = (g: any) => {
    const is100Achievement = !!g.fullAchievement || (g.notes && g.notes.includes('100% Achievement'));

    return (
      <div key={g.id} onClick={() => onView(g)} className={rowCls}>
        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-sm shrink-0">
          🎮
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-200 truncate group-hover:text-purple-300 transition-colors">{g.title}</span>
            <span className="text-xs text-slate-400 truncate hidden sm:inline">- {g.developer}</span>
            {g.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
            {is100Achievement && (
              <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 100% Completed
              </span>
            )}
            {g.rating && g.status === 'played' && <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1"><StarIcon className="w-3 h-3 fill-amber-400"/>{g.rating}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{g.year || '—'}</span>
            {g.genre && (Array.isArray(g.genre) ? g.genre : [g.genre]).slice(0, 3).map((gx: string, i: number) => (
              <span key={i} className={cn("text-[10px] px-1.5 py-0.5 rounded border", getGenreColor(gx))}>{gx}</span>
            ))}
            <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{g.platform || 'PC'}</span>
            <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{g.mode || 'Single'}</span>
            {g.status === 'playing' && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">În progres</span>}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {isAdmin && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-indigo-400" onClick={e => onEdit(e, g)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-400" onClick={e => onDelete(e, g)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          )}
          <Button onClick={e => onToggle(e, g, 'games')} size="sm" variant="outline" className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
            {g.status === 'played' ? <RotateCcw className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
            {g.status === 'played' ? 'Undo' : 'Jucat'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <GroupedContainer 
      items={currentList} 
      sortBy={sortBy} 
      renderRow={Row} 
      titleLabel={activeSubTab === 'todo' ? 'Listă jocuri de jucat' : 'Listă jocuri jucate'} 
      collapsedGroups={collapsedGroups} 
      toggleGroupCollapse={toggleGroupCollapse} 
      setCollapsedGroups={setCollapsedGroups} 
    />
  );
}

function TravelList({ items, search, sortBy, activeSubTab, onEdit, onDelete, onToggle, onView, isAdmin, filterYears, filterGenres, filterCategories, genreAndMode }: any) {
  const filtered = applyFiltersAndSort(items, search, sortBy, filterYears, filterGenres, filterCategories, genreAndMode);
  const currentList = activeSubTab === 'todo' ? filtered.filter(i => i.status !== 'played') : filtered.filter(i => i.status === 'played');

  const Card = ({ t }: any) => {
    const isVisited = t.status === 'played';
    const mediaList = parseMediaUrls(t.mediaUrls, t.notes);

    return (
      <div onClick={() => onView(t)} className={cardCls}>
        {isAdmin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-10" onClick={e => e.stopPropagation()}>
            <button onClick={e => onEdit(e, t)} className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/40 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={e => onDelete(e, t)} className="p-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between pr-14">
            <div className="flex items-center gap-2">
              <span className="text-xl">✈️</span>
              <div>
                <h3 className="font-bold text-white text-base leading-tight group-hover:text-purple-300 transition-colors flex items-center gap-1">
                  {t.title} {t.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
                </h3>
                <p className="text-xs text-slate-400">{t.developer || 'Nedefinit'}</p>
              </div>
            </div>
            {t.year && <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">{t.year}</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {t.genre && (Array.isArray(t.genre) ? t.genre : [t.genre]).map((gx: string, i: number) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-slate-300 bg-white/5">{gx}</span>
            ))}
            {t.platform && <span className="text-[9px] px-1.5 py-0.5 rounded border border-purple-500/20 text-purple-300 bg-purple-500/10">{t.platform}</span>}
            {t.daysSpent && <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-300 bg-amber-500/10">⏱️ {t.daysSpent} zile</span>}
          </div>

          {t.visitedZones && (
            <p className="mt-2 text-xs text-slate-300 font-medium">
              📍 <span className="text-slate-400">Zone:</span> {t.visitedZones}
            </p>
          )}

          {t.notes && !t.notes.includes('MEDIA:::') && <p className="mt-2 text-xs text-slate-400 line-clamp-2 italic">"{t.notes}"</p>}

          {/* Photo Gallery preview */}
          {mediaList.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {mediaList.slice(0, 3).map((img, idx) => (
                <div key={idx} className="h-14 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  <img src={img} alt="media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {isVisited ? (
              <span className="text-[10px] flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded-md font-medium"><CheckCircle2 className="w-3 h-3"/> Vizitat</span>
            ) : (
              <span className="text-[10px] flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-1 rounded-md font-medium"><MapIcon className="w-3 h-3"/> De vizitat</span>
            )}
            <Button onClick={e => onToggle(e, t, 'travels')} size="sm" variant="ghost" className="h-6 px-2 ml-1 bg-white/5 hover:bg-white/10 text-xs text-slate-300 rounded-md">
              {isVisited ? 'Undo' : 'Marchează vizitat'}
            </Button>
          </div>
          {isVisited && t.rating && (
            <div className="flex items-center space-x-1 text-amber-400">
              <StarIcon className="w-3 h-3 fill-amber-400" />
              <span className="text-xs font-bold">{t.rating}/10</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {currentList.map(t => <Card key={t.id} t={t} />)}
      {currentList.length === 0 && <p className="text-slate-500 text-sm py-4 col-span-full text-center">Nu există destinații în această listă.</p>}
    </div>
  );
}

// ==========================================
// VIEW MODAL WITH TABBED PHOTO GALLERY & SUBTLE RATING
// ==========================================
function ViewModal({ item, type, onClose, onEdit, isAdmin }: any) {
  const [viewTab, setViewTab] = useState<'info'|'photos'>('info');
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const mediaList = parseMediaUrls(item.mediaUrls, item.notes);
  const genresList = Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []);
  const is100Achievement = !!item.fullAchievement || (item.notes && item.notes.includes('100% Achievement'));

  const cleanNotes = useMemo(() => {
    if (!item.notes) return '';
    return item.notes.split('MEDIA:::')[0].replace('[100% Achievement]', '').trim();
  }, [item.notes]);

  const getEmoji = () => {
    if (type === 'films') return item.director === 'Serial' ? '📺' : item.director === 'Anime' ? '🌸' : '🎬';
    if (type === 'books') return item.format === 'Audio' ? '🎧' : item.format === 'Digital' ? '📱' : '📚';
    if (type === 'games') return '🎮';
    return '✈️';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#111118] border-white/10 text-slate-200 sm:max-w-[640px] rounded-3xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0">
              {getEmoji()}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white leading-tight">{item.title}</h2>
              {item.developer && <p className="text-xs text-slate-400">{item.developer}</p>}
              {item.author && <p className="text-xs text-slate-400">de {item.author}</p>}
            </div>
          </div>
          {isAdmin && (
            <Button onClick={(e) => { onClose(); onEdit(e, item); }} size="sm" variant="outline" className="border-white/10 hover:bg-white/5 text-xs rounded-xl shrink-0 gap-1">
              <Pencil className="w-3.5 h-3.5" /> Editează
            </Button>
          )}
        </div>

        {/* View Modal Tab Bar for Travels or items with photos */}
        {(type === 'travels' || mediaList.length > 0) && (
          <div className="grid grid-cols-2 bg-[#09090b] border border-white/10 p-1 rounded-xl mt-3">
            <button
              type="button"
              onClick={() => setViewTab('info')}
              className={cn(
                "py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                viewTab === 'info' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span>🗺️ Detalii</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('photos')}
              className={cn(
                "py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                viewTab === 'photos' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span>🖼️ Galerie Foto ({mediaList.length})</span>
            </button>
          </div>
        )}

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 custom-scrollbar pr-1">
          {viewTab === 'photos' ? (
            <div>
              {mediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaList.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActivePhoto(img)}
                      className="h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all group relative"
                    >
                      <img src={img} alt={`foto-${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                        <Eye className="w-4 h-4" /> Mărește
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm bg-white/5 rounded-2xl border border-white/5">
                  Nicio poză încărcată pentru această destinație.
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Metadata grid with labeled badges */}
              <div className="grid grid-cols-2 gap-2">
                {item.year && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none mb-0.5">An</span>
                      <span className="text-xs font-semibold text-slate-200">{item.year}</span>
                    </div>
                  </div>
                )}
                {item.rating && item.rating > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                    <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-600 block leading-none mb-0.5">Rating</span>
                      <span className="text-xs font-bold text-amber-300">{item.rating} / 10</span>
                    </div>
                  </div>
                )}
                {(item.director && type === 'films') && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">{item.director === 'Serial' ? '📺' : item.director === 'Anime' ? '🌸' : '🎬'}</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none mb-0.5">Tip</span>
                      <span className="text-xs font-semibold text-slate-200">{item.director}</span>
                    </div>
                  </div>
                )}
                {(item.format && type === 'books') && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">{item.format === 'Audio' ? '🎧' : item.format === 'Digital' ? '📱' : '📚'}</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none mb-0.5">Format</span>
                      <span className="text-xs font-semibold text-slate-200">{item.format}</span>
                    </div>
                  </div>
                )}
                {item.pages && (
                  <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">📄</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none mb-0.5">Pagini</span>
                      <span className="text-xs font-semibold text-slate-200">{item.pages}</span>
                    </div>
                  </div>
                )}
                {item.platform && (
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">🖥️</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-purple-600 block leading-none mb-0.5">{type === 'travels' ? 'Oraș' : 'Platformă'}</span>
                      <span className="text-xs font-semibold text-purple-300">{item.platform}</span>
                    </div>
                  </div>
                )}
                {item.mode && item.mode !== 'travel' && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                    <span className="text-sm shrink-0">🎮</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-600 block leading-none mb-0.5">Mod</span>
                      <span className="text-xs font-semibold text-blue-300">{item.mode}</span>
                    </div>
                  </div>
                )}
                {is100Achievement && (
                  <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-2 col-span-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-300">100% Achievement Completed</span>
                  </div>
                )}
              </div>

              {/* Colored genre tags with label */}
              {genresList.length > 0 && (
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">{type === 'films' ? 'Categorii' : type === 'books' ? 'Genuri' : type === 'games' ? 'Genuri' : 'Continent'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {genresList.map((g: string, idx: number) => (
                      <span key={idx} className={cn("text-xs px-2.5 py-1 rounded-xl border font-medium", getGenreColor(g))}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</span>
                <span className="text-xs font-semibold text-white">
                  {item.status === 'watched' ? '✅ Văzut' : item.status === 'read' ? '✅ Citit' : item.status === 'played' ? '✅ Jucat / Vizitat' : item.status === 'reading' ? '📖 În citire' : item.status === 'playing' ? '🎮 În progres' : '📌 Neînceput'}
                </span>
              </div>

              {/* Travel Specific Details */}
              {type === 'travels' && (
                <div className="space-y-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                  {item.daysSpent && (
                    <div className="text-xs text-slate-300">
                      ⏱️ <strong>Timp petrecut:</strong> {item.daysSpent} zile
                    </div>
                  )}
                  {item.visitedZones && (
                    <div className="text-xs text-slate-300">
                      📍 <strong>Zone vizitate:</strong> {item.visitedZones}
                    </div>
                  )}
                </div>
              )}

              {/* Notes / Description */}
              {(cleanNotes || item.description) && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Descriere & Impresii</span>
                  <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5 whitespace-pre-wrap">
                    {cleanNotes || item.description}
                  </p>
                </div>
              )}

              {/* Photo Gallery preview inside Info tab */}
              {mediaList.length > 0 && (
                <div className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      🖼️ Galerie Foto ({mediaList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewTab('photos')}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      Vezi toate ➔
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaList.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhoto(img)}
                        className="h-24 rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:opacity-90 transition-all relative group"
                      >
                        <img src={img} alt={`foto-${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                          Mărește
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex justify-end">
          <Button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white rounded-xl">Închide</Button>
        </div>

        {/* Full Image Preview Lightbox */}
        {activePhoto && (
          <Dialog open={!!activePhoto} onOpenChange={() => setActivePhoto(null)}>
            <DialogContent className="bg-black/95 border-white/10 max-w-4xl p-2 rounded-3xl flex flex-col items-center justify-center">
              <img src={activePhoto} alt="Full preview" className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain" />
              <Button onClick={() => setActivePhoto(null)} className="mt-2 bg-white/20 text-white rounded-xl hover:bg-white/30 text-xs">
                Închide imaginea
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MODAL FORMS & CLEAN TABBED CONTROLS
// ==========================================
function AuthorCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const STORAGE_KEY = 'portfolio_book_authors';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || '');
  const [authors, setAuthors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  const saveAuthor = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAuthors(prev => {
      const updated = Array.from(new Set([trimmed, ...prev]));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    onChange(trimmed);
    setInput(trimmed);
    setOpen(false);
  };

  const filtered = authors.filter(a => a.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className={inputCls}
          placeholder="Introdu sau alege autor..."
        />
        {input.trim() && !authors.includes(input.trim()) && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); saveAuthor(input); }}
            className="shrink-0 px-3 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs rounded-xl hover:bg-purple-600/30 transition-colors font-medium whitespace-nowrap"
          >
            + Salvează
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#161622] border border-white/10 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto">
          {filtered.map(a => (
            <button
              key={a}
              type="button"
              onMouseDown={e => { e.preventDefault(); saveAuthor(a); }}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-purple-500/10 hover:text-purple-300 transition-colors"
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemModal({ isOpen, onClose, item, type, onSave, genres, setGenres, defaultStatus }: any) {
  const { isAdmin } = useAdmin();
  const [modalTab, setModalTab] = useState<'info'|'media'>('info');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const defaultContinent = 'Europa';
    let init: any = {};
    const effectiveStatus = defaultStatus || (type === 'films' ? 'to-watch' : type === 'books' ? 'to-read' : 'to-play');
    if (type === 'films') {
      init = { title: '', director: 'Film', status: effectiveStatus, rating: null, year: '', description: '', genre: [], isPrivate: false };
    } else if (type === 'books') {
      init = { title: '', author: '', status: effectiveStatus, rating: null, year: '', description: '', genre: [], format: 'Fizic', pages: '', isPrivate: false };
    } else if (type === 'games') {
      init = { title: '', developer: '', status: effectiveStatus, rating: null, year: '', description: '', genre: [], platform: 'PC', mode: 'Single', maxPlayers: '', isPrivate: false, fullAchievement: false };
    } else {
      init = { title: '', developer: '', status: effectiveStatus, rating: null, year: '', notes: '', description: '', visitedZones: '', daysSpent: '', genre: [defaultContinent], mode: 'travel', platform: '', mediaUrls: '', isPrivate: false };
    }

    if (item) {
      const hasFullAch = !!item.fullAchievement || (item.notes && item.notes.includes('100% Achievement'));
      setFormData({ 
        ...init, 
        ...item, 
        fullAchievement: hasFullAch,
        genre: Array.isArray(item.genre) ? item.genre : (item.genre ? [item.genre] : []),
        year: item.year?.toString() || '', 
        pages: item.pages?.toString() || '', 
        maxPlayers: item.maxPlayers?.toString() || '', 
        daysSpent: item.daysSpent?.toString() || '',
        rating: item.rating ? item.rating.toString() : ''
      });
    } else {
      setFormData(init);
    }
    setModalTab('info');
  }, [item, type, isOpen, defaultStatus]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const rawNotes = (type === 'travels' ? formData.notes : (formData.description || formData.notes))?.trim() || '';
      const notesWithAch = formData.fullAchievement && !rawNotes.includes('100% Achievement') 
        ? `${rawNotes}\n[100% Achievement]`.trim() 
        : rawNotes;

      const data: any = {
        title: formData.title?.trim() || 'Fără titlu',
        developer: formData.developer?.trim() || null,
        author: formData.author?.trim() || null,
        director: formData.director || null,
        format: formData.format || null,
        platform: formData.platform?.trim() || null,
        mode: formData.mode || (type === 'travels' ? 'travel' : 'Single'),
        genre: Array.isArray(formData.genre) ? formData.genre : (formData.genre ? [formData.genre] : []),
        year: formData.year ? String(formData.year).trim() : null,
        status: formData.status || 'to-play',
        rating: formData.rating && !isNaN(Number(formData.rating)) && Number(formData.rating) > 0 ? Number(formData.rating) : null,
        pages: formData.pages && !isNaN(Number(formData.pages)) ? Number(formData.pages) : null,
        maxPlayers: formData.maxPlayers && !isNaN(Number(formData.maxPlayers)) ? Number(formData.maxPlayers) : null,
        daysSpent: formData.daysSpent && !isNaN(Number(formData.daysSpent)) ? Number(formData.daysSpent) : null,
        visitedZones: formData.visitedZones?.trim() || null,
        mediaUrls: formData.mediaUrls?.trim() || null,
        notes: notesWithAch || null,
        fullAchievement: !!formData.fullAchievement,
        isPrivate: !!formData.isPrivate,
      };

      if (type === 'films') {
        item ? await updateFilm(item.id, data) : await createFilm(data);
      } else if (type === 'books') {
        item ? await updateBook(item.id, data) : await createBook(data);
      } else {
        item ? await updateGame(item.id, data) : await createGame(data);
      }
      toast({ title: 'Salvat cu succes' });
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Eroare la salvare', description: err?.message || 'Verifică datele introduse.', variant: 'destructive' });
    }
  };

  // Image Upload with Canvas compression and ||| separator
  const MAX_PHOTOS = 5;
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const currentCount = parseMediaUrls(formData.mediaUrls, formData.notes).length;
    if (currentCount >= MAX_PHOTOS) {
      toast({ title: `Maxim ${MAX_PHOTOS} poze permise`, description: 'Șterge o poză existentă pentru a adăuga alta.', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) return;

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            // Keep images small to avoid DB payload limits (max ~50KB per photo)
            const MAX_DIM = 280;
            let w = img.width || 400;
            let h = img.height || 300;

            if (w > h && w > MAX_DIM) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else if (h > MAX_DIM) {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              // Use lower quality (0.35) to keep payload small
              const compressed = canvas.toDataURL('image/jpeg', 0.35);
              if (compressed && compressed.length > 50) {
                addPhotoToState(compressed);
                return;
              }
            }
          } catch (err) {
            console.error('Canvas error:', err);
          }
          addPhotoToState(rawDataUrl);
        };
        img.onerror = () => addPhotoToState(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const addPhotoToState = (url: string) => {
    setFormData((prev: any) => {
      const current = parseMediaUrls(prev.mediaUrls, prev.notes);
      if (current.includes(url)) return prev;
      return { ...prev, mediaUrls: [...current, url].join('|||') };
    });
  };

  const handleAddGenreOption = async (name: string) => {
    try {
      const newG = await createFilmGenre(name);
      setGenres((prev: any[]) => [...prev, newG]);
      toast({ title: 'Gen adăugat' });
    } catch (err) {
      toast({ title: 'Eroare la adăugarea genului', variant: 'destructive' });
    }
  };

  const handleDeleteGenreOption = async (name: string) => {
    const target = genres.find((g: any) => g.name === name);
    if (!target) return;
    try {
      await deleteFilmGenre(target.id);
      setGenres((prev: any[]) => prev.filter((g: any) => g.id !== target.id));
      toast({ title: 'Gen șters' });
    } catch (err) {
      toast({ title: 'Eroare la ștergere', variant: 'destructive' });
    }
  };

  const handleEditGenreOption = async (oldName: string, newName: string) => {
    const target = genres.find((g: any) => g.name === oldName);
    if (!target) return;
    try {
      await updateFilmGenre(target.id, newName);
      setGenres((prev: any[]) => prev.map((g: any) => g.id === target.id ? { ...g, name: newName } : g));
      toast({ title: 'Gen actualizat' });
    } catch (err) {
      toast({ title: 'Eroare la editare', variant: 'destructive' });
    }
  };

  const genreOptions = useMemo(() => {
    return genres.map((g: any) => ({ value: g.name, label: g.name }));
  }, [genres]);

  const getFormTitle = () => {
    if (type === 'films') return 'Film / Serial';
    if (type === 'books') return 'Carte';
    if (type === 'games') return 'Joc';
    return 'Destinație';
  };

  const mediaList = parseMediaUrls(formData.mediaUrls, formData.notes);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-white/10 text-slate-200 sm:max-w-[540px] rounded-3xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/5">
            <DialogTitle className="text-lg font-bold">{item ? 'Editează' : 'Adaugă'} {getFormTitle()}</DialogTitle>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
            {/* Clean Segmented Control Tabs for Travels inside body */}
            {type === 'travels' && (
              <div className="grid grid-cols-2 bg-[#09090b] border border-white/10 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setModalTab('info')}
                  className={cn(
                    "py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    modalTab === 'info' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span>🗺️ Informații</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('media')}
                  className={cn(
                    "py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    modalTab === 'media' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span>📷 Media & Poze ({mediaList.length})</span>
                </button>
              </div>
            )}

            {type === 'travels' && modalTab === 'media' ? (
              <div className="space-y-4">
                <div>
                  <Label className={labelCls}>Zile petrecute</Label>
                  <input type="number" min="1" value={formData.daysSpent || ''} onChange={e => setFormData({...formData, daysSpent: e.target.value})} className={inputCls} placeholder="Ex: 7" />
                </div>
                <div>
                  <Label className={labelCls}>Zone vizitate (opțional)</Label>
                  <input type="text" value={formData.visitedZones || ''} onChange={e => setFormData({...formData, visitedZones: e.target.value})} className={inputCls} placeholder="Ex: Colosseum, Trevi, Vatican..." />
                </div>
                
                {/* Upload Imagini de pe disc */}
                <div>
                  <Label className={labelCls}>Încarcă Poze din dispozitiv</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-purple-200 font-medium">
                      <Upload className="w-4 h-4 text-purple-400" /> Alege poze...
                      <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {mediaList.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {mediaList.map((imgUrl, idx) => (
                        <div key={idx} className="relative group h-16 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                          <img src={imgUrl} alt={`img-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = mediaList.filter((_, i) => i !== idx);
                              setFormData({ ...formData, mediaUrls: updated.join('|||') });
                            }}
                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className={labelCls}>Descriere / Impresii (opțional)</Label>
                  <Textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className={cn(inputCls, "min-h-[80px] resize-none")} placeholder="Cum a fost călătoria?" />
                </div>
              </div>
            ) : (
              <>
                {/* Title */}
                <div>
                  <Label className={labelCls}>{type === 'travels' ? 'Titlu Jurnal (Ex: Vacanță Roma)' : 'Titlu'} *</Label>
                  <input required type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className={inputCls} />
                </div>
                
                {/* Main fields */}
                <div className="grid grid-cols-2 gap-3">
                  {type === 'films' && (
                    <div>
                      <Label className={labelCls}>Tip</Label>
                      <Select value={formData.director} onValueChange={v => setFormData({...formData, director: v})}>
                        <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Film">Film</SelectItem><SelectItem value="Serial">Serial</SelectItem><SelectItem value="Anime">Anime</SelectItem></SelectContent>
                      </Select>
                    </div>
                  )}
                  {type === 'books' && (
                    <div className="col-span-2">
                      <Label className={labelCls}>Autor</Label>
                      <AuthorCombobox
                        value={formData.author || ''}
                        onChange={v => setFormData({...formData, author: v})}
                      />
                    </div>
                  )}
                  {type === 'games' && (
                    <div>
                      <Label className={labelCls}>Dezvoltator</Label>
                      <input type="text" value={formData.developer || ''} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <Label className={labelCls}>An</Label>
                    <input type="number" min="1900" max="2030" value={formData.year || ''} onChange={e => setFormData({...formData, year: e.target.value})} className={inputCls} placeholder="Ex: 2023" />
                  </div>
                </div>

                {/* Status + Rating */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className={labelCls}>Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {type === 'films' && <><SelectItem value="to-watch">De văzut</SelectItem><SelectItem value="watched">Văzut</SelectItem></>}
                        {type === 'books' && <><SelectItem value="to-read">De citit</SelectItem><SelectItem value="reading">În citire</SelectItem><SelectItem value="read">Citită</SelectItem></>}
                        {(type === 'games' || type === 'travels') && <><SelectItem value="to-play">De {type === 'travels' ? 'vizitat' : 'jucat'}</SelectItem><SelectItem value="playing">În progres</SelectItem><SelectItem value="played">{type === 'travels' ? 'Vizitat' : 'Jucat'}</SelectItem></>}
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.status === 'watched' || formData.status === 'read' || formData.status === 'played') && (
                    <div>
                      <Label className={labelCls}>Rating (1-10 opțional)</Label>
                      <input type="number" min="1" max="10" value={formData.rating || ''} onChange={e => setFormData({...formData, rating: e.target.value})} className={inputCls} placeholder="Opțional" />
                    </div>
                  )}
                </div>

                {/* Books specific */}
                {type === 'books' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={labelCls}>Format</Label>
                      <Select value={formData.format} onValueChange={v => setFormData({...formData, format: v})}>
                        <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Fizic">Fizic</SelectItem><SelectItem value="Digital">Digital</SelectItem><SelectItem value="Audio">Audio</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={labelCls}>Pagini</Label>
                      <input type="number" value={formData.pages || ''} onChange={e => setFormData({...formData, pages: e.target.value})} className={inputCls} />
                    </div>
                  </div>
                )}

                {/* Games specific */}
                {type === 'games' && (
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className={labelCls}>Platformă</Label>
                      <Select value={formData.platform} onValueChange={v => setFormData({...formData, platform: v})}>
                        <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="PC">PC</SelectItem><SelectItem value="PlayStation">PlayStation</SelectItem><SelectItem value="Xbox">Xbox</SelectItem><SelectItem value="Nintendo">Nintendo</SelectItem><SelectItem value="Mobile">Mobile</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className={labelCls}>Mod</Label>
                      <Select value={formData.mode} onValueChange={v => setFormData({...formData, mode: v})}>
                        <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Single">Single Player</SelectItem><SelectItem value="Multiplayer">Multiplayer</SelectItem><SelectItem value="Co-op">Co-op</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Switch id="fullAch" checked={!!formData.fullAchievement} onCheckedChange={c => setFormData({...formData, fullAchievement: c})} />
                      <Label htmlFor="fullAch" className="text-xs text-amber-300 cursor-pointer flex items-center gap-1 font-bold">
                        🏆 100%
                      </Label>
                    </div>
                  </div>
                )}

                {/* Travels specific */}
                {type === 'travels' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className={labelCls}>Continent</Label>
                        <Select value={formData.genre?.[0] || 'Europa'} onValueChange={v => setFormData({...formData, genre: [v], developer: ''})}>
                          <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue placeholder="Europa" /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(COUNTRIES_BY_CONTINENT).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className={labelCls}>Țara</Label>
                        <Select value={formData.developer || ''} onValueChange={v => setFormData({...formData, developer: v})}>
                          <SelectTrigger className={cn(inputCls, "h-10 py-0")}><SelectValue placeholder="Alege țara..." /></SelectTrigger>
                          <SelectContent>
                            {(COUNTRIES_BY_CONTINENT[formData.genre?.[0] || 'Europa'] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className={labelCls}>Oraș</Label>
                      <input type="text" value={formData.platform || ''} onChange={e => setFormData({...formData, platform: e.target.value})} className={inputCls} placeholder="Ex: Paris" />
                    </div>
                  </>
                )}

                {/* MultiSelect for Genres */}
                {type !== 'travels' && (
                  <div>
                    <Label className={labelCls}>Gen(uri)</Label>
                    <MultiSelect
                      options={genreOptions}
                      selected={formData.genre || []}
                      onChange={(sel) => setFormData({ ...formData, genre: sel })}
                      onAddOption={handleAddGenreOption}
                      onDeleteOption={handleDeleteGenreOption}
                      onEditOption={handleEditGenreOption}
                      placeholder="Selectează genurile..."
                      isAdmin={isAdmin}
                    />
                  </div>
                )}

                {/* Description for films/books/games */}
                {type !== 'travels' && (
                  <div>
                    <Label className={labelCls}>Descriere (opțional)</Label>
                    <Textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={cn(inputCls, "min-h-[70px] resize-none")} placeholder="Notițe, impresii..." />
                  </div>
                )}
                
                {/* Privacy */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Switch checked={formData.isPrivate} onCheckedChange={c => setFormData({...formData, isPrivate: c})} />
                  <Label className="text-xs text-slate-300 cursor-pointer">Privat</Label>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-[#111111] border-t border-white/5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 text-slate-300">Anulează</Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl">Salvează</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TrashModal({ isOpen, onClose, type, trashedFilms, trashedBooks, trashedGames, setTrashedFilms, setTrashedBooks, setTrashedGames, onRefresh }: any) {
  const items = type === 'films' ? trashedFilms 
              : type === 'books' ? trashedBooks 
              : type === 'games' ? trashedGames.filter((g: any) => g.mode !== 'travel') 
              : trashedGames.filter((g: any) => g.mode === 'travel');

  const handleRestore = async (id: number) => {
    try {
      if (type === 'films') { await apiRestoreFilm(id); }
      else if (type === 'books') { await restoreBook(id); }
      else { await restoreGame(id); }
      onRefresh();
      toast({ title: 'Restaurat cu succes' });
    } catch (err) {
      toast({ title: 'Eroare', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      if (type === 'films') { await deleteFilm(id); setTrashedFilms(trashedFilms.filter((f: any) => f.id !== id)); }
      else if (type === 'books') { await deleteBook(id); setTrashedBooks(trashedBooks.filter((f: any) => f.id !== id)); }
      else { await deleteGame(id); setTrashedGames(trashedGames.filter((g: any) => g.id !== id)); }
      onRefresh();
      toast({ title: 'Șters definitiv' });
    } catch (err) {
      toast({ title: 'Eroare la ștergere', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-white/10 text-slate-200 max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl mb-4">
            <Trash2 className="w-5 h-5 text-rose-500" />
            Coș de gunoi
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex flex-col gap-2 p-3 bg-[#1a1a24] rounded-xl border border-white/5">
              <div className="flex justify-between items-start gap-2">
                <div className="font-semibold text-sm text-slate-200 line-clamp-2 leading-tight">
                  {item.title}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleRestore(item.id)} className="h-7 w-7 bg-[#222230] hover:bg-green-500/20 text-slate-400 hover:text-green-400 rounded-md">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handlePermanentDelete(item.id)} className="h-7 w-7 bg-[#222230] hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center text-slate-500 py-6 text-sm">
              Coșul de gunoi este gol.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
