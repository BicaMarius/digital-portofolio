import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, Calendar, MoreVertical, Edit, Trash2, Trash, Undo2, X as XIcon, Check } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import {
  getGalleryItemsByCategory,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  softDeleteGalleryItem,
  restoreGalleryItem,
  getTrashedGalleryItemsByCategory
} from '@/lib/api';
import type { GalleryItem } from '@shared/schema';

interface Photo {
  id: number;
  title: string;
  device?: string;
  category: 'portrait' | 'landscape' | 'street' | 'macro' | 'night';
  image: string;
  date: string;
  location?: string;
  isPrivate?: boolean;
}

const mockPhotos: Photo[] = [
  {
    id: 1,
    title: 'Sunset Mountains',
    device: 'Canon EOS R5',
    category: 'landscape',
    image: '/placeholder.svg',
    date: '2024-01-15',
    location: 'Carpații Meridionali'
  },
  {
    id: 2,
    title: 'Street Portrait',
    device: 'Sony A7III',
    category: 'portrait',
    image: '/placeholder.svg',
    date: '2024-02-10',
    location: 'București'
  },
  {
    id: 3,
    title: 'Night City',
    device: 'iPhone 15 Pro',
    category: 'night',
    image: '/placeholder.svg',
    date: '2024-03-05',
    location: 'Cluj-Napoca',
    isPrivate: true
  }
];

