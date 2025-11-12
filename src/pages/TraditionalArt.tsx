import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Plus, Search, Filter, ChevronLeft, ChevronRight, Palette, Brush, Images, Grid3X3, List, ChevronsUpDown, Edit, Trash2, FolderMinus, Trash, Undo2, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import AlbumCoverDialog from '@/components/AlbumCoverDialog';
import { AlbumNameDialog } from '@/components/AlbumNameDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Input } from '@/components/ui/input';
import { 
  createGalleryItem, 
  deleteGalleryItem, 
  updateGalleryItem, 
  getGalleryItemsByCategory, 
  softDeleteGalleryItem, 
  restoreGalleryItem, 
  getTrashedGalleryItemsByCategory,
  getAlbums,
  createAlbum,
  updateAlbum,
  addItemToAlbum,
  removeItemFromAlbum,
  deleteAlbum
} from '@/lib/api';
import type { Album } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import type { GalleryItem } from '@shared/schema';

interface TraditionalArtwork {
  id: number;
  title: string;
  medium: string;
  category: 'drawing' | 'painting' | 'sketch' | 'portrait' | 'landscape';
  image: string;
  date: string;
  dimensions?: string;
  description?: string;
  materials: string[];
  isPrivate?: boolean;
}

interface TraditionalAlbum {
  id: number;
  title: string;
  cover: string;
  artworks: TraditionalArtwork[];
  coverPos?: { x: number; y: number };
  coverScale?: number;
}

