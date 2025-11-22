import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Plus, Search, Filter, Grid3X3, List, ChevronLeft, ChevronRight, Image as ImageIcon, MapPin, Calendar, MoreVertical, Edit, Trash2, Trash, Undo2, X as XIcon, Check, ArrowUpDown, Cloud, FolderOpen, Settings2 } from 'lucide-react';
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
import {
  usePhotoLocations,
  useCreatePhotoLocation,
  useUpdatePhotoLocation,
  useDeletePhotoLocation,
  usePhotoDevices,
  useCreatePhotoDevice,
  useUpdatePhotoDevice,
  useDeletePhotoDevice,
} from '@/hooks/usePhotoOptions';
import type { GalleryItem, PhotoLocation, PhotoDevice } from '@shared/schema';

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

type SortOption = 'none' | 'title' | 'device' | 'location' | 'date';

const YEAR_REGEX = /\d{4}/;

const getYearNumber = (value?: string) => {
  if (!value) return 0;
  const match = value.match(YEAR_REGEX);
  return match ? parseInt(match[0], 10) : 0;
};

const getYearLabel = (value?: string) => {
  if (!value) return 'Necunoscut';
  const match = value.match(YEAR_REGEX);
  return match ? match[0] : 'Necunoscut';
};

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
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  useEffect(() => {
    const checkFs = () => {
      const inFsApi = !!(document as any).fullscreenElement || !!(document as any).webkitFullscreenElement || !!(document as any).mozFullScreenElement || !!(document as any).msFullscreenElement;
      const inFsHeuristic = window.innerHeight >= (window.screen?.height || 0) - 1 && window.innerWidth >= (window.screen?.width || 0) - 1;
      setIsBrowserFullscreen(inFsApi || inFsHeuristic);
    };
    const onResize = () => checkFs();
    const onFsChange = () => checkFs();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') setTimeout(checkFs, 100);
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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('none');
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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const newPhotoPreviewUrl = React.useMemo(() => {
    if (!newPhotoFile) return null;
    return URL.createObjectURL(newPhotoFile);
  }, [newPhotoFile]);

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

  // Photo Options Management (Locations & Devices)
  const { data: photoLocations = [] } = usePhotoLocations();
  const { data: photoDevices = [] } = usePhotoDevices();
  const createLocationMutation = useCreatePhotoLocation();
  const updateLocationMutation = useUpdatePhotoLocation();
  const deleteLocationMutation = useDeletePhotoLocation();
  const createDeviceMutation = useCreatePhotoDevice();
  const updateDeviceMutation = useUpdatePhotoDevice();
  const deleteDeviceMutation = useDeletePhotoDevice();

  // Management dialogs
  const [isManageLocationsOpen, setIsManageLocationsOpen] = useState(false);
  const [isManageDevicesOpen, setIsManageDevicesOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageFiltersOpen, setIsManageFiltersOpen] = useState(false);
  
  // Editing states for locations, devices and categories
  const [editingLocation, setEditingLocation] = useState<{ id: number; name: string } | null>(null);
  const [editingDevice, setEditingDevice] = useState<{ id: number; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ value: string; label: string } | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  
  // Input mode states (for when user selects "Add new")
  const [isAddingNewDevice, setIsAddingNewDevice] = useState(false);
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Categories list (managed by admin)
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([
    { value: 'portrait', label: 'Portret' },
    { value: 'landscape', label: 'Peisaj' },
    { value: 'street', label: 'Stradă' },
    { value: 'macro', label: 'Macro' },
    { value: 'night', label: 'Noapte' },
  ]);

  // DB to Photo transformation
  const dbToPhoto = (item: GalleryItem): Photo => {
    const normalizedDevice = item.device?.trim();
    const normalizedLocation = item.location?.trim();
    const normalizedDate = item.date?.trim() || new Date().getFullYear().toString();

    return {
      id: item.id,
      title: item.title,
      device: normalizedDevice && normalizedDevice.length > 0 ? normalizedDevice : undefined,
      category: (item.subcategory as any) || 'landscape',
      image: item.image,
      date: normalizedDate,
      location: normalizedLocation && normalizedLocation.length > 0 ? normalizedLocation : undefined,
      isPrivate: item.isPrivate,
    };
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerNativeFileDialog = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      if (newPhotoPreviewUrl) {
        URL.revokeObjectURL(newPhotoPreviewUrl);
      }
    };
  }, [newPhotoPreviewUrl]);

  const handleCloudPicker = async () => {
    const picker = (window as any)?.showOpenFilePicker;
    if (picker) {
      try {
        const [handle] = await picker({
          multiple: false,
          types: [
            {
              description: 'Imagini',
              accept: {
                'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']
              }
            }
          ]
        });
        if (!handle) return;
        const file = await handle.getFile();
        setNewPhotoFile(file as File);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('[Photography] Cloud picker error:', error);
        toast({ title: 'Eroare', description: 'Nu am putut deschide selectorul de fișiere.', variant: 'destructive' });
      }
    } else {
      triggerNativeFileDialog();
    }
  };

  useEffect(() => {
    reloadPhotos();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterCategory, sortOption]);

  const filteredPhotos = React.useMemo(() => {
    const base = isAdmin ? photos : photos.filter((photo) => !photo.isPrivate);
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return base.filter((photo) => {
      const matchesSearch =
        normalizedSearch === '' || photo.title.toLowerCase().includes(normalizedSearch);
      const matchesCategory = filterCategory === 'all' || photo.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [photos, isAdmin, searchTerm, filterCategory]);

  const sortedPhotos = React.useMemo(() => {
    const collator = new Intl.Collator('ro', { sensitivity: 'base' });
    const arr = [...filteredPhotos];

    switch (sortOption) {
      case 'title':
        arr.sort((a, b) => collator.compare(a.title, b.title));
        break;
      case 'device':
        arr.sort((a, b) =>
          collator.compare(a.device?.trim() || 'Fără dispozitiv', b.device?.trim() || 'Fără dispozitiv')
        );
        break;
      case 'location':
        arr.sort((a, b) =>
          collator.compare(a.location?.trim() || 'Fără locație', b.location?.trim() || 'Fără locație')
        );
        break;
      case 'date':
        arr.sort((a, b) => {
          const diff = getYearNumber(b.date) - getYearNumber(a.date);
          if (diff !== 0) return diff;
          return collator.compare(a.title, b.title);
        });
        break;
      default:
        arr.sort((a, b) => b.id - a.id);
    }

    return arr;
  }, [filteredPhotos, sortOption]);

  const totalPages = Math.ceil(sortedPhotos.length / photosPerPage);
  const safePageIndex = totalPages === 0 ? 0 : Math.min(currentPage, totalPages - 1);
  const currentPhotos = sortedPhotos.slice(
    safePageIndex * photosPerPage,
    (safePageIndex + 1) * photosPerPage
  );

  const groupedCurrentPhotos = React.useMemo(() => {
    if (sortOption === 'none') {
      return [{ key: 'all', title: null as string | null, photos: currentPhotos }];
    }

    const groups: { key: string; title: string; photos: Photo[] }[] = [];

    const getGroupKey = (photo: Photo): string => {
      switch (sortOption) {
        case 'title':
          return photo.title?.trim()?.charAt(0)?.toUpperCase() || '#';
        case 'device':
          return photo.device?.trim() || 'Fără dispozitiv';
        case 'location':
          return photo.location?.trim() || 'Fără locație';
        case 'date':
          return getYearLabel(photo.date);
        default:
          return 'other';
      }
    };

    const getGroupTitle = (key: string): string => {
      switch (sortOption) {
        case 'title':
          return key === '#' ? 'Titluri diverse' : `Titluri – ${key}`;
        case 'device':
          return key === 'Fără dispozitiv' ? 'Dispozitiv necunoscut' : `Dispozitiv: ${key}`;
        case 'location':
          return key === 'Fără locație' ? 'Locație necunoscută' : `Locație: ${key}`;
        case 'date':
          return key === 'Necunoscut' ? 'An necunoscut' : `Anul ${key}`;
        default:
          return '';
      }
    };

    currentPhotos.forEach((photo) => {
      const key = getGroupKey(photo);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, title: getGroupTitle(key), photos: [] };
        groups.push(group);
      }
      group.photos.push(photo);
    });

    return groups;
  }, [currentPhotos, sortOption]);

  let animationIndex = 0;

  const nextPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = sortedPhotos.findIndex((p) => p.id === selectedPhoto.id);
      if (currentIndex === -1) return;
      const nextIndex = (currentIndex + 1) % sortedPhotos.length;
      setSelectedPhoto(sortedPhotos[nextIndex]);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto) {
      const currentIndex = sortedPhotos.findIndex((p) => p.id === selectedPhoto.id);
      if (currentIndex === -1) return;
      const prevIndex = (currentIndex - 1 + sortedPhotos.length) % sortedPhotos.length;
      setSelectedPhoto(sortedPhotos[prevIndex]);
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
  }, [selectedPhoto, sortedPhotos]);

  useEffect(() => {
    if (!selectedPhoto) return;

    const latest = sortedPhotos.find((p) => p.id === selectedPhoto.id);
    if (!latest || latest === selectedPhoto) {
      return;
    }

    const hasDifferences =
      latest.title !== selectedPhoto.title ||
      latest.image !== selectedPhoto.image ||
      latest.date !== selectedPhoto.date ||
      (latest.device ?? '') !== (selectedPhoto.device ?? '') ||
      (latest.location ?? '') !== (selectedPhoto.location ?? '') ||
      latest.category !== selectedPhoto.category ||
      !!latest.isPrivate !== !!selectedPhoto.isPrivate;

    if (hasDifferences) {
      setSelectedPhoto(latest);
    }
  }, [selectedPhoto, sortedPhotos]);

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

  // Location management handlers
  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      await createLocationMutation.mutateAsync({ name: newLocationName.trim() });
      setNewLocationName('');
      toast({ title: 'Adăugat', description: 'Locația a fost adăugată.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga locația.', variant: 'destructive' });
    }
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation || !editingLocation.name.trim()) return;
    try {
      await updateLocationMutation.mutateAsync({
        id: editingLocation.id,
        updates: { name: editingLocation.name.trim() }
      });
      setEditingLocation(null);
      toast({ title: 'Actualizat', description: 'Locația a fost actualizată.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut actualiza locația.', variant: 'destructive' });
    }
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      await deleteLocationMutation.mutateAsync(id);
      toast({ title: 'Șters', description: 'Locația a fost ștearsă.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge locația.', variant: 'destructive' });
    }
  };

  // Device management handlers
  const handleCreateDevice = async () => {
    if (!newDeviceName.trim()) return;
    try {
      await createDeviceMutation.mutateAsync({ name: newDeviceName.trim() });
      setNewDeviceName('');
      toast({ title: 'Adăugat', description: 'Dispozitivul a fost adăugat.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut adăuga dispozitivul.', variant: 'destructive' });
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice || !editingDevice.name.trim()) return;
    try {
      await updateDeviceMutation.mutateAsync({
        id: editingDevice.id,
        updates: { name: editingDevice.name.trim() }
      });
      setEditingDevice(null);
      toast({ title: 'Actualizat', description: 'Dispozitivul a fost actualizat.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut actualiza dispozitivul.', variant: 'destructive' });
    }
  };

  const handleDeleteDevice = async (id: number) => {
    try {
      await deleteDeviceMutation.mutateAsync(id);
      toast({ title: 'Șters', description: 'Dispozitivul a fost șters.' });
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-a putut șterge dispozitivul.', variant: 'destructive' });
    }
  };

  // Category management handlers
  const handleCreateCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const autoValue = newCategoryLabel.trim().toLowerCase().replace(/\s+/g, '-');
    setCategories([...categories, { value: autoValue, label: newCategoryLabel.trim() }]);
    setNewCategoryLabel('');
    toast({ title: 'Adăugat', description: 'Categoria a fost adăugată.' });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    setCategories(categories.map(cat => 
      cat.value === editingCategory.value ? editingCategory : cat
    ));
    setEditingCategory(null);
    toast({ title: 'Actualizat', description: 'Categoria a fost actualizată.' });
  };

  const handleDeleteCategory = (value: string) => {
    setCategories(categories.filter(cat => cat.value !== value));
    toast({ title: 'Șters', description: 'Categoria a fost ștearsă.' });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
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

        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-8">
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
                {/* Mobile: First row - Search + Trash */}
                <div className="flex sm:hidden items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Caută fotografii..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  {isAdmin && trash.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="relative h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center bg-background border border-border hover:bg-muted transition-colors"
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
                </div>

                {/* Mobile: Second row - Filter, Sort, View toggles */}
                <div className="flex sm:hidden items-center gap-2 w-full">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-10 w-10 [&>span]:hidden [&_svg.lucide-chevron-down]:hidden">
                      <Filter className="h-5 w-5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="h-10 w-10 [&>span]:hidden [&_svg.lucide-chevron-down]:hidden">
                      <ArrowUpDown className="h-5 w-5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Fără sortare</SelectItem>
                      <SelectItem value="date">După an</SelectItem>
                      <SelectItem value="title">După nume</SelectItem>
                      <SelectItem value="device">După dispozitiv</SelectItem>
                      <SelectItem value="location">După locație</SelectItem>
                    </SelectContent>
                  </Select>

                  {isAdmin && (
                    <Button 
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setIsManageFiltersOpen(true)}
                      title="Gestionează filtre"
                    >
                      <Settings2 className="h-5 w-5" />
                    </Button>
                  )}

                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Desktop: Single row - all controls */}
                <div className="hidden sm:flex items-center gap-3 w-full">
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
                    <SelectTrigger className="w-[180px] h-10">
                      <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toate</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-[200px] h-10">
                      <ArrowUpDown className="h-4 w-4 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Sortare" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Fără sortare</SelectItem>
                      <SelectItem value="date">După an</SelectItem>
                      <SelectItem value="title">După nume</SelectItem>
                      <SelectItem value="device">După dispozitiv</SelectItem>
                      <SelectItem value="location">După locație</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
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
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 ml-auto"
                        onClick={() => setIsManageFiltersOpen(true)}
                        title="Gestionează filtre"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        className="h-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md"
                        onClick={() => {
                          resetForm();
                          setAddingPhoto(true);
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Adaugă fotografie
                      </Button>
                      
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
                </div>
              </>
            )}
          </div>

          {/* Photos Grid */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" 
            : "space-y-6 mb-8"
          }>
            {groupedCurrentPhotos.map((group) => (
              <React.Fragment key={group.key}>
                {sortOption !== 'none' && group.title && (
                  <div className={viewMode === 'grid' ? 'col-span-full' : ''}>
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-shrink-0 w-1 h-8 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full" />
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{group.title}</span>
                    </div>
                  </div>
                )}
                {group.photos.map((photo) => {
                  const delay = animationIndex * 50;
                  animationIndex += 1;

                  return (
                    <Card 
                      key={photo.id}
                      className={`group cursor-pointer overflow-hidden transition-all duration-300 animate-scale-in ${
                        selectionMode
                          ? selectedIds.has(photo.id)
                            ? 'ring-2 ring-art-accent scale-95'
                            : 'hover:scale-95'
                          : 'hover:shadow-xl hover:scale-105'
                      }`}
                      style={{ animationDelay: `${delay}ms` }}
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
                          e.preventDefault();
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
                          <div className="flex gap-3 sm:gap-4 p-3 sm:p-5">
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
                            
                            <div className="w-24 sm:w-48 h-20 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                              <img 
                                src={photo.image} 
                                alt={photo.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1 sm:mb-2">
                                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-art-accent flex-shrink-0 mt-0.5" />
                                <h3 className="font-semibold text-base sm:text-lg leading-tight flex-1 truncate">{photo.title}</h3>
                                
                                {/* Three-dot dropdown menu for list view */}
                                {isAdmin && !selectionMode && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                  <p className="text-muted-foreground text-xs sm:text-sm truncate">{photo.device}</p>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span>{photo.date}</span>
                                </div>
                                {photo.location && (
                                  <div className="flex items-center gap-1 min-w-0">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{photo.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, safePageIndex - 1))}
                disabled={safePageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-muted-foreground">
                {safePageIndex + 1} din {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.max(totalPages - 1, 0), safePageIndex + 1))}
                disabled={safePageIndex === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Full Screen Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[100vw] w-full h-full max-h-screen p-0 bg-black/98 border-0 rounded-none">
          <DialogTitle className="sr-only">{selectedPhoto?.title || 'Fotografie'}</DialogTitle>
          <DialogDescription className="sr-only">Vizualizare fullscreen fotografie</DialogDescription>
          {selectedPhoto && (
            <div className="relative w-full h-full bg-black">
              <div className="flex flex-col h-full">
                <div className={`flex-1 flex items-center justify-center px-3 sm:px-6 ${isBrowserFullscreen ? 'py-4' : 'pt-6 pb-32 sm:pb-48'}`}>
                  {/* Image wrapper with navigation arrows */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevPhoto();
                      }}
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>

                    <img
                      src={selectedPhoto.image}
                      alt={selectedPhoto.title}
                      className={`w-auto h-auto max-w-full ${isBrowserFullscreen ? 'max-h-[100vh]' : 'max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-260px)]'} object-contain`}
                    />
                  </div>
                </div>
                {!isBrowserFullscreen && (
                  <>
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
                  </>
                )}
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
                      src={newPhotoPreviewUrl || ''} 
                      alt="previzualizare" 
                      className="w-full h-44 sm:h-56 object-contain rounded" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-44 sm:h-56 text-muted-foreground">
                      <Camera className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Selectează o fotografie</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewPhotoFile(file);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium"
                      onClick={triggerNativeFileDialog}
                    >
                      <FolderOpen className="h-4 w-4" />
                      Din dispozitiv
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium"
                      onClick={handleCloudPicker}
                    >
                      <Cloud className="h-4 w-4" />
                      Drive / Google Photos
                    </Button>
                  </div>
                  {newPhotoFile && (
                    <p className="mt-2 text-xs text-muted-foreground truncate">{newPhotoFile.name}</p>
                  )}
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
                  <Label htmlFor="photo-device">Dispozitiv</Label>
                  <Select 
                    value={isAddingNewDevice ? '__new_device' : newPhotoDevice} 
                    onValueChange={(val) => {
                      if (val === '__manage_devices') {
                        setIsManageDevicesOpen(true);
                      } else if (val === '__new_device') {
                        setIsAddingNewDevice(true);
                        setNewPhotoDevice('');
                      } else {
                        setIsAddingNewDevice(false);
                        setNewPhotoDevice(val);
                      }
                    }}
                  >
                    <SelectTrigger id="photo-device" className="mt-1.5">
                      <SelectValue placeholder="Selectează dispozitiv..." />
                    </SelectTrigger>
                    <SelectContent>
                      {photoDevices.map((device) => (
                        <SelectItem key={device.id} value={device.name}>
                          {device.name}
                        </SelectItem>
                      ))}
                      {photoDevices.length > 0 && isAdmin && <div className="h-px bg-border my-1"></div>}
                      <SelectItem value="__new_device">
                        <span className="text-muted-foreground italic">+ Adaugă dispozitiv nou...</span>
                      </SelectItem>
                      {isAdmin && (
                        <SelectItem value="__manage_devices">
                          <div className="flex items-center gap-2">
                            <Settings2 className="h-3 w-3" />
                            <span>Gestionează dispozitive</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {isAddingNewDevice && (
                    <Input
                      value={newPhotoDevice}
                      onChange={(e) => setNewPhotoDevice(e.target.value)}
                      placeholder="ex: Canon EOS 5D, iPhone 13"
                      className="mt-2"
                      autoFocus
                      onBlur={async () => {
                        if (newPhotoDevice.trim()) {
                          try {
                            await createDeviceMutation.mutateAsync({ name: newPhotoDevice.trim() });
                            setIsAddingNewDevice(false);
                          } catch (error) {
                            // Keep input open on error
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPhotoDevice.trim()) {
                          createDeviceMutation.mutateAsync({ name: newPhotoDevice.trim() })
                            .then(() => setIsAddingNewDevice(false))
                            .catch(() => {});
                        } else if (e.key === 'Escape') {
                          setIsAddingNewDevice(false);
                          setNewPhotoDevice('');
                        }
                      }}
                    />
                  )}
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
                  <Select 
                    value={isAddingNewLocation ? '__new_location' : newPhotoLocation} 
                    onValueChange={(val) => {
                      if (val === '__manage_locations') {
                        setIsManageLocationsOpen(true);
                      } else if (val === '__new_location') {
                        setIsAddingNewLocation(true);
                        setNewPhotoLocation('');
                      } else {
                        setIsAddingNewLocation(false);
                        setNewPhotoLocation(val);
                      }
                    }}
                  >
                    <SelectTrigger id="photo-location" className="mt-1.5">
                      <SelectValue placeholder="Selectează locație..." />
                    </SelectTrigger>
                    <SelectContent>
                      {photoLocations.map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                      {photoLocations.length > 0 && isAdmin && <div className="h-px bg-border my-1"></div>}
                      <SelectItem value="__new_location">
                        <span className="text-muted-foreground italic">+ Adaugă locație nouă...</span>
                      </SelectItem>
                      {isAdmin && (
                        <SelectItem value="__manage_locations">
                          <div className="flex items-center gap-2">
                            <Settings2 className="h-3 w-3" />
                            <span>Gestionează locații</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {isAddingNewLocation && (
                    <Input
                      value={newPhotoLocation}
                      onChange={(e) => setNewPhotoLocation(e.target.value)}
                      placeholder="ex: Brașov, România"
                      className="mt-2"
                      autoFocus
                      onBlur={async () => {
                        if (newPhotoLocation.trim()) {
                          try {
                            await createLocationMutation.mutateAsync({ name: newPhotoLocation.trim() });
                            setIsAddingNewLocation(false);
                          } catch (error) {
                            // Keep input open on error
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPhotoLocation.trim()) {
                          createLocationMutation.mutateAsync({ name: newPhotoLocation.trim() })
                            .then(() => setIsAddingNewLocation(false))
                            .catch(() => {});
                        } else if (e.key === 'Escape') {
                          setIsAddingNewLocation(false);
                          setNewPhotoLocation('');
                        }
                      }}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="photo-category">Categorie</Label>
                  <Select 
                    value={isAddingNewCategory ? '__new_category' : newPhotoCategory} 
                    onValueChange={(val) => {
                      if (val === '__manage_categories') {
                        setIsManageCategoriesOpen(true);
                      } else if (val === '__new_category') {
                        setIsAddingNewCategory(true);
                        setNewPhotoCategory('landscape');
                      } else {
                        setIsAddingNewCategory(false);
                        setNewPhotoCategory(val as Photo['category']);
                      }
                    }}
                  >
                    <SelectTrigger id="photo-category" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                      {isAdmin && (
                        <>
                          <div className="h-px bg-border my-1"></div>
                          <SelectItem value="__manage_categories">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestionează categorii</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
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
                    <Label htmlFor="edit-photo-device">Dispozitiv</Label>
                    <Select 
                      value={isAddingNewDevice ? '__new_device' : newPhotoDevice} 
                      onValueChange={(val) => {
                        if (val === '__manage_devices') {
                          setIsManageDevicesOpen(true);
                        } else if (val === '__new_device') {
                          setIsAddingNewDevice(true);
                          setNewPhotoDevice('');
                        } else {
                          setIsAddingNewDevice(false);
                          setNewPhotoDevice(val);
                        }
                      }}
                    >
                      <SelectTrigger id="edit-photo-device" className="mt-1.5">
                        <SelectValue placeholder="Selectează dispozitiv..." />
                      </SelectTrigger>
                      <SelectContent>
                        {photoDevices.map((device) => (
                          <SelectItem key={device.id} value={device.name}>
                            {device.name}
                          </SelectItem>
                        ))}
                        {photoDevices.length > 0 && isAdmin && <div className="h-px bg-border my-1"></div>}
                        <SelectItem value="__new_device">
                          <span className="text-muted-foreground italic">+ Adaugă dispozitiv nou...</span>
                        </SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_devices">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestionează dispozitive</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isAddingNewDevice && (
                      <Input
                        value={newPhotoDevice}
                        onChange={(e) => setNewPhotoDevice(e.target.value)}
                        placeholder="ex: Canon EOS 5D, iPhone 13"
                        className="mt-2"
                        autoFocus
                        onBlur={async () => {
                          if (newPhotoDevice.trim()) {
                            try {
                              await createDeviceMutation.mutateAsync({ name: newPhotoDevice.trim() });
                              setIsAddingNewDevice(false);
                            } catch (error) {
                              // Keep input open on error
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPhotoDevice.trim()) {
                            createDeviceMutation.mutateAsync({ name: newPhotoDevice.trim() })
                              .then(() => setIsAddingNewDevice(false))
                              .catch(() => {});
                          } else if (e.key === 'Escape') {
                            setIsAddingNewDevice(false);
                            setNewPhotoDevice('');
                          }
                        }}
                      />
                    )}
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
                    <Select 
                      value={isAddingNewLocation ? '__new_location' : newPhotoLocation} 
                      onValueChange={(val) => {
                        if (val === '__manage_locations') {
                          setIsManageLocationsOpen(true);
                        } else if (val === '__new_location') {
                          setIsAddingNewLocation(true);
                          setNewPhotoLocation('');
                        } else {
                          setIsAddingNewLocation(false);
                          setNewPhotoLocation(val);
                        }
                      }}
                    >
                      <SelectTrigger id="edit-photo-location" className="mt-1.5">
                        <SelectValue placeholder="Selectează locație..." />
                      </SelectTrigger>
                      <SelectContent>
                        {photoLocations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
                          </SelectItem>
                        ))}
                        {photoLocations.length > 0 && isAdmin && <div className="h-px bg-border my-1"></div>}
                        <SelectItem value="__new_location">
                          <span className="text-muted-foreground italic">+ Adaugă locație nouă...</span>
                        </SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_locations">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestionează locații</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isAddingNewLocation && (
                      <Input
                        value={newPhotoLocation}
                        onChange={(e) => setNewPhotoLocation(e.target.value)}
                        placeholder="ex: Brașov, România"
                        className="mt-2"
                        autoFocus
                        onBlur={async () => {
                          if (newPhotoLocation.trim()) {
                            try {
                              await createLocationMutation.mutateAsync({ name: newPhotoLocation.trim() });
                              setIsAddingNewLocation(false);
                            } catch (error) {
                              // Keep input open on error
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPhotoLocation.trim()) {
                            createLocationMutation.mutateAsync({ name: newPhotoLocation.trim() })
                              .then(() => setIsAddingNewLocation(false))
                              .catch(() => {});
                          } else if (e.key === 'Escape') {
                            setIsAddingNewLocation(false);
                            setNewPhotoLocation('');
                          }
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-photo-category">Categorie</Label>
                    <Select 
                      value={isAddingNewCategory ? '__new_category' : newPhotoCategory} 
                      onValueChange={(val) => {
                        if (val === '__manage_categories') {
                          setIsManageCategoriesOpen(true);
                        } else if (val === '__new_category') {
                          setIsAddingNewCategory(true);
                          setNewPhotoCategory('landscape');
                        } else {
                          setIsAddingNewCategory(false);
                          setNewPhotoCategory(val as Photo['category']);
                        }
                      }}
                    >
                      <SelectTrigger id="edit-photo-category" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                        {isAdmin && (
                          <>
                            <div className="h-px bg-border my-1"></div>
                            <SelectItem value="__manage_categories">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-3 w-3" />
                                <span>Gestionează categorii</span>
                              </div>
                            </SelectItem>
                          </>
                        )}
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

      {/* Manage Locations Dialog */}
      <Dialog open={isManageLocationsOpen} onOpenChange={setIsManageLocationsOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionează locații</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {photoLocations.map((location) => {
              const isEditing = editingLocation && editingLocation.id === location.id;
              const displayName = isEditing ? editingLocation.name : location.name;
              
              return (
                <Card key={location.id} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input 
                          value={displayName}
                          onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="font-medium text-sm sm:text-base truncate">
                          {displayName}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={handleUpdateLocation}
                            className="h-8 px-3 text-xs"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingLocation(null)}
                            className="h-8 px-3 text-xs"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingLocation({ id: location.id, name: location.name })}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteLocation(location.id)}
                            className="h-8 px-3 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className="p-3 sm:p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Locație nouă</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume locație" 
                  value={newLocationName} 
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateLocation();
                    }
                  }}
                />
                <Button 
                  onClick={handleCreateLocation}
                  className="w-full"
                  disabled={!newLocationName.trim()}
                >
                  Adaugă locație
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Devices Dialog */}
      <Dialog open={isManageDevicesOpen} onOpenChange={setIsManageDevicesOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionează dispozitive</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {photoDevices.map((device) => {
              const isEditing = editingDevice && editingDevice.id === device.id;
              const displayName = isEditing ? editingDevice.name : device.name;
              
              return (
                <Card key={device.id} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input 
                          value={displayName}
                          onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="font-medium text-sm sm:text-base truncate">
                          {displayName}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={handleUpdateDevice}
                            className="h-8 px-3 text-xs"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingDevice(null)}
                            className="h-8 px-3 text-xs"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingDevice({ id: device.id, name: device.name })}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteDevice(device.id)}
                            className="h-8 px-3 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className="p-3 sm:p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Dispozitiv nou</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume dispozitiv" 
                  value={newDeviceName} 
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateDevice();
                    }
                  }}
                />
                <Button 
                  onClick={handleCreateDevice}
                  className="w-full"
                  disabled={!newDeviceName.trim()}
                >
                  Adaugă dispozitiv
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Filters Dialog - Quick Access */}
      <Dialog open={isManageFiltersOpen} onOpenChange={setIsManageFiltersOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionează filtre</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Card 
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setIsManageFiltersOpen(false);
                setIsManageCategoriesOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Gestionează categorii</div>
                  <div className="text-sm text-muted-foreground">
                    {categories.length} {categories.length === 1 ? 'categorie' : 'categorii'}
                  </div>
                </div>
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setIsManageFiltersOpen(false);
                setIsManageLocationsOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Gestionează locații</div>
                  <div className="text-sm text-muted-foreground">
                    {photoLocations.length} {photoLocations.length === 1 ? 'locație' : 'locații'}
                  </div>
                </div>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setIsManageFiltersOpen(false);
                setIsManageDevicesOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Gestionează dispozitive</div>
                  <div className="text-sm text-muted-foreground">
                    {photoDevices.length} {photoDevices.length === 1 ? 'dispozitiv' : 'dispozitive'}
                  </div>
                </div>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={isManageCategoriesOpen} onOpenChange={setIsManageCategoriesOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionează categorii</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {categories.map((cat) => {
              const isEditing = editingCategory && editingCategory.value === cat.value;
              const displayLabel = isEditing ? editingCategory.label : cat.label;
              
              return (
                <Card key={cat.value} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input 
                          value={displayLabel}
                          onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                          className="text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="font-medium text-sm sm:text-base truncate">
                          {displayLabel}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={handleUpdateCategory}
                            className="h-8 px-3 text-xs"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingCategory(null)}
                            className="h-8 px-3 text-xs"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingCategory({ value: cat.value, label: cat.label })}
                            className="h-8 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteCategory(cat.value)}
                            className="h-8 px-3 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className="p-3 sm:p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Categorie nouă</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume categorie (ex: Portret)" 
                  value={newCategoryLabel} 
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  className="text-sm"
                />
                <Button 
                  onClick={handleCreateCategory}
                  className="w-full"
                  disabled={!newCategoryLabel.trim()}
                >
                  Adaugă categorie
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

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
    </PageLayout>
  );
};

export default Photography;