const Photography: React.FC = () => {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const photosPerPage = viewMode === 'grid' ? 12 : 6;

  // Cloud state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [trash, setTrash] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD dialogs
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoDevice, setNewPhotoDevice] = useState('');
  const [newPhotoDate, setNewPhotoDate] = useState(() => new Date().getFullYear().toString());
  const [newPhotoLocation, setNewPhotoLocation] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<Photo['category']>('landscape');
  const [newPhotoUploading, setNewPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic');

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deletePhotoDialog, setDeletePhotoDialog] = useState<{ open: boolean; photoId: number | null; photoTitle: string }>({
    open: false,
    photoId: null,
    photoTitle: ''
  });

  // Long press support
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);

  // DB to Photo transformation
  const dbToPhoto = (item: GalleryItem): Photo => ({
    id: item.id,
    title: item.title,
  device: item.device?.trim() ? item.device.trim() : undefined,
    category: (item.subcategory as any) || 'landscape',
    image: item.image,
    date: item.date || new Date().getFullYear().toString(),
  location: item.location?.trim() ? item.location.trim() : undefined,
    isPrivate: item.isPrivate,
  });

  // Load from cloud
  const reloadPhotos = async () => {
    try {
      const [items, trashedItems] = await Promise.all([
        getGalleryItemsByCategory('photo'),
        getTrashedGalleryItemsByCategory('photo')
      ]);
      setPhotos(items.map(dbToPhoto));
      setTrash(trashedItems.map(dbToPhoto));
    } catch (error) {
      console.error('[Photography] Load error:', error);
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca fotografiile.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setNewPhotoFile(null);
    setNewPhotoTitle('');
    setNewPhotoDevice('');
    setNewPhotoDate(new Date().getFullYear().toString());
    setNewPhotoLocation('');
    setNewPhotoCategory('landscape');
    setActiveTab('basic');
  };

  useEffect(() => {
    reloadPhotos();
  }, []);

  const visiblePhotos = (isAdmin ? photos : photos.filter(photo => !photo.isPrivate))
    .filter(photo => 
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'all' || photo.category === filterCategory)
    );

  const totalPages = Math.ceil(visiblePhotos.length / photosPerPage);
  const currentPhotos = visiblePhotos.slice(
    currentPage * photosPerPage,
    (currentPage + 1) * photosPerPage
  );

  const nextPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = visiblePhotos.findIndex(p => p.id === selectedPhoto.id);
      const nextIndex = (currentIndex + 1) % visiblePhotos.length;
      setSelectedPhoto(visiblePhotos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = visiblePhotos.findIndex(p => p.id === selectedPhoto.id);
      const prevIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
      setSelectedPhoto(visiblePhotos[prevIndex]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPhoto, visiblePhotos]);

  // Long press handlers
  const handleTouchStart = (e: React.TouchEvent, photoId: number) => {
    if (!isAdmin) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
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
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  };

  // Selection handlers
  const toggleSelection = (photoId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Ștergi ${selectedIds.size} ${selectedIds.size === 1 ? 'fotografie' : 'fotografii'}?`)) return;
    
    try {
      await Promise.all(Array.from(selectedIds).map(id => softDeleteGalleryItem(id)));
      toast({ title: 'Șterse', description: `${selectedIds.size} ${selectedIds.size === 1 ? 'fotografie' : 'fotografii'} ${selectedIds.size === 1 ? 'mutată' : 'mutate'} în coș.` });
      setSelectedIds(new Set());
      setSelectionMode(false);
      await reloadPhotos();
    } catch (error) {
      console.error('[Photography] Bulk delete error:', error);
      toast({ title: 'Eroare', description: 'Nu s-au putut șterge fotografiile.', variant: 'destructive' });
    }
  };

  // Add photo handler
  const handleAddPhoto = async () => {
    if (!newPhotoFile || !newPhotoTitle.trim()) {
      toast({ title: 'Date incomplete', description: 'Selectează o imagine și completează titlul.', variant: 'destructive' });
      return;
    }

    setNewPhotoUploading(true);
    try {
      const trimmedTitle = newPhotoTitle.trim();
      const trimmedDevice = newPhotoDevice.trim();
      const trimmedLocation = newPhotoLocation.trim();

      const fd = new FormData();
      fd.append('file', newPhotoFile);
      fd.append('folder', 'photography');
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      const { url } = await uploadRes.json();

      await createGalleryItem({
        title: trimmedTitle,
        image: url,
        category: 'photo',
        subcategory: newPhotoCategory,
        isPrivate: false,
        device: trimmedDevice || null,
        date: newPhotoDate,
        location: trimmedLocation || null,
      } as any);

      toast({ title: 'Adăugat', description: 'Fotografia a fost adăugată în cloud.' });
      setAddingPhoto(false);
      resetForm();
      await reloadPhotos();
    } catch (error) {
      console.error('[Photography] Add error:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga fotografia.', variant: 'destructive' });
    } finally {
      setNewPhotoUploading(false);
    }
  };

  // Edit photo handler
  const handleEditPhoto = async () => {
    if (!editingPhoto || !newPhotoTitle.trim()) {
      toast({ title: 'Date incomplete', description: 'Completează titlul.', variant: 'destructive' });
      return;
    }

    try {
      const trimmedTitle = newPhotoTitle.trim();
      const trimmedDevice = newPhotoDevice.trim();
      const trimmedLocation = newPhotoLocation.trim();

      const updates = {
        title: trimmedTitle,
        device: trimmedDevice || null,
        date: newPhotoDate,
        location: trimmedLocation || null,
        subcategory: newPhotoCategory,
      };
      
      console.log('[Photography] Updating photo:', editingPhoto.id, updates);
      
      await updateGalleryItem(editingPhoto.id, updates as any);

      toast({ title: 'Salvat', description: 'Modificările au fost salvate în cloud.' });
      setEditingPhoto(null);
      // Reset form fields
      setNewPhotoTitle('');
      setNewPhotoDevice('');
      setNewPhotoDate(new Date().getFullYear().toString());
      setNewPhotoLocation('');
      setNewPhotoCategory('landscape');
      await reloadPhotos();
    } catch (error) {
      console.error('[Photography] Edit error:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut salva fotografia.', variant: 'destructive' });
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (photoId: number) => {
    try {
      await softDeleteGalleryItem(photoId);
      toast({ title: 'Șters', description: 'Fotografia a fost mutată în coș.' });
      setDeletePhotoDialog({ open: false, photoId: null, photoTitle: '' });
      await reloadPhotos();
    } catch (error) {
      console.error('[Photography] Delete error:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge fotografia.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
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
              <Camera className="h-7 w-7 sm:h-8 sm:w-8 text-art-accent" />
              <h1 className="text-2xl sm:text-4xl font-bold gradient-text leading-tight">
                Fotografie
              </h1>
            </div>
            <p className="hidden sm:block text-xl text-muted-foreground max-w-2xl mx-auto">
              Capturi artistice și momente memorabile prin obiectiv
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {selectionMode ? (
              <>
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="h-10"
                  >
                    <XIcon className="h-4 w-4" />
                    {!isMobile && <span className="ml-2">Anulează</span>}
                  </Button>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {selectedIds.size} selectate
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className="h-10"
                >
                  <Trash2 className="h-4 w-4" />
                  {!isMobile && (
                    <span className="ml-2">
                      Șterge {selectedIds.size > 0 && `(${selectedIds.size})`}
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="relative flex-1 min-w-[180px] max-w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Caută fotografii..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px] sm:w-[180px] h-10">
                    <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
                    <SelectValue placeholder="Categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="portrait">Portret</SelectItem>
                    <SelectItem value="landscape">Peisaj</SelectItem>
                    <SelectItem value="street">Stradă</SelectItem>
                    <SelectItem value="macro">Macro</SelectItem>
                    <SelectItem value="night">Noapte</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 ml-auto">
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

                {isAdmin && (
                  <>
                    <Button 
                      className="hidden sm:inline-flex h-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md"
                      onClick={() => {
                        resetForm();
                        setAddingPhoto(true);
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Adaugă fotografie
                    </Button>
                    
                    {/* Trash Dialog - show only when there are items */}
                    {trash.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="relative h-10 w-10 rounded-lg flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors"
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
                          <DialogDescription className="sr-only">Fotografii șterse (soft delete)</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                          {trash.map((photo) => (
                            <div key={photo.id} className="p-3 border rounded-lg bg-muted/20">
                              <div className="flex gap-3">
                                <img src={photo.image} alt={photo.title} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm mb-1 truncate">{photo.title}</p>
                                  {photo.device && <p className="text-xs text-muted-foreground truncate">{photo.device}</p>}
                                  <p className="text-xs text-muted-foreground">{photo.category}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-7 w-7" 
                                    onClick={async () => {
                                      try {
                                        await restoreGalleryItem(photo.id);
                                        toast({ title: 'Restaurat', description: `${photo.title} a fost restaurat.` });
                                        await reloadPhotos();
                                      } catch (e) {
                                        console.error('[Photography] Restore error:', e);
                                        toast({ title: 'Eroare', description: 'Nu s-a putut restaura.', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-7 w-7" 
                                    onClick={async () => {
                                      if (!confirm(`Ștergi permanent "${photo.title}"? Această acțiune nu poate fi anulată.`)) return;
                                      try {
                                        await deleteGalleryItem(photo.id);
                                        toast({ title: 'Șters permanent', description: `${photo.title} a fost șters definitiv.` });
                                        await reloadPhotos();
                                      } catch (e) {
                                        console.error('[Photography] Permanent delete error:', e);
                                        toast({ title: 'Eroare', description: 'Nu s-a putut șterge.', variant: 'destructive' });
                                      }
                                    }}
                                  >
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
                      </DialogContent>
                    </Dialog>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Photos Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" 
            : "space-y-6 mb-8"
          }>
            {currentPhotos.map((photo, index) => (
              <Card 
                key={photo.id}
                className={`group cursor-pointer overflow-hidden transition-all duration-300 animate-scale-in ${
                  selectionMode
                    ? selectedIds.has(photo.id)
                      ? 'ring-2 ring-art-accent scale-95'
                      : 'hover:scale-95'
                    : 'hover:shadow-xl hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(photo.id);
                  } else {
                    setSelectedPhoto(photo);
                  }
                }}
                onTouchStart={(e) => !selectionMode && isAdmin && handleTouchStart(e, photo.id)}
                onTouchMove={(e) => !selectionMode && isAdmin && handleTouchMove(e)}
                onTouchEnd={() => !selectionMode && isAdmin && handleTouchEnd()}
                onContextMenu={(e) => {
                  if (isMobile && !selectionMode) {
                    e.preventDefault(); // Prevent context menu on long press
                  }
                }}
              >
                <CardContent className="p-0 relative">
                  {viewMode === 'grid' ? (
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={photo.image} 
                        alt={photo.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {photo.isPrivate && !isAdmin && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold">Private</span>
                        </div>
                      )}
                      
                      {/* Checkbox in top-left corner - shows on hover or when in selection mode */}
                      {isAdmin && (
                        <div 
                          className={`absolute top-2 left-2 z-10 transition-opacity ${
                            selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectionMode) {
                              setSelectionMode(true);
                            }
                            toggleSelection(photo.id);
                          }}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            selectedIds.has(photo.id)
                              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg'
                              : 'bg-white/20 backdrop-blur-md border-2 border-white/60 hover:bg-white/30'
                          }`}>
                            {selectedIds.has(photo.id) && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                      )}
                      
                      {/* Three-dot dropdown menu */}
                      {isAdmin && !selectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPhoto(photo);
                                setNewPhotoTitle(photo.title);
                                setNewPhotoDevice(photo.device || '');
                                setNewPhotoDate(photo.date);
                                setNewPhotoLocation(photo.location || '');
                                setNewPhotoCategory(photo.category);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editează
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletePhotoDialog({ 
                                  open: true, 
                                  photoId: photo.id, 
                                  photoTitle: photo.title 
                                });
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Șterge
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-4 p-4 sm:p-5">
                      {/* Selection checkbox for list view */}
                      {isAdmin && (
                        <div 
                          className={`flex items-center justify-center transition-opacity ${
                            selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectionMode) {
                              setSelectionMode(true);
                            }
                            toggleSelection(photo.id);
                          }}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            selectedIds.has(photo.id)
                              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg'
                              : 'bg-muted border-2 border-muted-foreground/20 hover:bg-muted/80'
                          }`}>
                            {selectedIds.has(photo.id) && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                      )}
                      
                      <div className="w-32 sm:w-48 h-24 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={photo.image} 
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <ImageIcon className="h-5 w-5 text-art-accent flex-shrink-0 mt-0.5" />
                          <h3 className="font-semibold text-lg leading-tight flex-1">{photo.title}</h3>
                          
                          {/* Three-dot dropdown menu for list view */}
                          {isAdmin && !selectionMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingPhoto(photo);
                                    setNewPhotoTitle(photo.title);
                                    setNewPhotoDevice(photo.device || '');
                                    setNewPhotoDate(photo.date);
                                    setNewPhotoLocation(photo.location || '');
                                    setNewPhotoCategory(photo.category);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editează
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletePhotoDialog({ 
                                      open: true, 
                                      photoId: photo.id, 
                                      photoTitle: photo.title 
                                    });
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Șterge
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {photo.device && (
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-muted-foreground text-sm">{photo.device}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{photo.date}</span>
                          </div>
                          {photo.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{photo.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-muted-foreground">
                {currentPage + 1} din {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[100vw] w-full h-full max-h-screen p-0 bg-black/98 border-0 rounded-none">
          <DialogTitle className="sr-only">{selectedPhoto?.title || 'Fotografie'}</DialogTitle>
          <DialogDescription className="sr-only">Vizualizare fullscreen fotografie</DialogDescription>
          {selectedPhoto && (
            <div className="relative w-full h-full bg-black">
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center px-3 sm:px-6 pt-6 pb-32 sm:pb-48">
                  <img
                    src={selectedPhoto.image}
                    alt={selectedPhoto.title}
                    className="w-auto h-auto max-w-full max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-260px)] object-contain"
                  />
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 sm:h-60 bg-gradient-to-t from-black via-black/85 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
                  <div className="mx-auto max-w-4xl bg-black/85 sm:bg-black/75 sm:rounded-2xl rounded-3xl backdrop-blur-sm p-4 sm:p-6 relative">
                    {/* Edit icon on mobile - top right */}
                    {isAdmin && isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPhoto(selectedPhoto);
                          setNewPhotoTitle(selectedPhoto.title);
                          setNewPhotoDevice(selectedPhoto.device || '');
                          setNewPhotoDate(selectedPhoto.date);
                          setNewPhotoLocation(selectedPhoto.location || '');
                          setNewPhotoCategory(selectedPhoto.category);
                          setActiveTab('basic');
                          setSelectedPhoto(null);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-art-accent flex-shrink-0 mt-0.5 sm:mt-1" />
                      <h3 className="text-lg sm:text-3xl font-bold text-white leading-tight pr-8 sm:pr-0">{selectedPhoto.title}</h3>
                    </div>
                    {selectedPhoto.device && (
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 ml-7 sm:ml-9">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <p className="text-sm sm:text-lg text-gray-300">{selectedPhoto.device}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4 ml-7 sm:ml-9 flex-wrap">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-300">{selectedPhoto.date}</span>
                      </div>
                      {selectedPhoto.location && (
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                          <span className="text-xs sm:text-sm text-gray-300">{selectedPhoto.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletePhotoDialog.open} onOpenChange={(open) => !open && setDeletePhotoDialog({ open: false, photoId: null, photoTitle: '' })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription className="sr-only">Confirmă ștergerea fotografiei</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Ești sigur că vrei să ștergi fotografia <span className="font-semibold">"{deletePhotoDialog.photoTitle}"</span>? 
            O poți restaura mai târziu din coșul de gunoi.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletePhotoDialog({ open: false, photoId: null, photoTitle: '' })}>
              Anulează
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (deletePhotoDialog.photoId) {
                  await handleDeletePhoto(deletePhotoDialog.photoId);
                }
                setDeletePhotoDialog({ open: false, photoId: null, photoTitle: '' });
              }}
            >
              Șterge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={addingPhoto} onOpenChange={setAddingPhoto}>
        <DialogContent className="max-w-lg w-[min(100vw-1.5rem,28rem)] max-h-[90vh] overflow-y-auto p-5 sm:p-6 sm:top-[12vh] sm:translate-y-0">
          <DialogHeader>
            <DialogTitle>Adaugă fotografie nouă</DialogTitle>
            <DialogDescription className="sr-only">Completează detaliile fotografiei</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'basic' | 'details')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Bază</TabsTrigger>
                <TabsTrigger value="details">Detalii</TabsTrigger>
              </TabsList>

              {/* Tab Bază - Preview + Titlu + Dispozitiv */}
              <TabsContent value="basic" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                <div className="border-2 border-dashed rounded-md p-3 sm:p-4 bg-muted/20">
                  {newPhotoFile ? (
                    <img 
                      src={URL.createObjectURL(newPhotoFile)} 
                      alt="previzualizare" 
                      className="w-full h-44 sm:h-56 object-contain rounded" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-44 sm:h-56 text-muted-foreground">
                      <Camera className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Selectează o fotografie</p>
                    </div>
                  )}
                  <label className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border cursor-pointer bg-background hover:bg-muted transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)} 
                    />
                    <Camera className="h-4 w-4" />
                    Alege fotografia
                  </label>
                </div>
                <div>
                  <Label htmlFor="photo-title">Titlu *</Label>
                  <Input
                    id="photo-title"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    placeholder="ex: Apus de soare în munți"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="photo-device">Dispozitiv *</Label>
                  <Input
                    id="photo-device"
                    value={newPhotoDevice}
                    onChange={(e) => setNewPhotoDevice(e.target.value)}
                    placeholder="ex: Canon EOS 5D, iPhone 13"
                    className="mt-1.5"
                  />
                </div>
              </TabsContent>

              {/* Tab Detalii - Anul + Locație + Categorie */}
              <TabsContent value="details" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                <div>
                  <Label>Anul</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1.5"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newPhotoDate || 'Selectează anul'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <Label className="text-sm mb-2 block">Selectează anul</Label>
                        <Select value={newPhotoDate} onValueChange={setNewPhotoDate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Anul" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="photo-location">Locație</Label>
                  <Input
                    id="photo-location"
                    value={newPhotoLocation}
                    onChange={(e) => setNewPhotoLocation(e.target.value)}
                    placeholder="ex: Brașov, România"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="photo-category">Categorie</Label>
                  <Select value={newPhotoCategory} onValueChange={(val) => setNewPhotoCategory(val as Photo['category'])}>
                    <SelectTrigger id="photo-category" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portret</SelectItem>
                      <SelectItem value="landscape">Peisaj</SelectItem>
                      <SelectItem value="street">Stradă</SelectItem>
                      <SelectItem value="macro">Macro</SelectItem>
                      <SelectItem value="night">Noapte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAddingPhoto(false)} disabled={newPhotoUploading}>
                Anulează
              </Button>
              <Button onClick={handleAddPhoto} disabled={newPhotoUploading}>
                {newPhotoUploading ? 'Se încarcă...' : 'Salvează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Photo Dialog */}
      {editingPhoto && (
        <Dialog 
          open={!!editingPhoto} 
          onOpenChange={(open) => {
            if (!open) {
              setEditingPhoto(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-lg w-[min(100vw-1.5rem,28rem)] max-h-[90vh] overflow-y-auto p-5 sm:p-6 sm:top-[12vh] sm:translate-y-0">
            <DialogHeader>
              <DialogTitle>Editează fotografia</DialogTitle>
              <DialogDescription className="sr-only">Modifică detaliile fotografiei</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'basic' | 'details')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Bază</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                </TabsList>

                {/* Tab Bază - Preview + Titlu + Dispozitiv */}
                <TabsContent value="basic" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                  <div className="border-2 border-dashed rounded-md p-3 sm:p-4 bg-muted/20">
                    <img 
                      src={editingPhoto.image} 
                      alt={editingPhoto.title} 
                      className="w-full h-44 sm:h-56 object-contain rounded" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">Fotografia curentă</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-photo-title">Titlu *</Label>
                    <Input
                      id="edit-photo-title"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      placeholder="ex: Apus de soare în munți"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-photo-device">Dispozitiv *</Label>
                    <Input
                      id="edit-photo-device"
                      value={newPhotoDevice}
                      onChange={(e) => setNewPhotoDevice(e.target.value)}
                      placeholder="ex: Canon EOS 5D, iPhone 13"
                      className="mt-1.5"
                    />
                  </div>
                </TabsContent>

                {/* Tab Detalii - Anul + Locație + Categorie */}
                <TabsContent value="details" className="space-y-3 min-h-[360px] sm:min-h-[420px]">
                  <div>
                    <Label>Anul</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1.5"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {newPhotoDate || 'Selectează anul'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3">
                          <Label className="text-sm mb-2 block">Selectează anul</Label>
                          <Select value={newPhotoDate} onValueChange={setNewPhotoDate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Anul" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="edit-photo-location">Locație</Label>
                    <Input
                      id="edit-photo-location"
                      value={newPhotoLocation}
                      onChange={(e) => setNewPhotoLocation(e.target.value)}
                      placeholder="ex: Brașov, România"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-photo-category">Categorie</Label>
                    <Select value={newPhotoCategory} onValueChange={(val) => setNewPhotoCategory(val as Photo['category'])}>
                      <SelectTrigger id="edit-photo-category" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portret</SelectItem>
                        <SelectItem value="landscape">Peisaj</SelectItem>
                        <SelectItem value="street">Stradă</SelectItem>
                        <SelectItem value="macro">Macro</SelectItem>
                        <SelectItem value="night">Noapte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingPhoto(null);
                    resetForm();
                  }}
                >
                  Anulează
                </Button>
                <Button onClick={handleEditPhoto}>
                  Salvează
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isAdmin && (
        <Button
          size="icon"
          className="sm:hidden fixed bottom-5 right-5 h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
          onClick={() => {
            resetForm();
            setAddingPhoto(true);
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Photography;