const TraditionalArt: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [selectedArtwork, setSelectedArtwork] = useState<TraditionalArtwork | null>(null);
  
  // Cloud-only state: albums built from DB
  // Display albums (hydrated from DB albums table)
  const [albums, setAlbums] = useState<TraditionalAlbum[]>([]);
  // Raw DB albums (used for membership + updates)
  const [rawAlbums, setRawAlbums] = useState<Album[]>([]);
  // Individual artworks (those not in any album)
  const [individualArtworks, setIndividualArtworks] = useState<TraditionalArtwork[]>([]);
  const [trash, setTrash] = useState<TraditionalArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Album UX state
  const [expandedAlbumIds, setExpandedAlbumIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridPage, setGridPage] = useState(0);
  const GRID_PER_PAGE = 24;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandAll, setExpandAll] = useState(true);
  const [editingAlbum, setEditingAlbum] = useState<TraditionalAlbum | null>(null);
  const [addingArtwork, setAddingArtwork] = useState(false);
  const [newArtworkFile, setNewArtworkFile] = useState<File | null>(null);
  const [newArtworkUploading, setNewArtworkUploading] = useState(false);
  const [newArtworkTitle, setNewArtworkTitle] = useState('');
  const [newArtworkMedium, setNewArtworkMedium] = useState('');
  const [newArtworkDescription, setNewArtworkDescription] = useState('');
  const [newArtworkMaterials, setNewArtworkMaterials] = useState('');
  const [newArtworkDimensions, setNewArtworkDimensions] = useState('');
  const [newArtworkDate, setNewArtworkDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [newArtworkCategory, setNewArtworkCategory] = useState<TraditionalArtwork['category']>('drawing');
  // New UI state for Add dialog
  const [addTab, setAddTab] = useState<'info' | 'details'>('info');
  const [materialsTags, setMaterialsTags] = useState<string[]>([]);
  const [materialsInput, setMaterialsInput] = useState('');
  const [dimW, setDimW] = useState<number | ''>('');
  const [dimH, setDimH] = useState<number | ''>('');
  // Destination for new artwork
  const [newArtworkDestination, setNewArtworkDestination] = useState<'individual' | 'existing' | 'new'>('individual');
  const [newArtworkAlbumId, setNewArtworkAlbumId] = useState<number | null>(null);
  const [inlineNewAlbumName, setInlineNewAlbumName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'art' | 'album'; albumId?: number; artworkId?: number } | null>(null);
  const [deleteAlbumDialog, setDeleteAlbumDialog] = useState<{ open: boolean; albumId: number | null; albumName: string; deleteArtworks: boolean; artworkCount: number }>({
    open: false,
    albumId: null,
    albumName: '',
    deleteArtworks: false,
    artworkCount: 0
  });
  const [deleteArtworkDialog, setDeleteArtworkDialog] = useState<{ open: boolean; artworkId: number | null; artworkTitle: string }>({
    open: false,
    artworkId: null,
    artworkTitle: ''
  });
  const [createAlbumFromSubmenu, setCreateAlbumFromSubmenu] = useState<{ open: boolean; artworkId: number | null }>({
    open: false,
    artworkId: null
  });
  const [addToAlbumDialog, setAddToAlbumDialog] = useState<{ open: boolean; artworkId: number | null }>({
    open: false,
    artworkId: null
  });
  const isMobile = useIsMobile();
  const [editingArtwork, setEditingArtwork] = useState<TraditionalArtwork | null>(null);
  // Edit UI state (similar to add)
  const [editTab, setEditTab] = useState<'info' | 'details'>('info');
  const [editMaterialsTags, setEditMaterialsTags] = useState<string[]>([]);
  const [editMaterialsInput, setEditMaterialsInput] = useState('');
  const [editDimW, setEditDimW] = useState<number | ''>('');
  const [editDimH, setEditDimH] = useState<number | ''>('');
  const [hoverAddMenu, setHoverAddMenu] = useState(false);
  // Drag & Drop state
  const [draggedArtworkId, setDraggedArtworkId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ type: 'album' | 'individual'; albumId?: number } | null>(null);

  // Long-press support (mobile)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);

  const handleTouchStart = (e: React.TouchEvent, target: { type: 'art' | 'album'; albumId?: number; artworkId?: number }) => {
    if (!isMobile || !isAdmin) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setLongPressActive(false);
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      setContextMenu({ x: touch.clientX, y: touch.clientY, ...target });
      if (navigator.vibrate) navigator.vibrate(40);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  };

  const handleTouchEnd = () => {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressActive(false);
    touchStartPos.current = null;
  };

  // Helper: transform GalleryItem (DB) → TraditionalArtwork (UI)
  const dbToArtwork = (item: GalleryItem): TraditionalArtwork => ({
    id: item.id,
    title: item.title,
    medium: (item as any).medium || 'Nespecificat',
    category: (item.subcategory as any) || 'drawing',
    image: item.image,
    date: (item as any).date || new Date().toISOString().slice(0,10),
    dimensions: (item as any).dimensions,
    description: (item as any).description,
    materials: Array.isArray((item as any).materials) ? (item as any).materials : [],
    isPrivate: item.isPrivate,
  });

  // Hydrate display albums from DB albums + artworks
  const hydrateAlbums = (artworks: TraditionalArtwork[], dbAlbums: Album[]): { displayAlbums: TraditionalAlbum[]; individuals: TraditionalArtwork[] } => {
    const visible = isAdmin ? artworks : artworks.filter(a => !a.isPrivate);
    const artworkById = new Map(visible.map(a => [a.id, a] as const));
    const usedIds = new Set<number>();

    const hydrated: TraditionalAlbum[] = dbAlbums.map(alb => {
      const items = (alb.itemIds || []).map(id => artworkById.get(id)).filter(Boolean) as TraditionalArtwork[];
      items.forEach(i => usedIds.add(i.id));
      // derive cover from first item if no icon; if icon treat it as encoded cover+pos
      let cover = '/placeholder.svg';
      let coverPos: { x: number; y: number } | undefined;
      let coverScale: number | undefined;
      if (alb.icon) {
        const parsed = parseIconWithPos(alb.icon);
        cover = parsed.url || (items[0]?.image || '/placeholder.svg');
        coverPos = parsed.pos;
        coverScale = parsed.scale;
      } else if (items[0]) cover = items[0].image;
      return {
        id: alb.id,
        title: alb.name,
        cover,
        artworks: items,
        coverPos,
        coverScale,
      } as TraditionalAlbum;
    });

    const individuals = visible.filter(a => !usedIds.has(a.id));

    return { displayAlbums: hydrated, individuals };
  };

  // Load artworks + albums + trash from cloud on mount / admin change
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [liveItems, trashedItems, dbAlbums] = await Promise.all([
          getGalleryItemsByCategory('art'),
          getTrashedGalleryItemsByCategory('art'),
          getAlbums('art'),
        ]);
        const artworks = liveItems.map(dbToArtwork);
        const trashedArtworks = trashedItems.map(dbToArtwork);
        const { displayAlbums, individuals } = hydrateAlbums(artworks, dbAlbums);
        setRawAlbums(dbAlbums);
        setAlbums(displayAlbums);
        setIndividualArtworks(individuals);
        setTrash(trashedArtworks);
      } catch (e) {
        console.error('[TraditionalArt] Failed initial load', e);
        toast({ title: 'Eroare', description: 'Nu am putut încărca datele din cloud.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  // Initialize expanded state when albums change (include synthetic individuals album via effect below)
  useEffect(() => {
    const all = new Set(albums.map(a => a.id));
    setExpandedAlbumIds(all);
    setExpandAll(true);
    setGridPage(0);
  }, [albums.length]);

  useEffect(() => {
    setGridPage(0);
  }, [viewMode]);

  function albumMatchesTitle(title: string, term: string) {
    return title.toLowerCase().includes(term);
  }

  const filteredAlbums = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filterFn = (a: TraditionalArtwork) => a.title.toLowerCase().includes(term) && (filterCategory === 'all' || a.category === filterCategory);

    // Synthetic Individuals album - only show if there are individual artworks
    const filteredIndividuals = individualArtworks.filter(filterFn);
    const individualsAlbum: TraditionalAlbum | null = individualArtworks.length > 0
      ? {
          id: -1,
          title: 'Fără album',
          cover: filteredIndividuals[0]?.image || individualArtworks[0]?.image || '/placeholder.svg',
          artworks: filteredIndividuals,
        }
      : null;

    const mapped = albums
      .map(album => ({
        ...album,
        artworks: album.artworks.filter(filterFn),
      }))
      .filter(a => a.artworks.length > 0 || albumMatchesTitle(a.title, term));

    return individualsAlbum ? [individualsAlbum, ...mapped] : mapped;
  }, [albums, individualArtworks, searchTerm, filterCategory]);

  const flatVisibleArtworks = useMemo(() => filteredAlbums.flatMap(a => a.artworks), [filteredAlbums]);
  
  const nextArtwork = () => {
    if (selectedArtwork && flatVisibleArtworks.length) {
      const currentIndex = flatVisibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const nextIndex = (currentIndex + 1) % flatVisibleArtworks.length;
      setSelectedArtwork(flatVisibleArtworks[nextIndex]);
    }
  };

  const prevArtwork = () => {
    if (selectedArtwork && flatVisibleArtworks.length) {
      const currentIndex = flatVisibleArtworks.findIndex(a => a.id === selectedArtwork.id);
      const prevIndex = (currentIndex - 1 + flatVisibleArtworks.length) % flatVisibleArtworks.length;
      setSelectedArtwork(flatVisibleArtworks[prevIndex]);
    }
  };

  // Keyboard navigation for fullscreen viewer
  const [isBrowserFullscreen, setIsBrowserFullscreen] = React.useState(false);
  React.useEffect(() => {
    const checkFs = () => {
      try {
        const inFsApi = !!(document as any).fullscreenElement || !!(document as any).webkitFullscreenElement || !!(document as any).mozFullScreenElement || !!(document as any).msFullscreenElement;
        const inFsHeuristic = window.innerHeight >= (window.screen?.height || 0) - 1 && window.innerWidth >= (window.screen?.width || 0) - 1;
        setIsBrowserFullscreen(inFsApi || inFsHeuristic);
      } catch {
        // ignore
      }
    };
    const onResize = () => checkFs();
    const onFsChange = () => checkFs();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        // state will change after the browser toggles; defer a tick
        setTimeout(checkFs, 100);
      }
    };
    checkFs();
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown as any);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown as any);
    };
  }, []);
  useEffect(() => {
    if (!selectedArtwork) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevArtwork();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextArtwork();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedArtwork(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtwork, flatVisibleArtworks]);

  function parseIconWithPos(icon: string): { url: string; pos?: { x: number; y: number }; scale?: number } {
    if (!icon) return { url: '' };
    const [url, hash] = icon.split('#');
    if (!hash) return { url };
    const params = new URLSearchParams(hash);
    const x = Number(params.get('x'));
    const y = Number(params.get('y'));
    const s = Number(params.get('s'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { url };
    const out: any = { url, pos: { x, y } };
    if (Number.isFinite(s) && s > 0) out.scale = s;
    return out;
  }

  function buildIconWithPos(url: string, pos?: { x: number; y: number }, scale?: number) {
    if (!url) return '';
    if (!pos) return url;
    const params = new URLSearchParams({ x: String(Math.round(pos.x)), y: String(Math.round(pos.y)) });
    if (scale && scale !== 1) params.set('s', String(Number(scale.toFixed(2))));
    return `${url}#${params.toString()}`;
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drawing': return <Pencil className="h-3 w-3" />;
      case 'painting': return <Brush className="h-3 w-3" />;
      default: return <Palette className="h-3 w-3" />;
    }
  };

  // Reload from cloud (artworks + albums + trash)
  const reloadArtworks = async () => {
    try {
      const [liveItems, trashedItems, dbAlbums] = await Promise.all([
        getGalleryItemsByCategory('art'),
        getTrashedGalleryItemsByCategory('art'),
        getAlbums('art'),
      ]);
      const artworks = liveItems.map(dbToArtwork);
      const trashedArtworks = trashedItems.map(dbToArtwork);
      const { displayAlbums, individuals } = hydrateAlbums(artworks, dbAlbums);
      setRawAlbums(dbAlbums);
      setAlbums(displayAlbums);
      setIndividualArtworks(individuals);
      setTrash(trashedArtworks);
    } catch (e) {
      console.error('[TraditionalArt] Reload failed', e);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumDialog.albumId) return;
    try {
      // Special case: "Fără album" (id=-1) - just delete all individual artworks
      if (deleteAlbumDialog.albumId === -1) {
        if (deleteAlbumDialog.deleteArtworks && individualArtworks.length > 0) {
          await Promise.all(individualArtworks.map(art => softDeleteGalleryItem(art.id)));
          toast({
            title: 'Opere șterse',
            description: `Toate cele ${individualArtworks.length} opere fără album au fost șterse.`
          });
        }
        await reloadArtworks();
        setDeleteAlbumDialog({ open: false, albumId: null, albumName: '', deleteArtworks: false, artworkCount: 0 });
        return;
      }

      // Regular album deletion
      // If deleteArtworks is true, soft delete all artworks in the album first
      if (deleteAlbumDialog.deleteArtworks) {
        const album = rawAlbums.find(a => a.id === deleteAlbumDialog.albumId);
        if (album?.itemIds && album.itemIds.length > 0) {
          await Promise.all(album.itemIds.map(id => softDeleteGalleryItem(id)));
        }
      }
      
      // Delete the album
      await deleteAlbum(deleteAlbumDialog.albumId);
      
      toast({
        title: 'Album șters',
        description: deleteAlbumDialog.deleteArtworks 
          ? `Albumul "${deleteAlbumDialog.albumName}" și toate operele au fost șterse.`
          : `Albumul "${deleteAlbumDialog.albumName}" a fost desființat. Operele sunt acum individuale.`
      });
      await reloadArtworks();
      setDeleteAlbumDialog({ open: false, albumId: null, albumName: '', deleteArtworks: false, artworkCount: 0 });
    } catch (error) {
      console.error('[TraditionalArt] Delete album failed', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge albumul.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteArtwork = async () => {
    if (!deleteArtworkDialog.artworkId) return;
    try {
      await softDeleteGalleryItem(deleteArtworkDialog.artworkId);
      toast({ 
        title: 'Mutat în coș', 
        description: `Opera "${deleteArtworkDialog.artworkTitle}" a fost ștearsă.` 
      });
      await reloadArtworks();
      setDeleteArtworkDialog({ open: false, artworkId: null, artworkTitle: '' });
    } catch (error) {
      console.error('[TraditionalArt] Delete artwork failed', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge opera.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateAlbumFromSubmenu = async (name: string, color: string) => {
    try {
      const createdAlb = await createAlbum({ 
        name, 
        color, 
        icon: null, 
        itemIds: createAlbumFromSubmenu.artworkId ? [createAlbumFromSubmenu.artworkId] : [], 
        contentType: 'art' 
      } as any);
      
      toast({ 
        title: 'Album creat', 
        description: `Albumul "${name}" a fost creat și opera a fost adăugată.` 
      });
      
      console.log('[TraditionalArt] Album created', createdAlb);
      await reloadArtworks();
      setCreateAlbumFromSubmenu({ open: false, artworkId: null });
      setContextMenu(null);
    } catch (err) {
      console.error('[TraditionalArt] Create album error', err);
      toast({ 
        title: 'Eroare', 
        description: 'Nu s-a putut crea albumul', 
        variant: 'destructive' 
      });
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, artworkId: number) => {
    if (!isAdmin) return;
    setDraggedArtworkId(artworkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (target: { type: 'album' | 'individual'; albumId?: number }) => {
    setDropTarget(target);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, target: { type: 'album' | 'individual'; albumId?: number }) => {
    e.preventDefault();
    if (!draggedArtworkId) return;

    try {
      // Find source (current album if any)
      const sourceAlbum = rawAlbums.find(a => a.itemIds?.includes(draggedArtworkId));
      
      if (target.type === 'album' && target.albumId) {
        // Moving to an album
        const targetAlbum = rawAlbums.find(a => a.id === target.albumId);
        if (!targetAlbum) return;

        // Remove from source album if exists
        if (sourceAlbum) {
          await removeItemFromAlbum(sourceAlbum, draggedArtworkId);
        }
        
        // Add to target album
        await addItemToAlbum(targetAlbum, draggedArtworkId);
        
        toast({
          title: 'Mutat',
          description: `Opera a fost mutată în albumul "${targetAlbum.name}".`
        });
      } else if (target.type === 'individual') {
        // Moving to individual (remove from any album)
        if (sourceAlbum) {
          await removeItemFromAlbum(sourceAlbum, draggedArtworkId);
          toast({
            title: 'Mutat',
            description: 'Opera a fost mutată în secțiunea individuală.'
          });
        }
      }

      await reloadArtworks();
    } catch (error) {
      console.error('[TraditionalArt] Drop failed', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut muta opera.',
        variant: 'destructive'
      });
    } finally {
      setDraggedArtworkId(null);
      setDropTarget(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 px-6 flex items-center justify-center">
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Pencil className="h-7 w-7 sm:h-8 sm:w-8 text-art-accent" />
              <h1 className="text-2xl sm:text-4xl font-bold gradient-text leading-tight">
                Artă Tradițională
              </h1>
            </div>
            <p className="hidden sm:block text-xl text-muted-foreground max-w-2xl mx-auto">
              Desene, picturi și creații artistice realizate cu instrumente tradiționale
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[180px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută albume sau lucrări..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Trash Button - show only when there are items */}
            {trash.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className="relative h-10 w-10 rounded-lg flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors sm:hidden"
                    title={`Coș (${trash.length})`}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[1.25rem] px-1 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-medium">
                      {trash.length}
                    </span>
                  </button>
                </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    <div className="flex items-center gap-2">
                      <Trash className="h-5 w-5" />
                      Coș de gunoi ({trash.length})
                    </div>
                  </DialogTitle>
                  <DialogDescription className="sr-only">Opere șterse (soft delete)</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {trash.map((art) => (
                    <div key={art.id} className="p-3 border rounded-lg bg-muted/20">
                      <div className="flex gap-3">
                        <img src={art.image} alt={art.title} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1 truncate">{art.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{art.medium}</p>
                          <p className="text-xs text-muted-foreground">{art.category}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={async () => {
                            try {
                              await restoreGalleryItem(art.id);
                              toast({ title: 'Restaurat', description: `${art.title} a fost restaurat.` });
                              await reloadArtworks();
                            } catch (e) {
                              console.error('[TraditionalArt] Restore error:', e);
                              toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
                            }
                          }}>
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7" onClick={async () => {
                            if (!confirm(`Ștergi permanent "${art.title}"? Această acțiune nu poate fi anulată.`)) return;
                            try {
                              await deleteGalleryItem(art.id);
                              toast({ title: 'Șters permanent', description: `${art.title} a fost șters definitiv.` });
                              await reloadArtworks();
                            } catch (e) {
                              console.error('[TraditionalArt] Permanent delete error:', e);
                              toast({ title: 'Eroare', description: 'Nu s-a putut șterge.', variant: 'destructive' });
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {trash.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trash className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Coșul este gol</p>
                    </div>
                  )}
                </div>

                {/* Bulk Actions */}
                {trash.length > 0 && (
                  <div className="border-t pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Restaurezi toate cele ${trash.length} opere din coș?`)) return;
                        try {
                          for (const art of trash) {
                            await restoreGalleryItem(art.id);
                          }
                          toast({ title: 'Restaurat', description: 'Toate operele au fost restaurate.' });
                          await reloadArtworks();
                        } catch (e) {
                          console.error('[TraditionalArt] Restore all error:', e);
                          toast({ title: 'Eroare', description: 'Nu s-au putut restaura toate operele.', variant: 'destructive' });
                        }
                      }}
                      className="flex-1"
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Restaurează tot
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Ștergi permanent toate cele ${trash.length} opere din coș? Această acțiune nu poate fi anulată!`)) return;
                        try {
                          for (const art of trash) {
                            await deleteGalleryItem(art.id);
                          }
                          toast({ title: 'Coș golit', description: 'Toate operele au fost șterse definitiv.' });
                          await reloadArtworks();
                        } catch (e) {
                          console.error('[TraditionalArt] Delete all error:', e);
                          toast({ title: 'Eroare', description: 'Nu s-au putut șterge toate operele.', variant: 'destructive' });
                        }
                      }}
                      className="flex-1"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Șterge tot
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            )}

            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v || 'all')}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-10">
                <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="drawing">Desenuri</SelectItem>
                <SelectItem value="painting">Picturi</SelectItem>
                <SelectItem value="sketch">Schițe</SelectItem>
                <SelectItem value="portrait">Portrete</SelectItem>
                <SelectItem value="landscape">Peisaje</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Switch
                checked={expandAll}
                onCheckedChange={(checked) => {
                  setExpandAll(!!checked);
                  setExpandedAlbumIds(checked ? new Set(filteredAlbums.map(a => a.id)) : new Set());
                }}
              />
            </div>

            {isAdmin && (
              <>
                <Button onClick={() => setAddingArtwork(true)} className="h-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md hidden sm:inline-flex">
                  <Brush className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Adaugă Operă</span>
                  <span className="sm:hidden">Adaugă</span>
                </Button>
                
                {trash.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="h-10 hidden sm:inline-flex"
                        title="Coșul de gunoi"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                          {trash.length}
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>
                          <div className="flex items-center gap-2">
                            <Trash className="h-5 w-5" />
                            Coș de gunoi ({trash.length})
                          </div>
                        </DialogTitle>
                        <DialogDescription className="sr-only">Opere șterse (soft delete)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {trash.map((art) => (
                          <div key={art.id} className="p-3 border rounded-lg bg-muted/20">
                            <div className="flex gap-3">
                              <img src={art.image} alt={art.title} className="w-16 h-16 object-cover rounded" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm mb-1 truncate">{art.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{art.medium}</p>
                                <p className="text-xs text-muted-foreground">{art.category}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={async () => {
                                  try {
                                    await restoreGalleryItem(art.id);
                                    toast({ title: 'Restaurat', description: `${art.title} a fost restaurat.` });
                                    await reloadArtworks();
                                  } catch (e) {
                                    console.error('[TraditionalArt] Restore error:', e);
                                    toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
                                  }
                                }}>
                                  <Undo2 className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={async () => {
                                  if (!confirm(`Ștergi permanent "${art.title}"? Această acțiune nu poate fi anulată.`)) return;
                                  try {
                                    await deleteGalleryItem(art.id);
                                    toast({ title: 'Șters permanent', description: `${art.title} a fost șters definitiv.` });
                                    await reloadArtworks();
                                  } catch (e) {
                                    console.error('[TraditionalArt] Permanent delete error:', e);
                                    toast({ title: 'Eroare', description: 'Nu s-a putut șterge.', variant: 'destructive' });
                                  }
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {trash.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Trash className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Coșul este gol</p>
                          </div>
                        )}
                      </div>

                      {/* Bulk Actions */}
                      {trash.length > 0 && (
                        <div className="border-t pt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Restaurezi toate cele ${trash.length} opere din coș?`)) return;
                              try {
                                for (const art of trash) {
                                  await restoreGalleryItem(art.id);
                                }
                                toast({ title: 'Restaurat', description: 'Toate operele au fost restaurate.' });
                                await reloadArtworks();
                              } catch (e) {
                                console.error('[TraditionalArt] Restore all error:', e);
                                toast({ title: 'Eroare', description: 'Nu s-au putut restaura toate operele.', variant: 'destructive' });
                              }
                            }}
                            className="flex-1"
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Restaurează tot
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Ștergi permanent toate cele ${trash.length} opere din coș? Această acțiune nu poate fi anulată!`)) return;
                              try {
                                for (const art of trash) {
                                  await deleteGalleryItem(art.id);
                                }
                                toast({ title: 'Coș golit', description: 'Toate operele au fost șterse definitiv.' });
                                await reloadArtworks();
                              } catch (e) {
                                console.error('[TraditionalArt] Delete all error:', e);
                                toast({ title: 'Eroare', description: 'Nu s-au putut șterge toate operele.', variant: 'destructive' });
                              }
                            }}
                            className="flex-1"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Șterge tot
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </div>

          {filteredAlbums.length === 0 && individualArtworks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nu s-au găsit opere.</p>
            </div>
          )}

          {viewMode === 'list' ? (
            // LIST VIEW
            <div className="space-y-4">
              {filteredAlbums.map((album) => {
                const isExpanded = expandedAlbumIds.has(album.id);
                return (
                  <div key={album.id} className="border border-border/60 rounded-xl overflow-hidden"
                    onDragOver={isAdmin && album.id !== -1 ? handleDragOver : undefined}
                    onDragEnter={isAdmin && album.id !== -1 ? () => handleDragEnter({ type: 'album', albumId: album.id }) : undefined}
                    onDragLeave={isAdmin && album.id !== -1 ? handleDragLeave : undefined}
                    onDrop={isAdmin && album.id !== -1 ? (e) => handleDrop(e, album.id === -1 ? { type: 'individual' } : { type: 'album', albumId: album.id }) : undefined}
                    style={{
                      backgroundColor: (dropTarget?.type === 'album' && dropTarget?.albumId === album.id) || (dropTarget?.type === 'individual' && album.id === -1) ? 'rgba(99, 102, 241, 0.1)' : undefined,
                      borderColor: (dropTarget?.type === 'album' && dropTarget?.albumId === album.id) || (dropTarget?.type === 'individual' && album.id === -1) ? 'rgba(99, 102, 241, 0.5)' : undefined
                    }}
                  >
                    <button
                      aria-expanded={isExpanded}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        const next = new Set(expandedAlbumIds);
                        if (next.has(album.id)) next.delete(album.id); else next.add(album.id);
                        setExpandedAlbumIds(next);
                        setExpandAll(next.size === filteredAlbums.length);
                      }}
                      onContextMenu={(e) => { 
                        if (album.id !== -1) {
                          e.preventDefault(); 
                          setContextMenu({ x: e.clientX, y: e.clientY, type: 'album', albumId: album.id }); 
                        }
                      }}
                      onTouchStart={(e) => album.id !== -1 ? handleTouchStart(e, { type: 'album', albumId: album.id }) : undefined}
                      onTouchMove={album.id !== -1 ? handleTouchMove : undefined}
                      onTouchEnd={album.id !== -1 ? handleTouchEnd : undefined}
                    >
                      <div className="relative w-12 h-12">
                        <div className="absolute -left-1 -top-1 w-10 h-10 rounded bg-muted border border-border/70" />
                        <div className="absolute -right-1 -bottom-1 w-10 h-10 rounded bg-muted border border-border/70" />
                        <div className="absolute inset-0 rounded overflow-hidden border border-border">
                          <img src={album.cover} alt={album.title} className="w-full h-full object-cover opacity-90" style={{ ...(album.coverPos ? { objectPosition: `${album.coverPos.x}% ${album.coverPos.y}%` } : {}), ...(album.coverScale ? { transform: `scale(${album.coverScale})`, transformOrigin: `${album.coverPos?.x ?? 50}% ${album.coverPos?.y ?? 50}%` } : {}) }} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{album.title}</h3>
                          <Badge variant="outline" className="bg-art-accent/10 border-art-accent/20 text-xs">
                            <Images className="h-3 w-3 mr-1" /> {album.artworks.length}
                          </Badge>
                          {isAdmin && (
                            <span className="ml-auto">
                              {album.id === -1 ? (
                                // Delete button for "Fără album"
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setDeleteAlbumDialog({
                                      open: true,
                                      albumId: -1,
                                      albumName: 'Fără album',
                                      deleteArtworks: true,
                                      artworkCount: individualArtworks.length
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                // Edit button for regular albums
                                <Button size="icon" className="h-7 w-7 bg-indigo-600 text-white hover:bg-indigo-600/90" onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Click pentru a {isExpanded ? 'închide' : 'extinde'} albumul</p>
                      </div>
                    </button>

                    <div className={`px-4 pb-4 transition-[max-height] duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'} overflow-hidden`}
                      onDragOver={isAdmin ? handleDragOver : undefined}
                      onDragEnter={isAdmin ? () => handleDragEnter({ type: 'album', albumId: album.id }) : undefined}
                      onDragLeave={isAdmin ? handleDragLeave : undefined}
                      onDrop={isAdmin ? (e) => handleDrop(e, { type: 'album', albumId: album.id }) : undefined}
                      style={{
                        backgroundColor: dropTarget?.type === 'album' && dropTarget?.albumId === album.id ? 'rgba(99, 102, 241, 0.1)' : undefined,
                        border: dropTarget?.type === 'album' && dropTarget?.albumId === album.id ? '2px dashed rgba(99, 102, 241, 0.5)' : undefined
                      }}
                    >
                      <div className="grid grid-cols-2 gap-5 sm:gap-4 pt-2 justify-center sm:justify-start sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {album.artworks.map((artwork, i) => (
                          <Card
                            key={artwork.id}
                            className={`group cursor-pointer overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300 ${
                              draggedArtworkId === artwork.id ? 'opacity-50 scale-95 ring-2 ring-art-accent' : ''
                            }`}
                            style={{ transitionDelay: isExpanded ? `${i * 40}ms` : '0ms', opacity: isExpanded ? 1 : 0, transform: isExpanded ? 'translateX(0)' : 'translateX(-12px)' }}
                            onClick={() => setSelectedArtwork(artwork)}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'art', albumId: album.id, artworkId: artwork.id }); }}
                            onTouchStart={(e) => handleTouchStart(e, { type: 'art', albumId: album.id, artworkId: artwork.id })}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            draggable={isAdmin}
                            onDragStart={isAdmin ? (e) => handleDragStart(e, artwork.id) : undefined}
                          >
                            <CardContent className="p-0">
                              <div className="w-full aspect-[4/3] overflow-hidden">
                                <img
                                  src={artwork.image}
                                  alt={artwork.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="px-3 py-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-[160px]">{artwork.title}</span>
                                  <Badge className="bg-art-accent/20 text-art-accent ml-2" variant="outline">
                                    <span className="flex items-center gap-1">
                                      {getCategoryIcon(artwork.category)}
                                    </span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{artwork.medium}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // GRID VIEW
            <>
              {(() => {
                const flattened = filteredAlbums.flatMap((album) => {
                  const isExpanded = expandedAlbumIds.has(album.id);
                  const parts: Array<{ key: string; node: React.ReactNode }> = [];
                  parts.push({
                    key: `album-${album.id}`,
                    node: (
                      <Card 
                        key={`album-${album.id}`} 
                        className="group overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300 min-w-[160px] relative"
                        onDragOver={isAdmin && album.id !== -1 ? handleDragOver : undefined}
                        onDragEnter={isAdmin && album.id !== -1 ? () => handleDragEnter({ type: album.id === -1 ? 'individual' : 'album', albumId: album.id !== -1 ? album.id : undefined }) : undefined}
                        onDragLeave={isAdmin && album.id !== -1 ? handleDragLeave : undefined}
                        onDrop={isAdmin && album.id !== -1 ? (e) => handleDrop(e, album.id === -1 ? { type: 'individual' } : { type: 'album', albumId: album.id }) : undefined}
                        style={{
                          backgroundColor: (dropTarget?.type === 'album' && dropTarget?.albumId === album.id) || (dropTarget?.type === 'individual' && album.id === -1) ? 'rgba(99, 102, 241, 0.1)' : undefined,
                          borderColor: (dropTarget?.type === 'album' && dropTarget?.albumId === album.id) || (dropTarget?.type === 'individual' && album.id === -1) ? 'rgba(99, 102, 241, 0.5)' : undefined
                        }}
                      >
                        <CardContent className="p-0">
                          <button
                            aria-expanded={isExpanded}
                            className="relative w-[160px] h-[160px] sm:w-[220px] sm:h-[300px]"
                            onClick={() => {
                              const next = new Set(expandedAlbumIds);
                              if (next.has(album.id)) next.delete(album.id); else next.add(album.id);
                              setExpandedAlbumIds(next);
                              setExpandAll(next.size === filteredAlbums.length);
                            }}
                            onContextMenu={(e) => { 
                              if (album.id !== -1) {
                                e.preventDefault(); 
                                setContextMenu({ x: e.clientX, y: e.clientY, type: 'album', albumId: album.id }); 
                              }
                            }}
                            onTouchStart={(e) => album.id !== -1 ? handleTouchStart(e, { type: 'album', albumId: album.id }) : undefined}
                            onTouchMove={album.id !== -1 ? handleTouchMove : undefined}
                            onTouchEnd={album.id !== -1 ? handleTouchEnd : undefined}
                          >
                            <div className="absolute -left-2 -top-2 w-10 h-10 rounded bg-muted border border-border/70 hidden sm:block" />
                            <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded bg-muted border border-border/70 hidden sm:block" />
                            <div className="absolute inset-0 bg-muted">
                              <img src={album.cover} alt={album.title} className="w-full h-full object-cover" style={{ ...(album.coverPos ? { objectPosition: `${album.coverPos.x}% ${album.coverPos.y}%` } : {}), ...(album.coverScale ? { transform: `scale(${album.coverScale})`, transformOrigin: `${album.coverPos?.x ?? 50}% ${album.coverPos?.y ?? 50}%` } : {}) }} />
                            </div>
                            {!isExpanded && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur px-2 py-2 text-sm flex items-center justify-between">
                              <span className="font-medium truncate max-w-[160px] sm:max-w-[200px]">{album.title}</span>
                              <span className="ml-2 flex items-center gap-1"><Images className="h-3 w-3" />{album.artworks.length}</span>
                            </div>
                          </button>
                          {isAdmin && (
                            <div className="absolute top-1 right-1 z-10">
                              {album.id === -1 ? (
                                // Delete button for "Fără album"
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive bg-background/80 hover:bg-destructive/10 hover:text-destructive backdrop-blur-sm" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setDeleteAlbumDialog({
                                      open: true,
                                      albumId: -1,
                                      albumName: 'Fără album',
                                      deleteArtworks: true,
                                      artworkCount: individualArtworks.length
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                // Edit button for regular albums
                                <Button size="icon" className="h-7 w-7 bg-indigo-600 text-white opacity-90 hover:opacity-100 hover:bg-indigo-600/90" onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ),
                  });
                  if (isExpanded) {
                    album.artworks.forEach((artwork, i) => {
                      parts.push({
                        key: `art-${album.id}-${artwork.id}`,
                        node: (
                          <Card
                            key={`art-${album.id}-${artwork.id}`}
                            className={`group cursor-pointer overflow-hidden border-art-accent/20 hover:border-art-accent/50 transition-all duration-300 min-w-[160px] ${
                              draggedArtworkId === artwork.id ? 'opacity-50 scale-95 ring-2 ring-art-accent' : ''
                            }`}
                            style={{ transitionDelay: `${i * 40}ms`, opacity: 1, transform: 'translateX(0)' }}
                            onClick={() => setSelectedArtwork(artwork)}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'art', albumId: album.id, artworkId: artwork.id }); }}
                            draggable={isAdmin}
                            onDragStart={isAdmin ? (e) => handleDragStart(e, artwork.id) : undefined}
                          >
                            <CardContent className="p-0">
                              <div className="w-[160px] h-[160px] sm:w-[220px] sm:h-[300px] overflow-hidden">
                                <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              </div>
                            </CardContent>
                          </Card>
                        ),
                      });
                    });
                  }
                  return parts;
                });

                const totalPages = Math.max(1, Math.ceil(flattened.length / GRID_PER_PAGE));
                const safePage = Math.min(gridPage, totalPages - 1);
                const pageItems = flattened.slice(safePage * GRID_PER_PAGE, (safePage + 1) * GRID_PER_PAGE);

                return (
                  <>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-3 mb-6">
                      {pageItems.map((it) => (
                        <div key={it.key}>{it.node}</div>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" onClick={() => setGridPage(Math.max(0, safePage - 1))} disabled={safePage === 0}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-muted-foreground">{safePage + 1} din {totalPages}</span>
                        <Button variant="outline" onClick={() => setGridPage(Math.min(totalPages - 1, safePage + 1))} disabled={safePage === totalPages - 1}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* Full Screen Modal - artwork viewer */}
      <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
        <DialogContent className={`${isBrowserFullscreen ? 'max-w-[100vw] w-full h-full max-h-screen p-0 bg-black border-0 rounded-none' : 'w-[96vw] sm:w-[92vw] lg:w-[88vw] max-w-none max-h-[94vh] p-0 bg-card'} overflow-hidden focus:outline-none focus-visible:outline-none`}>
          <DialogDescription className="sr-only">Vizualizare detalii operă</DialogDescription>
          {selectedArtwork && (
            <div className={`relative ${isBrowserFullscreen ? 'w-full h-full bg-black' : 'flex items-center justify-center h-full min-h[80vh]'}`}>
              <div className={`${isBrowserFullscreen ? 'absolute inset-0 flex items-center justify-center' : 'flex flex-col lg:flex-row items-center justify-center w-full gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:px-16 lg:py-8 max-w-[1400px] mx-auto'}`}>
                <div className={`${isBrowserFullscreen ? 'relative w-full h-full' : 'relative flex-1 w-full flex items-center justify-center lg:max-w-[55%]'}`}>
                  {/* Navigation Arrows - positioned relative to image */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-20 flex ${isBrowserFullscreen ? 'bg-black/20 hover:bg-black/60 text-white' : 'bg-background/20 hover:bg-background/90'} backdrop-blur-sm shadow-lg opacity-30 hover:opacity-100 transition-opacity duration-200 focus:outline-none focus-visible:outline-none active:opacity-30 h-8 w-8 sm:h-10 sm:w-10`}
                    onClick={(e) => {
                      prevArtwork();
                      e.currentTarget.blur();
                    }}
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-20 flex ${isBrowserFullscreen ? 'bg-black/20 hover:bg-black/60 text-white' : 'bg-background/20 hover:bg-background/90'} backdrop-blur-sm shadow-lg opacity-30 hover:opacity-100 transition-opacity duration-200 focus:outline-none focus-visible:outline-none active:opacity-30 h-8 w-8 sm:h-10 sm:w-10`}
                    onClick={(e) => {
                      nextArtwork();
                      e.currentTarget.blur();
                    }}
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>

                  <img 
                    src={selectedArtwork.image} 
                    alt={selectedArtwork.title}
                    className={`${isBrowserFullscreen ? 'absolute inset-0 w-full h-full object-contain' : 'w-full max-h-[40vh] sm:max-h-[60vh] lg:max-h-[75vh] object-contain rounded-lg shadow-2xl'}`}
                  />
                </div>
                {!isBrowserFullscreen && (
                  <div className="flex-1 w-full lg:max-w-[45%] flex flex-col justify-center">
                    <div className="space-y-1.5 sm:space-y-4 max-w-md mx-auto lg:mx-0 w-full">
                      <div>
                        <h3 className="text-lg sm:text-3xl font-bold mb-0.5 sm:mb-2">{selectedArtwork.title}</h3>
                        <p className="text-xs sm:text-xl text-muted-foreground mb-1 sm:mb-4">{selectedArtwork.medium}</p>
                        {selectedArtwork.description && (
                          <p className="text-xs sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">{selectedArtwork.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-4 py-1.5 sm:py-4 border-y border-border">
                        <div>
                          <span className="text-muted-foreground text-[10px] sm:text-sm">Categoria:</span>
                          <p className="font-medium text-xs sm:text-base capitalize">{selectedArtwork.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] sm:text-sm">Data:</span>
                          <p className="font-medium text-xs sm:text-base">{selectedArtwork.date}</p>
                        </div>
                        {selectedArtwork.dimensions && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground text-[10px] sm:text-sm">Dimensiuni:</span>
                            <p className="font-medium text-xs sm:text-base">{selectedArtwork.dimensions}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground text-[10px] sm:text-sm">Materiale folosite:</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                          {selectedArtwork.materials.map((material) => (
                            <Badge key={material} variant="outline" className="bg-art-accent/10 border-art-accent/20 text-[10px] sm:text-xs px-1.5 py-0 sm:px-2.5 sm:py-0.5">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin modals and UI */}
      {isAdmin && (
        <>
          {/* Add Artwork Modal */}
          <Dialog open={addingArtwork} onOpenChange={(o) => !o && setAddingArtwork(false)}>
            <DialogContent className="max-w-lg w-[min(100vw-1.5rem,28rem)] max-h-[90vh] overflow-y-auto p-5 sm:p-6 sm:top-[12vh] sm:translate-y-0">
              <DialogHeader>
                <DialogTitle>Adaugă Operă</DialogTitle>
                <DialogDescription className="sr-only">Completează detaliile și imaginea operei</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs value={addTab} onValueChange={(v) => setAddTab(v as 'info' | 'details')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Informații</TabsTrigger>
                    <TabsTrigger value="details">Detalii</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                    <div className="border-2 border-dashed rounded-md p-3 sm:p-4 bg-muted/20">
                      {newArtworkFile ? (
                        <img src={URL.createObjectURL(newArtworkFile)} alt="previzualizare" className="w-full h-44 sm:h-56 object-contain rounded" />
                      ) : (
                        <p className="text-sm text-muted-foreground">Selectează o imagine pentru operă</p>
                      )}
                      <label className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border cursor-pointer bg-background hover:bg-muted transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewArtworkFile(e.target.files?.[0] || null)} />
                        Alege imaginea
                      </label>
                    </div>
                    <Input placeholder="Titlu" value={newArtworkTitle} onChange={(e) => setNewArtworkTitle(e.target.value)} />
                    <Input placeholder="Tehnică" value={newArtworkMedium} onChange={(e) => setNewArtworkMedium(e.target.value)} />
                    <Textarea placeholder="Descriere" value={newArtworkDescription} onChange={(e) => setNewArtworkDescription(e.target.value)} />
                    <Select value={newArtworkCategory} onValueChange={(v) => setNewArtworkCategory(v as TraditionalArtwork['category'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drawing">Desen</SelectItem>
                        <SelectItem value="painting">Pictură</SelectItem>
                        <SelectItem value="portrait">Portret</SelectItem>
                        <SelectItem value="landscape">Peisaj</SelectItem>
                        <SelectItem value="sketch">Schiță</SelectItem>
                      </SelectContent>
                    </Select>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                    <div className="space-y-1">
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {newArtworkDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(newArtworkDate)}
                            onSelect={(d: Date | undefined) => d && setNewArtworkDate(d.toISOString().slice(0,10))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label>Dimensiuni</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="L" value={dimW} onChange={(e) => setDimW(e.target.value === '' ? '' : Number(e.target.value))} className="[appearance:textfield]" />
                        <span className="text-muted-foreground">×</span>
                        <Input type="number" placeholder="l" value={dimH} onChange={(e) => setDimH(e.target.value === '' ? '' : Number(e.target.value))} className="[appearance:textfield]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Materiale</Label>
                      <div className="border rounded-md p-2">
                        <input
                          className="w-full bg-transparent outline-none text-sm"
                          placeholder="Scrie un material..."
                          value={materialsInput}
                          onChange={(e) => setMaterialsInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const parts = materialsInput.split(',').map(m => m.trim()).filter(Boolean);
                              if (parts.length) {
                                const next = Array.from(new Set([...materialsTags, ...parts]));
                                setMaterialsTags(next);
                                setMaterialsInput('');
                              }
                            }
                          }}
                          onBlur={() => {
                            const parts = materialsInput.split(',').map(m => m.trim()).filter(Boolean);
                            if (parts.length) {
                              const next = Array.from(new Set([...materialsTags, ...parts]));
                              setMaterialsTags(next);
                              setMaterialsInput('');
                            }
                          }}
                        />
                      </div>
                      {materialsTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {materialsTags.map((m) => (
                            <Badge key={m} variant="secondary" className="bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-300">
                              <span className="mr-1">{m}</span>
                              <button className="text-xs hover:text-violet-900 dark:hover:text-violet-100" onClick={() => setMaterialsTags(materialsTags.filter(x => x !== m))}>×</button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Destinație</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button type="button" className={`border rounded-md p-3 text-left hover:bg-muted transition ${newArtworkDestination==='individual' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-border'}`} onClick={() => setNewArtworkDestination('individual')}>
                          <div className="font-medium">Individual</div>
                          <div className="text-xs text-muted-foreground">Fără album</div>
                        </button>
                        <button type="button" className={`border rounded-md p-3 text-left hover:bg-muted transition ${newArtworkDestination==='existing' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-border'}`} onClick={() => setNewArtworkDestination('existing')}>
                          <div className="font-medium">Album existent</div>
                          <div className="text-xs text-muted-foreground">Alege un album</div>
                        </button>
                        <button type="button" className={`border rounded-md p-3 text-left hover:bg-muted transition ${newArtworkDestination==='new' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-border'}`} onClick={() => setNewArtworkDestination('new')}>
                          <div className="font-medium">Album nou</div>
                          <div className="text-xs text-muted-foreground">Creează și adaugă</div>
                        </button>
                      </div>
                      {newArtworkDestination === 'existing' && (
                        <Select value={newArtworkAlbumId ? String(newArtworkAlbumId) : ''} onValueChange={(v) => setNewArtworkAlbumId(Number(v))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Alege album" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawAlbums.map(a => (
                              <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {newArtworkDestination === 'new' && (
                        <Input placeholder="Nume album" value={inlineNewAlbumName} onChange={(e) => setInlineNewAlbumName(e.target.value)} />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => { 
                    setAddingArtwork(false); 
                    setNewArtworkFile(null); 
                    setNewArtworkTitle(''); 
                    setNewArtworkMedium(''); 
                    setNewArtworkDescription(''); 
                    setNewArtworkMaterials(''); 
                    setNewArtworkDimensions(''); 
                    setNewArtworkCategory('drawing');
                    setNewArtworkDate(new Date().toISOString().slice(0,10));
                    setMaterialsTags([]); 
                    setMaterialsInput(''); 
                    setDimW(''); 
                    setDimH(''); 
                    setAddTab('info');
                    setInlineNewAlbumName('');
                    setNewArtworkAlbumId(null);
                    setNewArtworkDestination('individual');
                  }}>
                    Anulează
                  </Button>
                  <Button disabled={!newArtworkFile || !newArtworkTitle || newArtworkUploading}
                    onClick={async () => {
                        if (!newArtworkFile) return;
                        setNewArtworkUploading(true);
                        try {
                          // Upload to Cloudinary
                          const fd = new FormData();
                          fd.append('file', newArtworkFile);
                          fd.append('folder', 'portfolio-art-items');
                          const resp = await fetch('/api/upload/image', { method: 'POST', body: fd });
                          if (!resp.ok) {
                            const err = await resp.text();
                            throw new Error(`Upload failed: ${err}`);
                          }
                          const data = await resp.json();
                          console.log('[TraditionalArt] Upload success:', data);
                          
                          const resolvedMaterials = materialsTags.length ? materialsTags : newArtworkMaterials.split(',').map(m => m.trim()).filter(Boolean);
                          const resolvedDimensions = dimW !== '' && dimH !== '' ? `${dimW}x${dimH}` : (newArtworkDimensions || undefined);
                          // Persist to DB
                          const created = await createGalleryItem({
                            title: newArtworkTitle,
                            image: data.url,
                            category: 'art',
                            subcategory: newArtworkCategory,
                            isPrivate: false,
                            medium: newArtworkMedium || 'Nespecificat',
                            description: newArtworkDescription || undefined,
                            materials: resolvedMaterials,
                            dimensions: resolvedDimensions,
                            date: newArtworkDate,
                          } as any);
                          console.log('[TraditionalArt] Created in DB:', created);

                          // Destination handling
                          if (newArtworkDestination === 'existing' && newArtworkAlbumId) {
                            const album = rawAlbums.find(a => a.id === newArtworkAlbumId);
                            if (album) await addItemToAlbum(album, created.id);
                          } else if (newArtworkDestination === 'new' && inlineNewAlbumName.trim()) {
                            const newAlb = await createAlbum({ name: inlineNewAlbumName.trim(), color: null, icon: null, itemIds: [created.id], contentType: 'art' } as any);
                            console.log('[TraditionalArt] Created new album', newAlb);
                          }
                          
                          toast({ title: 'Salvat', description: 'Opera a fost adăugată în cloud.' });
                          setAddingArtwork(false);
                          // Reset all form fields
                          setNewArtworkFile(null);
                          setNewArtworkTitle('');
                          setNewArtworkMedium('');
                          setNewArtworkDescription('');
                          setNewArtworkMaterials('');
                          setNewArtworkDimensions('');
                          setNewArtworkCategory('drawing');
                          setNewArtworkDate(new Date().toISOString().slice(0,10));
                          setMaterialsTags([]);
                          setMaterialsInput('');
                          setDimW('');
                          setDimH('');
                          setAddTab('info');
                          setInlineNewAlbumName('');
                          setNewArtworkAlbumId(null);
                          setNewArtworkDestination('individual');
                          
                          // Reload from cloud
                          await reloadArtworks();
                        } catch (e) {
                          console.error('[TraditionalArt] Add artwork error:', e);
                          toast({ title: 'Eroare', description: `Nu am putut salva opera: ${e instanceof Error ? e.message : 'Eroare necunoscută'}`, variant: 'destructive' });
                        } finally {
                          setNewArtworkUploading(false);
                        }
                      }}>
                    {newArtworkUploading ? 'Se încarcă…' : 'Salvează'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Artwork Modal */}
          <Dialog open={!!editingArtwork} onOpenChange={(o) => !o && setEditingArtwork(null)}>
            <DialogContent className="max-w-lg w-[min(100vw-1.5rem,28rem)] max-h-[90vh] overflow-y-auto p-5 sm:p-6 sm:top-[12vh] sm:translate-y-0">
              <DialogHeader>
                <DialogTitle>Editează Operă</DialogTitle>
                <DialogDescription className="sr-only">Modifică detaliile și imaginea operei</DialogDescription>
              </DialogHeader>
              {editingArtwork && (
                <div className="space-y-4">
                  <Tabs value={editTab} onValueChange={(v) => setEditTab(v as 'info' | 'details')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="info">Informații</TabsTrigger>
                      <TabsTrigger value="details">Detalii</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                      <div className="border rounded p-2 sm:p-3 flex flex-col items-center gap-3 bg-muted/30">
                        <img src={editingArtwork.image} alt={editingArtwork.title} className="w-full h-40 sm:h-48 object-contain rounded" />
                        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border cursor-pointer bg-background hover:bg-muted transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !editingArtwork) return;
                            try {
                              console.log('[TraditionalArt] Uploading new image for artwork:', editingArtwork.id);
                              const fd = new FormData();
                              fd.append('file', file);
                              fd.append('folder', 'portfolio-art-items');
                              const resp = await fetch('/api/upload/image', { method: 'POST', body: fd });
                              if (!resp.ok) {
                                const err = await resp.text();
                                throw new Error(`Upload failed: ${err}`);
                              }
                              const data = await resp.json();
                              console.log('[TraditionalArt] Image uploaded:', data);
                              
                              setEditingArtwork(prev => prev ? { ...prev, image: data.url } : prev);
                              
                              const updated = await updateGalleryItem(editingArtwork.id, { image: data.url } as any);
                              console.log('[TraditionalArt] Image updated in DB:', updated);
                              toast({ title: 'Salvat', description: 'Imaginea a fost actualizată.' });
                            } catch (err) {
                              console.error('[TraditionalArt] Image update error:', err);
                              toast({ title: 'Eroare', description: `Nu am putut actualiza imaginea: ${err instanceof Error ? err.message : 'Eroare necunoscută'}`, variant: 'destructive' });
                            }
                          }} />
                          <span>Schimbă imaginea</span>
                        </label>
                      </div>
                      <Input placeholder="Titlu" value={editingArtwork.title} onChange={(e) => setEditingArtwork(prev => prev ? { ...prev, title: e.target.value } : prev)} />
                      <Input placeholder="Tehnică" value={editingArtwork.medium} onChange={(e) => setEditingArtwork(prev => prev ? { ...prev, medium: e.target.value } : prev)} />
                      <Textarea placeholder="Descriere" value={editingArtwork.description || ''} onChange={(e) => setEditingArtwork(prev => prev ? { ...prev, description: e.target.value } : prev)} />
                      <Select value={editingArtwork.category} onValueChange={(v) => setEditingArtwork(prev => prev ? { ...prev, category: v as TraditionalArtwork['category'] } : prev)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drawing">Desen</SelectItem>
                          <SelectItem value="painting">Pictură</SelectItem>
                          <SelectItem value="portrait">Portret</SelectItem>
                          <SelectItem value="landscape">Peisaj</SelectItem>
                          <SelectItem value="sketch">Schiță</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingArtwork(null)}>Anulează</Button>
                        <Button onClick={async () => {
                          if (!editingArtwork) return;
                          try {
                            console.log('[TraditionalArt] Updating artwork:', editingArtwork.id, editingArtwork);
                            const updated = await updateGalleryItem(editingArtwork.id, {
                              title: editingArtwork.title,
                              medium: editingArtwork.medium,
                              description: editingArtwork.description,
                              materials: editingArtwork.materials,
                              dimensions: editingArtwork.dimensions,
                              date: editingArtwork.date,
                              subcategory: editingArtwork.category,
                            } as any);
                            console.log('[TraditionalArt] Update result:', updated);
                            toast({ title: 'Salvat', description: 'Modificările au fost salvate în cloud.' });
                            setEditingArtwork(null);
                            await reloadArtworks();
                          } catch (e) {
                            console.error('[TraditionalArt] Edit error:', e);
                            toast({ title: 'Eroare', description: `Nu s-a putut salva: ${e instanceof Error ? e.message : 'Eroare necunoscută'}`, variant: 'destructive' });
                          }
                        }}>Salvează</Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                      <div className="space-y-1">
                        <Label>Data</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {editingArtwork.date}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={new Date(editingArtwork.date)}
                              onSelect={(d: Date | undefined) => d && setEditingArtwork(prev => prev ? { ...prev, date: d.toISOString().slice(0,10) } : prev)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label>Dimensiuni</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" placeholder="L" value={editDimW} onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditDimW(val);
                            const h = editDimH;
                            if (val !== '' && h !== '') {
                              setEditingArtwork(prev => prev ? { ...prev, dimensions: `${val} × ${h} cm` } : prev);
                            }
                          }} className="[appearance:textfield]" />
                          <span className="text-muted-foreground">×</span>
                          <Input type="number" placeholder="l" value={editDimH} onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditDimH(val);
                            const w = editDimW;
                            if (w !== '' && val !== '') {
                              setEditingArtwork(prev => prev ? { ...prev, dimensions: `${w} × ${val} cm` } : prev);
                            }
                          }} className="[appearance:textfield]" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Materiale</Label>
                        <div className="border rounded-md p-2">
                          <input
                            className="w-full bg-transparent outline-none text-sm"
                            placeholder="Scrie un material..."
                            value={editMaterialsInput}
                            onChange={(e) => setEditMaterialsInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const parts = editMaterialsInput.split(',').map(m => m.trim()).filter(Boolean);
                                if (parts.length) {
                                  const next = Array.from(new Set([...editMaterialsTags, ...parts]));
                                  setEditMaterialsTags(next);
                                  setEditingArtwork(prev => prev ? { ...prev, materials: next } : prev);
                                  setEditMaterialsInput('');
                                }
                              }
                            }}
                            onBlur={() => {
                              const parts = editMaterialsInput.split(',').map(m => m.trim()).filter(Boolean);
                              if (parts.length) {
                                const next = Array.from(new Set([...editMaterialsTags, ...parts]));
                                setEditMaterialsTags(next);
                                setEditingArtwork(prev => prev ? { ...prev, materials: next } : prev);
                                setEditMaterialsInput('');
                              }
                            }}
                          />
                        </div>
                        {editMaterialsTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editMaterialsTags.map((mat) => (
                              <Badge key={mat} variant="secondary" className="bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-300">
                                <span className="mr-1">{mat}</span>
                                <button
                                  className="text-xs hover:text-violet-900 dark:hover:text-violet-100"
                                  onClick={() => {
                                    const next = editMaterialsTags.filter((m) => m !== mat);
                                    setEditMaterialsTags(next);
                                    setEditingArtwork(prev => prev ? { ...prev, materials: next } : prev);
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingArtwork(null)}>Anulează</Button>
                        <Button onClick={async () => {
                          if (!editingArtwork) return;
                          try {
                            console.log('[TraditionalArt] Updating artwork:', editingArtwork.id, editingArtwork);
                            const updated = await updateGalleryItem(editingArtwork.id, {
                              title: editingArtwork.title,
                              medium: editingArtwork.medium,
                              description: editingArtwork.description,
                              materials: editingArtwork.materials,
                              dimensions: editingArtwork.dimensions,
                              date: editingArtwork.date,
                              subcategory: editingArtwork.category,
                            } as any);
                            console.log('[TraditionalArt] Update result:', updated);
                            toast({ title: 'Salvat', description: 'Modificările au fost salvate în cloud.' });
                            setEditingArtwork(null);
                            await reloadArtworks();
                          } catch (e) {
                            console.error('[TraditionalArt] Edit error:', e);
                            toast({ title: 'Eroare', description: `Nu s-a putut salva: ${e instanceof Error ? e.message : 'Eroare necunoscută'}`, variant: 'destructive' });
                          }
                        }}>Salvează</Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Context Menu */}
          {contextMenu && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
              <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 60 }}>
                <div className="bg-popover border rounded shadow-md p-1 w-48 backdrop-blur-sm">
                  {contextMenu.type === 'art' && (
                    <>
                      {/* Edit artwork */}
                      <button 
                        className="w-full text-left p-2 hover:bg-muted/50 rounded flex items-center gap-2" 
                        onMouseEnter={() => setHoverAddMenu(false)}
                        onClick={() => {
                        const album = albums.find(a => a.id === contextMenu.albumId);
                        const art = album?.artworks.find(w => w.id === contextMenu.artworkId) || individualArtworks.find(w => w.id === contextMenu.artworkId);
                        if (art) {
                          setEditingArtwork(art);
                          // Initialize edit state
                          setEditTab('info');
                          setEditMaterialsTags(art.materials || []);
                          setEditMaterialsInput('');
                          // Parse dimensions if exist
                          if (art.dimensions) {
                            const match = art.dimensions.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);
                            if (match) {
                              setEditDimW(parseFloat(match[1]));
                              setEditDimH(parseFloat(match[2]));
                            } else {
                              setEditDimW('');
                              setEditDimH('');
                            }
                          } else {
                            setEditDimW('');
                            setEditDimH('');
                          }
                        }
                        setContextMenu(null);
                      }}>
                        <Edit className="h-4 w-4" />
                        Editează
                      </button>
                      {/* Remove from album */}
                      {contextMenu.albumId !== -1 && contextMenu.albumId != null && (
                        <button 
                          className="w-full text-left p-2 hover:bg-muted/50 rounded flex items-center gap-2" 
                          onMouseEnter={() => setHoverAddMenu(false)}
                          onClick={async () => {
                          try {
                            const target = rawAlbums.find(r => r.id === contextMenu.albumId);
                            if (target && contextMenu.artworkId) {
                              await removeItemFromAlbum(target, contextMenu.artworkId);
                              toast({ title: 'Eliminat', description: 'Opera a fost scoasă din album.' });
                              await reloadArtworks();
                            }
                          } catch (err) {
                            toast({ title: 'Eroare', description: 'Nu s-a putut scoate din album', variant: 'destructive' });
                          } finally {
                            setContextMenu(null);
                          }
                        }}>
                          <FolderMinus className="h-4 w-4" />
                          Scoate din album
                        </button>
                      )}
                      {/* Add to album - for all artworks */}
                      <button
                        className="w-full text-left p-2 hover:bg-muted/50 rounded flex items-center gap-2"
                        onMouseEnter={() => setHoverAddMenu(false)}
                        onClick={() => {
                          setAddToAlbumDialog({ open: true, artworkId: contextMenu.artworkId || null });
                          setContextMenu(null);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Adaugă în album
                      </button>
                      {/* Soft delete */}
                      <button 
                        className="w-full text-left p-2 hover:bg-destructive/10 text-destructive rounded flex items-center gap-2" 
                        onMouseEnter={() => setHoverAddMenu(false)}
                        onClick={() => {
                        const artAlbum = albums.find(a => a.id === contextMenu.albumId);
                        const deletedArt = artAlbum?.artworks.find(w => w.id === contextMenu.artworkId) || individualArtworks.find(w => w.id === contextMenu.artworkId);
                        if (deletedArt) {
                          setDeleteArtworkDialog({
                            open: true,
                            artworkId: deletedArt.id,
                            artworkTitle: deletedArt.title
                          });
                        }
                        setContextMenu(null);
                      }}>
                        <Trash2 className="h-4 w-4" />
                        Șterge
                      </button>
                    </>
                  )}
                  {contextMenu.type === 'album' && contextMenu.albumId !== -1 && (
                    <>
                      {/* Edit album - only for real albums */}
                      <button className="w-full text-left p-2 hover:bg-muted/50 rounded flex items-center gap-2" onClick={() => {
                        const album = albums.find(a => a.id === contextMenu.albumId);
                        if (album) setEditingAlbum(album);
                        setContextMenu(null);
                      }}>
                        <Edit className="h-4 w-4" />
                        Editează album
                      </button>
                      {/* Desființează album - only for real albums */}
                      <button className="w-full text-left p-2 hover:bg-muted/50 rounded flex items-center gap-2" onClick={() => {
                        const album = albums.find(a => a.id === contextMenu.albumId);
                        if (album) {
                          setDeleteAlbumDialog({
                            open: true,
                            albumId: album.id,
                            albumName: album.title,
                            deleteArtworks: false,
                            artworkCount: album.artworks.length
                          });
                        }
                        setContextMenu(null);
                      }}>
                        <FolderMinus className="h-4 w-4" />
                        Desființează album
                      </button>
                      {/* Delete album */}
                      <button className="w-full text-left p-2 hover:bg-destructive/10 text-destructive rounded flex items-center gap-2" onClick={() => {
                        const album = albums.find(a => a.id === contextMenu.albumId);
                        if (album) {
                          setDeleteAlbumDialog({
                            open: true,
                            albumId: album.id,
                            albumName: album.title,
                            deleteArtworks: true,
                            artworkCount: album.artworks.length
                          });
                        }
                        setContextMenu(null);
                      }}>
                        <Trash2 className="h-4 w-4" />
                        Șterge album
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* FAB for mobile add */}
          <Button onClick={() => setAddingArtwork(true)} size="icon" className="sm:hidden fixed bottom-5 right-5 h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>

          {/* Album Cover Dialog */}
          {editingAlbum && editingAlbum.id !== -1 && (
            <AlbumCoverDialog
              open={!!editingAlbum}
              onOpenChange={(o) => { if (!o) setEditingAlbum(null); }}
              album={editingAlbum ? {
                id: editingAlbum.id,
                title: editingAlbum.title,
                cover: editingAlbum.cover,
                artworks: editingAlbum.artworks.map(a => ({ id: a.id, title: a.title, image: a.image })),
                coverPos: editingAlbum.coverPos,
              } : null}
              onSave={async (updates) => {
                try {
                  const dbAlbum = rawAlbums.find(a => a.id === editingAlbum?.id);
                  if (!dbAlbum) return;
                  const icon = buildIconWithPos(updates.cover || editingAlbum?.cover || '', updates.coverPos || editingAlbum?.coverPos, (updates as any).coverScale || editingAlbum?.coverScale);
                  await updateAlbum(dbAlbum.id, { name: updates.title || editingAlbum?.title, icon } as any);
                  toast({ title: 'Salvat', description: 'Album actualizat.' });
                  setEditingAlbum(null);
                  await reloadArtworks();
                } catch (err) {
                  console.error(err);
                  toast({ title: 'Eroare', description: 'Nu s-a putut actualiza albumul', variant: 'destructive' });
                }
              }}
              onRemoveFromAlbum={async (artId) => {
                try {
                  const dbAlbum = rawAlbums.find(a => a.id === editingAlbum?.id);
                  if (!dbAlbum) return;
                  await removeItemFromAlbum(dbAlbum, artId);
                  toast({ title: 'Eliminat', description: 'Opera a fost scoasă din album.' });
                  await reloadArtworks();
                } catch (err) {
                  toast({ title: 'Eroare', description: 'Nu s-a putut elimina din album', variant: 'destructive' });
                }
              }}
              onDeleteArtwork={async (artId) => {
                try {
                  await softDeleteGalleryItem(artId);
                  toast({ title: 'Mutat în coș', description: 'Opera a fost ștearsă.' });
                  await reloadArtworks();
                } catch (err) {
                  toast({ title: 'Eroare', description: 'Nu s-a putut șterge opera', variant: 'destructive' });
                }
              }}
            />
          )}

          {/* Delete Album Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteAlbumDialog.open}
            onOpenChange={(open) => setDeleteAlbumDialog({ ...deleteAlbumDialog, open })}
            title={deleteAlbumDialog.deleteArtworks ? "Șterge album + opere" : "Desființează album"}
            message={
              deleteAlbumDialog.deleteArtworks
                ? `Sigur vrei să ștergi albumul "${deleteAlbumDialog.albumName}" și toate cele ${deleteAlbumDialog.artworkCount} opere din el? Această acțiune este PERMANENTĂ și nu poate fi anulată!`
                : `Sigur vrei să desființezi albumul "${deleteAlbumDialog.albumName}"? Cele ${deleteAlbumDialog.artworkCount} opere din album vor deveni opere individuale. Albumul va fi șters, dar operele vor rămâne.`
            }
            type="warning"
            onConfirm={handleDeleteAlbum}
            confirmText={deleteAlbumDialog.deleteArtworks ? "Șterge tot" : "Desființează"}
            cancelText="Anulează"
          />

          {/* Delete Artwork Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteArtworkDialog.open}
            onOpenChange={(open) => setDeleteArtworkDialog({ ...deleteArtworkDialog, open })}
            title="Șterge operă"
            message={`Sigur vrei să muți opera "${deleteArtworkDialog.artworkTitle}" în coș? Poate fi restaurată mai târziu din secțiunea Coș.`}
            type="warning"
            onConfirm={handleDeleteArtwork}
            confirmText="Mută în coș"
            cancelText="Anulează"
          />

          {/* Create Album from Submenu Dialog */}
          <AlbumNameDialog
            open={createAlbumFromSubmenu.open}
            onOpenChange={(open) => setCreateAlbumFromSubmenu({ ...createAlbumFromSubmenu, open })}
            onConfirm={handleCreateAlbumFromSubmenu}
          />

          {/* Add to Album Dialog */}
          <Dialog open={addToAlbumDialog.open} onOpenChange={(open) => setAddToAlbumDialog({ open, artworkId: null })}>
            <DialogContent className="sm:max-w-md max-w-[95vw]">
              <DialogHeader>
                <DialogTitle>Adaugă în album</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {albums.filter(a => a.id !== -1).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nu există albume create încă</p>
                    <Button
                      onClick={() => {
                        setCreateAlbumFromSubmenu({ 
                          open: true, 
                          artworkId: addToAlbumDialog.artworkId 
                        });
                        setAddToAlbumDialog({ open: false, artworkId: null });
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Creează primul album
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {albums.filter(a => a.id !== -1).map(album => (
                      <Button
                        key={album.id}
                        variant="outline"
                        onClick={async () => {
                          if (!addToAlbumDialog.artworkId) return;
                          try {
                            const target = rawAlbums.find(r => r.id === album.id);
                            if (target) {
                              await addItemToAlbum(target, addToAlbumDialog.artworkId);
                              toast({ title: 'Adăugat', description: `Opera a fost adăugată în "${album.title}".` });
                              await reloadArtworks();
                            }
                          } catch (err) {
                            toast({ title: 'Eroare', description: 'Nu s-a putut adăuga în album', variant: 'destructive' });
                          }
                          setAddToAlbumDialog({ open: false, artworkId: null });
                        }}
                        className="w-full justify-start gap-3 h-12"
                      >
                        <div className="w-4 h-4 rounded-full bg-art-accent/70 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{album.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {album.artworks.length} {album.artworks.length === 1 ? 'operă' : 'opere'}
                          </div>
                        </div>
                      </Button>
                    ))}
                    
                    <hr className="my-3" />
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreateAlbumFromSubmenu({ 
                          open: true, 
                          artworkId: addToAlbumDialog.artworkId 
                        });
                        setAddToAlbumDialog({ open: false, artworkId: null });
                      }}
                      className="w-full justify-start gap-3 h-12 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Creează album nou</div>
                        <div className="text-xs text-muted-foreground">Cu această operă</div>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default TraditionalArt;
