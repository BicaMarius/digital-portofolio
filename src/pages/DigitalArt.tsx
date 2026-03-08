import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Plus, Search, Grid3X3, List, ChevronLeft, ChevronRight, X, Edit, Trash2, Trash, Undo2, EyeOff, Cloud, FolderOpen, Settings2, Check } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
import { useDigitalArtDimensionOptions, useDigitalArtSoftwareOptions } from '@/hooks/useDigitalArtOptions';

type DigitalArtwork = GalleryItem;

const MIN_YEAR = 1900;
const MONTH_OPTIONS = [
  { value: '01', label: 'Ianuarie' },
  { value: '02', label: 'Februarie' },
  { value: '03', label: 'Martie' },
  { value: '04', label: 'Aprilie' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Iunie' },
  { value: '07', label: 'Iulie' },
  { value: '08', label: 'August' },
  { value: '09', label: 'Septembrie' },
  { value: '10', label: 'Octombrie' },
  { value: '11', label: 'Noiembrie' },
  { value: '12', label: 'Decembrie' },
] as const;

const sanitizeText = (value?: string) => (value || '').replace(/\s+/g, ' ').trim();

const clampYear = (value: string) => {
  const currentYear = new Date().getFullYear();
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return String(currentYear);
  return String(Math.max(MIN_YEAR, Math.min(currentYear, parsed)));
};

const parseDateParts = (value?: string) => {
  const currentYear = String(new Date().getFullYear());
  const normalized = sanitizeText(value);
  if (!normalized) {
    return { year: currentYear, month: '' };
  }

  const yearMatch = normalized.match(/\d{4}/);
  const monthMatch = normalized.match(/\d{4}-(\d{2})/);
  const year = yearMatch ? clampYear(yearMatch[0]) : currentYear;
  const month = monthMatch?.[1] && MONTH_OPTIONS.some((opt) => opt.value === monthMatch[1]) ? monthMatch[1] : '';
  return { year, month };
};

const parseCustomDimensions = (value?: string) => {
  const normalized = sanitizeText(value);
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)(?:\s*(.*))?$/);
  if (!match) return null;
  return {
    width: match[1].replace(',', '.'),
    height: match[2].replace(',', '.'),
    unit: sanitizeText(match[3] || 'px'),
  };
};

export default function DigitalArt() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const { getCount } = usePortfolioStats();
  const currentYear = String(new Date().getFullYear());
  const {
    options: softwareOptions,
    addOption: addSoftwareOption,
    updateOption: updateSoftwareOption,
    deleteOption: deleteSoftwareOption,
  } = useDigitalArtSoftwareOptions();
  const {
    options: dimensionOptions,
    addOption: addDimensionOption,
    updateOption: updateDimensionOption,
    deleteOption: deleteDimensionOption,
  } = useDigitalArtDimensionOptions();
  
  // State
  const [artworks, setArtworks] = useState<DigitalArtwork[]>([]);
  const [trashedArtworks, setTrashedArtworks] = useState<DigitalArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArtwork, setSelectedArtwork] = useState<DigitalArtwork | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isManageSoftwareOpen, setIsManageSoftwareOpen] = useState(false);
  const [isManageDimensionsOpen, setIsManageDimensionsOpen] = useState(false);
  const [editingSoftwareId, setEditingSoftwareId] = useState<string | null>(null);
  const [editingSoftwareName, setEditingSoftwareName] = useState('');
  const [editingDimensionId, setEditingDimensionId] = useState<string | null>(null);
  const [editingDimensionName, setEditingDimensionName] = useState('');
  const [newSoftwareName, setNewSoftwareName] = useState('');
  const [newDimensionName, setNewDimensionName] = useState('');
  const [isAddingNewSoftware, setIsAddingNewSoftware] = useState(false);
  const [softwareInputValue, setSoftwareInputValue] = useState('');
  const [isCustomDimension, setIsCustomDimension] = useState(false);
  const [selectedDimensionPreset, setSelectedDimensionPreset] = useState('');
  const [customDimensionWidth, setCustomDimensionWidth] = useState('');
  const [customDimensionHeight, setCustomDimensionHeight] = useState('');
  const [customDimensionUnit, setCustomDimensionUnit] = useState('px');
  const [creationYear, setCreationYear] = useState(currentYear);
  const [creationMonth, setCreationMonth] = useState('');
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    description: '',
    subcategory: 'illustration',
    medium: '',
    dimensions: '',
    date: currentYear,
    isPrivate: false
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [addImageFiles, setAddImageFiles] = useState<File[]>([]);
  const [addImagePreview, setAddImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const addImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const itemsPerPage = 12;

  // Detect F11 fullscreen mode
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
  const categories = [
    { value: 'all', label: 'Toate' },
    { value: 'poster', label: 'Postere' },
    { value: 'illustration', label: 'Ilustrații' },
    { value: 'logo', label: 'Logo-uri' },
    { value: 'banner', label: 'Bannere' },
    { value: 'social-media', label: 'Social Media' }
  ];

  const softwareSelectOptions = React.useMemo(() => {
    const names = softwareOptions.map((opt) => opt.name);
    const currentMedium = sanitizeText(formData.medium);
    if (currentMedium && !names.includes(currentMedium)) {
      return [currentMedium, ...names];
    }
    return names;
  }, [softwareOptions, formData.medium]);

  const dimensionSelectOptions = React.useMemo(() => {
    const names = dimensionOptions.map((opt) => opt.name);
    if (selectedDimensionPreset && !names.includes(selectedDimensionPreset)) {
      return [selectedDimensionPreset, ...names];
    }
    return names;
  }, [dimensionOptions, selectedDimensionPreset]);

  const buildDateValue = () => {
    const year = clampYear(creationYear || currentYear);
    return creationMonth ? `${year}-${creationMonth}` : year;
  };

  const buildDimensionsValue = () => {
    if (isCustomDimension) {
      const width = sanitizeText(customDimensionWidth);
      const height = sanitizeText(customDimensionHeight);
      if (!width || !height) return '';
      const unit = sanitizeText(customDimensionUnit);
      return `${width} x ${height}${unit ? ` ${unit}` : ''}`;
    }
    return sanitizeText(selectedDimensionPreset || formData.dimensions);
  };

  const syncDimensionStateFromValue = React.useCallback((value?: string) => {
    const normalized = sanitizeText(value);
    if (!normalized) {
      setIsCustomDimension(false);
      setSelectedDimensionPreset('');
      setCustomDimensionWidth('');
      setCustomDimensionHeight('');
      setCustomDimensionUnit('px');
      return;
    }

    if (dimensionOptions.some((opt) => opt.name === normalized)) {
      setIsCustomDimension(false);
      setSelectedDimensionPreset(normalized);
      setCustomDimensionWidth('');
      setCustomDimensionHeight('');
      setCustomDimensionUnit('px');
      return;
    }

    const parsed = parseCustomDimensions(normalized);
    if (parsed) {
      setIsCustomDimension(true);
      setSelectedDimensionPreset('');
      setCustomDimensionWidth(parsed.width);
      setCustomDimensionHeight(parsed.height);
      setCustomDimensionUnit(parsed.unit || 'px');
      return;
    }

    setIsCustomDimension(false);
    setSelectedDimensionPreset(normalized);
    setCustomDimensionWidth('');
    setCustomDimensionHeight('');
    setCustomDimensionUnit('px');
  }, [dimensionOptions]);

  // Load artworks from cloud
  const reloadArtworks = async () => {
    try {
      setLoading(true);
      const items = await getGalleryItemsByCategory('art');
      const digitalArt = items.filter(item => item.subcategory === 'digital-art') as DigitalArtwork[];
      
      if (!isAdmin) {
        setArtworks(digitalArt.filter(art => !art.isPrivate));
      } else {
        setArtworks(digitalArt);
      }
    } catch (error) {
      console.error('Error loading digital art:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca lucrările.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load trashed items
  const reloadTrash = async () => {
    if (!isAdmin) return;
    
    try {
      const items = await getTrashedGalleryItemsByCategory('art');
      const digitalArt = items.filter(item => item.subcategory === 'digital-art') as DigitalArtwork[];
      setTrashedArtworks(digitalArt);
    } catch (error) {
      console.error('Error loading trash:', error);
    }
  };

  useEffect(() => {
    reloadArtworks();
    if (isAdmin) {
      reloadTrash();
    }
  }, [isAdmin]);

  // Filter and search logic
  const filteredArtworks = artworks.filter(artwork => {
    const matchesSearch = artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          artwork.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || artwork.materials?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);
  const paginatedArtworks = filteredArtworks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Keyboard navigation for fullscreen image
  useEffect(() => {
    if (!selectedArtwork) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        setSelectedArtwork(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedArtwork, filteredArtworks]);

  // Navigate to previous image
  const prevImage = () => {
    if (!selectedArtwork) return;
    const currentIndex = filteredArtworks.findIndex(a => a.id === selectedArtwork.id);
    if (currentIndex > 0) {
      setSelectedArtwork(filteredArtworks[currentIndex - 1]);
    }
  };

  // Navigate to next image
  const nextImage = () => {
    if (!selectedArtwork) return;
    const currentIndex = filteredArtworks.findIndex(a => a.id === selectedArtwork.id);
    if (currentIndex < filteredArtworks.length - 1) {
      setSelectedArtwork(filteredArtworks[currentIndex + 1]);
    }
  };

  // Handle add artwork
  const handleAddArtwork = async () => {
    const isBulk = addImageFiles.length > 1;
    if ((!isBulk && !formData.title) || addImageFiles.length === 0) {
      toast({
        title: 'Eroare',
        description: 'Titlul și imaginea sunt obligatorii.',
        variant: 'destructive'
      });
      return;
    }
    if (isCustomDimension && (!sanitizeText(customDimensionWidth) || !sanitizeText(customDimensionHeight))) {
      toast({
        title: 'Eroare',
        description: 'Pentru dimensiunea personalizata completeaza lungimea si latimea.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      const resolvedMedium = sanitizeText(formData.medium);
      const resolvedDimensions = buildDimensionsValue();
      const resolvedDate = buildDateValue();
      
      for (const file of addImageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'digital-art');
        const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        const { url } = await uploadRes.json();
        const title = isBulk ? getFileTitle(file) : formData.title;

        await createGalleryItem({
          category: 'art',
          subcategory: 'digital-art',
          title,
          image: url,
          description: formData.description,
          materials: [formData.subcategory],
          medium: resolvedMedium || null,
          dimensions: resolvedDimensions || null,
          date: resolvedDate,
          isPrivate: formData.isPrivate
        } as any);
      }

      toast({
        title: 'Succes',
        description: isBulk ? 'Lucrările au fost adăugate cu succes.' : 'Lucrarea a fost adăugată cu succes.'
      });

      setShowAddDialog(false);
      resetForm();
      await reloadArtworks();
    } catch (error) {
      console.error('Error adding artwork:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga lucrarea.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle edit artwork
  const handleEditArtwork = async () => {
    if (!selectedArtwork || !formData.title) {
      toast({
        title: 'Eroare',
        description: 'Titlul este obligatoriu.',
        variant: 'destructive'
      });
      return;
    }
    if (isCustomDimension && (!sanitizeText(customDimensionWidth) || !sanitizeText(customDimensionHeight))) {
      toast({
        title: 'Eroare',
        description: 'Pentru dimensiunea personalizata completeaza lungimea si latimea.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      const resolvedMedium = sanitizeText(formData.medium);
      const resolvedDimensions = buildDimensionsValue();
      const resolvedDate = buildDateValue();
      
      let imageUrl = formData.image;
      
      // Upload new image if selected
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('folder', 'digital-art');
        const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      await updateGalleryItem(selectedArtwork.id!, {
        title: formData.title,
        image: imageUrl,
        description: formData.description,
        materials: [formData.subcategory],
        medium: resolvedMedium || null,
        dimensions: resolvedDimensions || null,
        date: resolvedDate,
        isPrivate: formData.isPrivate
      } as any);

      toast({
        title: 'Succes',
        description: 'Lucrarea a fost actualizată cu succes.'
      });

      setShowEditDialog(false);
      setSelectedArtwork(null);
      resetForm();
      await reloadArtworks();
    } catch (error) {
      console.error('Error editing artwork:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza lucrarea.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete artwork
  const handleDeleteArtwork = async () => {
    if (!selectedArtwork) return;

    try {
      await softDeleteGalleryItem(selectedArtwork.id!);

      toast({
        title: 'Succes',
        description: 'Lucrarea a fost mutată în coș.'
      });

      setShowDeleteDialog(false);
      setSelectedArtwork(null);
      await reloadArtworks();
      await reloadTrash();
    } catch (error) {
      console.error('Error deleting artwork:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge lucrarea.',
        variant: 'destructive'
      });
    }
  };

  // Handle restore artwork
  const handleRestoreArtwork = async (artwork: DigitalArtwork) => {
    try {
      await restoreGalleryItem(artwork.id!);

      toast({
        title: 'Succes',
        description: 'Lucrarea a fost restaurată.'
      });

      await reloadArtworks();
      await reloadTrash();
    } catch (error) {
      console.error('Error restoring artwork:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut restaura lucrarea.',
        variant: 'destructive'
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (artwork: DigitalArtwork) => {
    try {
      await deleteGalleryItem(artwork.id!);

      toast({
        title: 'Succes',
        description: 'Lucrarea a fost ștearsă permanent.'
      });

      await reloadTrash();
    } catch (error) {
      console.error('Error permanently deleting artwork:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge lucrarea.',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      image: '',
      description: '',
      subcategory: 'illustration',
      medium: '',
      dimensions: '',
      date: currentYear,
      isPrivate: false
    });
    setCreationYear(currentYear);
    setCreationMonth('');
    setIsAddingNewSoftware(false);
    setSoftwareInputValue('');
    setIsCustomDimension(false);
    setSelectedDimensionPreset('');
    setCustomDimensionWidth('');
    setCustomDimensionHeight('');
    setCustomDimensionUnit('px');
    setImageFile(null);
    setImagePreview('');
    setAddImageFiles([]);
    setAddImagePreview('');
    if (addImageInputRef.current) {
      addImageInputRef.current.value = '';
    }
  };

  // Open edit dialog
  const openEditDialog = (artwork: DigitalArtwork) => {
    const parsedDate = parseDateParts(artwork.date || currentYear);
    setSelectedArtwork(artwork);
    setFormData({
      title: artwork.title,
      image: artwork.image,
      description: artwork.description || '',
      subcategory: artwork.materials?.[0] || 'illustration',
      medium: sanitizeText(artwork.medium || ''),
      dimensions: sanitizeText(artwork.dimensions || ''),
      date: artwork.date || currentYear,
      isPrivate: artwork.isPrivate || false
    });
    setCreationYear(parsedDate.year);
    setCreationMonth(parsedDate.month);
    setSoftwareInputValue('');
    setIsAddingNewSoftware(false);
    syncDimensionStateFromValue(artwork.dimensions || '');
    setImageFile(null);
    setImagePreview(artwork.image);
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (artwork: DigitalArtwork) => {
    setSelectedArtwork(artwork);
    setShowDeleteDialog(true);
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getFileTitle = (file: File) => {
    const base = file.name.replace(/\.[^/.]+$/, '').trim();
    return base || 'Fără titlu';
  };

  const triggerAddFileDialog = () => {
    addImageInputRef.current?.click();
  };

  const handleAddImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAddImageFiles(files);
    if (files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setAddImagePreview(reader.result as string);
      reader.readAsDataURL(files[0]);
    } else {
      setAddImagePreview('');
    }
    if (addImageInputRef.current) {
      addImageInputRef.current.value = '';
    }
  };

  const handleAddCloudPicker = async () => {
    const picker = (window as any)?.showOpenFilePicker;
    if (picker) {
      try {
        const handles = await picker({
          multiple: true,
          types: [
            {
              description: 'Imagini',
              accept: {
                'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif']
              }
            }
          ]
        });
        if (!handles || handles.length === 0) return;
        const files = await Promise.all(handles.map((h: any) => h.getFile()));
        setAddImageFiles(files as File[]);
        if (files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => setAddImagePreview(reader.result as string);
          reader.readAsDataURL(files[0]);
        } else {
          setAddImagePreview('');
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('[DigitalArt] Cloud picker error:', error);
        toast({ title: 'Eroare', description: 'Nu am putut deschide selectorul de fișiere.', variant: 'destructive' });
      }
    } else {
      triggerAddFileDialog();
    }
  };

  const handleCreateSoftwareOption = async () => {
    const normalized = sanitizeText(newSoftwareName);
    if (!normalized) return;
    await addSoftwareOption(normalized);
    setNewSoftwareName('');
    toast({ title: 'Adaugat', description: 'Software-ul a fost adaugat.' });
  };

  const handleUpdateSoftwareOption = async () => {
    if (!editingSoftwareId) return;
    const normalized = sanitizeText(editingSoftwareName);
    if (!normalized) return;
    const oldSoftware = softwareOptions.find((opt) => opt.id === editingSoftwareId)?.name;
    await updateSoftwareOption(editingSoftwareId, normalized);
    if (oldSoftware && sanitizeText(formData.medium) === oldSoftware) {
      setFormData({ ...formData, medium: normalized });
    }
    setEditingSoftwareId(null);
    setEditingSoftwareName('');
    toast({ title: 'Actualizat', description: 'Software-ul a fost actualizat.' });
  };

  const handleDeleteSoftwareOption = async (optionId: string) => {
    const option = softwareOptions.find((item) => item.id === optionId);
    await deleteSoftwareOption(optionId);
    if (option && sanitizeText(formData.medium) === option.name) {
      setFormData({ ...formData, medium: '' });
    }
    toast({ title: 'Sters', description: 'Software-ul a fost sters din lista.' });
  };

  const handleCreateDimensionOption = async () => {
    const normalized = sanitizeText(newDimensionName);
    if (!normalized) return;
    await addDimensionOption(normalized);
    setNewDimensionName('');
    toast({ title: 'Adaugata', description: 'Dimensiunea a fost adaugata.' });
  };

  const handleUpdateDimensionOption = async () => {
    if (!editingDimensionId) return;
    const normalized = sanitizeText(editingDimensionName);
    if (!normalized) return;
    const oldDimension = dimensionOptions.find((opt) => opt.id === editingDimensionId)?.name;
    await updateDimensionOption(editingDimensionId, normalized);
    if (oldDimension && selectedDimensionPreset === oldDimension) {
      setSelectedDimensionPreset(normalized);
      setFormData({ ...formData, dimensions: normalized });
    }
    setEditingDimensionId(null);
    setEditingDimensionName('');
    toast({ title: 'Actualizata', description: 'Dimensiunea a fost actualizata.' });
  };

  const handleDeleteDimensionOption = async (optionId: string) => {
    const option = dimensionOptions.find((item) => item.id === optionId);
    await deleteDimensionOption(optionId);
    if (option && selectedDimensionPreset === option.name) {
      setSelectedDimensionPreset('');
      setFormData({ ...formData, dimensions: '' });
    }
    toast({ title: 'Stearsa', description: 'Dimensiunea a fost stearsa din lista.' });
  };

  const artworkCount = getCount('digital-art') ?? filteredArtworks.length;

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Palette className="h-7 w-7 sm:h-8 sm:w-8 text-art-accent" />
              <h1 className="text-2xl font-bold gradient-text leading-tight">
                Artă Digitală
              </h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Design grafic și ilustrații digitale
            </p>
          </div>
        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          {/* Header cu count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Lucrări</h2>
            <span className="text-sm text-muted-foreground">
              Total: {loading ? '...' : artworkCount}
            </span>
          </div>

        {/* Toolbar - 2 rows on mobile, 1 row on desktop */}
        <div className="space-y-3 md:space-y-0">
          {/* Search bar - full width on mobile, part of flex on desktop */}
          <div className="relative md:hidden">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Caută lucrări..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar for desktop */}
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Caută lucrări..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle buttons */}
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Trash button (admin only, desktop) */}
            {isAdmin && !isMobile && trashedArtworks.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTrashDialog(true)}
                className="relative"
              >
                <Trash className="w-4 h-4" />
                <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                  {trashedArtworks.length}
                </span>
              </Button>
            )}
            
            {/* Add button (admin only, desktop) */}
            {isAdmin && !isMobile && (
              <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="ml-auto">
                <Palette className="w-4 h-4 mr-2" />
                Adaugă Operă
              </Button>
            )}
          </div>
        </div>

        {/* Spacing between toolbar and content */}
        <div className="h-6 md:h-8" />

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
        ) : paginatedArtworks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Nu s-au găsit lucrări.' 
              : 'Nu există încă lucrări.'}
          </div>
        ) : (
          <>
            {/* Grid/List View */}
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
                : 'grid grid-cols-1 gap-4 md:gap-6'
            }>
              {paginatedArtworks.map((artwork) => (
                <Card
                  key={artwork.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedArtwork(artwork)}
                >
                  <CardContent className="p-0 relative">
                    {viewMode === 'grid' ? (
                      <div className="relative aspect-[3/4] bg-muted">
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      
                        {/* Black overlay gradient at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        
                        {/* Info overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white z-10">
                          <h3 className="font-bold text-base md:text-lg mb-1 line-clamp-2">
                            {artwork.title}
                          </h3>
                          {artwork.medium && (
                            <p className="text-xs md:text-sm opacity-90 line-clamp-1">
                              {artwork.medium}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                            <span>{artwork.materials?.[0] || 'Digital'}</span>
                            {artwork.date && <span>{artwork.date}</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                        <div className="w-24 sm:w-32 md:w-40 flex-shrink-0 rounded-lg overflow-hidden">
                          <img 
                            src={artwork.image} 
                            alt={artwork.title}
                            className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2">
                            {artwork.title}
                          </h3>
                          {artwork.medium && (
                            <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                              {artwork.medium}
                            </p>
                          )}
                          {artwork.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                              {artwork.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{artwork.materials?.[0] || 'Digital'}</span>
                            {artwork.dimensions && <span>• {artwork.dimensions}</span>}
                            {artwork.date && <span>• {artwork.date}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                      
                    {/* Private indicator */}
                    {artwork.isPrivate && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded z-10">
                        <EyeOff className="w-3 h-3" />
                      </div>
                    )}
                    
                    {/* Admin controls */}
                    {isAdmin && (
                      <div className={`absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                        viewMode === 'list' ? 'sm:top-3 sm:right-3' : ''
                      }`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/50 hover:bg-blue-500/90 text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(artwork);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/50 hover:bg-red-500/90 text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(artwork);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Pagina {currentPage} din {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </section>

      {/* Floating Action Button (Mobile Admin) */}
      {isAdmin && isMobile && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
          {trashedArtworks.length > 0 && (
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full shadow-lg bg-background relative"
              onClick={() => setShowTrashDialog(true)}
            >
              <Trash className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                {trashedArtworks.length}
              </span>
            </Button>
          )}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full shadow-lg"
            onClick={() => { resetForm(); setShowAddDialog(true); }}
          >
            <Palette className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Fullscreen Image Dialog */}
      {selectedArtwork && (
        <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
          <DialogContent className="max-w-7xl w-full max-h-[95vh] p-0">
            <DialogTitle className="sr-only">{selectedArtwork.title}</DialogTitle>
            <DialogDescription className="sr-only">Vizualizare fullscreen lucrare digitală</DialogDescription>
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Image Section */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/95 relative">
                {/* Navigation arrows */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
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
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>

                <img
                  src={selectedArtwork.image}
                  alt={selectedArtwork.title}
                  className="max-w-full max-h-[70vh] lg:max-h-[85vh] object-contain rounded"
                />
              </div>
              
              {/* Details Panel */}
              <div className="w-full lg:w-80 xl:w-96 bg-background p-6 overflow-y-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedArtwork.title}</h2>
                  {selectedArtwork.description && (
                    <p className="text-muted-foreground">{selectedArtwork.description}</p>
                  )}
                </div>

                <div className="space-y-4 text-sm">
                  {selectedArtwork.materials && selectedArtwork.materials.length > 0 && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Categorie:</span>
                      <p className="mt-1 capitalize">
                        {categories.find(c => c.value === selectedArtwork.materials[0])?.label || selectedArtwork.materials[0]}
                      </p>
                    </div>
                  )}
                  
                  {selectedArtwork.medium && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Software:</span>
                      <p className="mt-1">{selectedArtwork.medium}</p>
                    </div>
                  )}
                  
                  {selectedArtwork.dimensions && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Dimensiuni:</span>
                      <p className="mt-1">{selectedArtwork.dimensions}</p>
                    </div>
                  )}
                  
                  {selectedArtwork.date && (
                    <div>
                      <span className="font-semibold text-muted-foreground">Data creării:</span>
                      <p className="mt-1">{selectedArtwork.date}</p>
                    </div>
                  )}
                  
                  {selectedArtwork.isPrivate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EyeOff className="w-4 h-4" />
                      <span className="text-xs">Privat</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Dialogs */}
      {isAdmin && (
        <>
          {/* Add Dialog */}
          <Dialog
            open={showAddDialog}
            onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adaugă Lucrare Nouă</DialogTitle>
                <DialogDescription>
                  Completează detaliile lucrării de artă digitală.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informații</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-title">{addImageFiles.length > 1 ? 'Titlu (opțional)' : 'Titlu *'}</Label>
                    <Input
                      id="add-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titlul lucrării"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-image">{addImageFiles.length > 1 ? 'Imagini (opțional)' : 'Imagine *'}</Label>
                    <div className="border-2 border-dashed rounded-md p-3 bg-muted/20">
                      {addImagePreview ? (
                        <div className="relative w-full aspect-video rounded border overflow-hidden bg-muted">
                          <img
                            src={addImagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-44 text-muted-foreground">
                          <Palette className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Selectează una sau mai multe imagini</p>
                        </div>
                      )}
                      <input
                        ref={addImageInputRef}
                        id="add-image"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAddImagesChange}
                      />
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={triggerAddFileDialog}>
                          <FolderOpen className="h-4 w-4" />
                          Din dispozitiv
                        </Button>
                        <Button type="button" variant="outline" className="inline-flex items-center gap-2" onClick={handleAddCloudPicker}>
                          <Cloud className="h-4 w-4" />
                          Drive / Google Photos
                        </Button>
                      </div>
                      {addImageFiles.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground truncate">
                          {addImageFiles.length === 1 ? addImageFiles[0].name : `${addImageFiles.length} fișiere selectate`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-category">Categorie</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                    >
                      <SelectTrigger id="add-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.value !== 'all').map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-description">Descriere</Label>
                    <Textarea
                      id="add-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrierea lucrării..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="add-software">Software</Label>
                    <Select
                      value={isAddingNewSoftware ? '__new_software' : (formData.medium || '__none_software')}
                      onValueChange={(value) => {
                        if (value === '__manage_software') {
                          setIsManageSoftwareOpen(true);
                          return;
                        }
                        if (value === '__new_software') {
                          setIsAddingNewSoftware(true);
                          setSoftwareInputValue('');
                          return;
                        }
                        if (value === '__none_software') {
                          setIsAddingNewSoftware(false);
                          setSoftwareInputValue('');
                          setFormData({ ...formData, medium: '' });
                          return;
                        }
                        setIsAddingNewSoftware(false);
                        setSoftwareInputValue('');
                        setFormData({ ...formData, medium: value });
                      }}
                    >
                      <SelectTrigger id="add-software">
                        <SelectValue placeholder="Selecteaza software..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none_software">Nesetat</SelectItem>
                        {softwareSelectOptions.map((softwareName) => (
                          <SelectItem key={softwareName} value={softwareName}>
                            {softwareName}
                          </SelectItem>
                        ))}
                        {isAdmin && <div className="h-px bg-border my-1" />}
                        <SelectItem value="__new_software">
                          <span className="text-muted-foreground italic">+ Adauga software nou...</span>
                        </SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_software">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestioneaza software</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isAddingNewSoftware && (
                      <Input
                        value={softwareInputValue}
                        onChange={(e) => setSoftwareInputValue(e.target.value)}
                        placeholder="ex: Clip Studio Paint"
                        className="mt-2"
                        autoFocus
                        onBlur={async () => {
                          const normalized = sanitizeText(softwareInputValue);
                          if (!normalized) return;
                          await addSoftwareOption(normalized);
                          setFormData({ ...formData, medium: normalized });
                          setIsAddingNewSoftware(false);
                          setSoftwareInputValue('');
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const normalized = sanitizeText(softwareInputValue);
                            if (!normalized) return;
                            await addSoftwareOption(normalized);
                            setFormData({ ...formData, medium: normalized });
                            setIsAddingNewSoftware(false);
                            setSoftwareInputValue('');
                          }
                          if (e.key === 'Escape') {
                            setIsAddingNewSoftware(false);
                            setSoftwareInputValue('');
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-dimensions">Dimensiuni</Label>
                    <Select
                      value={isCustomDimension ? '__custom_dimension' : (selectedDimensionPreset || '__none_dimension')}
                      onValueChange={(value) => {
                        if (value === '__manage_dimensions') {
                          setIsManageDimensionsOpen(true);
                          return;
                        }
                        if (value === '__custom_dimension') {
                          setIsCustomDimension(true);
                          setSelectedDimensionPreset('');
                          return;
                        }
                        if (value === '__none_dimension') {
                          setIsCustomDimension(false);
                          setSelectedDimensionPreset('');
                          setCustomDimensionWidth('');
                          setCustomDimensionHeight('');
                          setFormData({ ...formData, dimensions: '' });
                          return;
                        }
                        setIsCustomDimension(false);
                        setSelectedDimensionPreset(value);
                        setCustomDimensionWidth('');
                        setCustomDimensionHeight('');
                        setFormData({ ...formData, dimensions: value });
                      }}
                    >
                      <SelectTrigger id="add-dimensions">
                        <SelectValue placeholder="Selecteaza dimensiuni..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none_dimension">Nesetat</SelectItem>
                        {dimensionSelectOptions.map((dimensionName) => (
                          <SelectItem key={dimensionName} value={dimensionName}>
                            {dimensionName}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-border my-1" />
                        <SelectItem value="__custom_dimension">Custom (lungime x latime)</SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_dimensions">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestioneaza dimensiuni</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isCustomDimension && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          value={customDimensionWidth}
                          onChange={(e) => setCustomDimensionWidth(e.target.value)}
                          placeholder="Lungime"
                          inputMode="decimal"
                        />
                        <Input
                          value={customDimensionHeight}
                          onChange={(e) => setCustomDimensionHeight(e.target.value)}
                          placeholder="Latime"
                          inputMode="decimal"
                        />
                        <Input
                          value={customDimensionUnit}
                          onChange={(e) => setCustomDimensionUnit(e.target.value)}
                          placeholder="Unitate (px/mm)"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-date">Data Creării</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        id="add-date"
                        type="number"
                        min={MIN_YEAR}
                        max={new Date().getFullYear()}
                        value={creationYear}
                        onChange={(e) => setCreationYear(e.target.value)}
                        onBlur={() => setCreationYear(clampYear(creationYear))}
                        placeholder="An"
                      />
                      <Select
                        value={creationMonth || '__none_month'}
                        onValueChange={(value) => setCreationMonth(value === '__none_month' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Luna (opțional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none_month">Fara luna</SelectItem>
                          {MONTH_OPTIONS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Format salvat: {buildDateValue()}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="add-private"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                    />
                    <Label htmlFor="add-private">Privat (vizibil doar pentru admin)</Label>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isUploading}>
                  Anulează
                </Button>
                <Button onClick={handleAddArtwork} disabled={isUploading}>
                  {isUploading ? 'Se încarcă...' : 'Adaugă'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) {
                setSelectedArtwork(null);
                resetForm();
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editează Lucrarea</DialogTitle>
                <DialogDescription>
                  Modifică detaliile lucrării de artă digitală.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informații</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Titlu *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titlul lucrării"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Imagine {imageFile ? '(nouă)' : '(opțional - păstrează actuala)'}</Label>
                    <Input
                      id="edit-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative w-full aspect-video rounded border overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Categorie</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.value !== 'all').map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descriere</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrierea lucrării..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="edit-software">Software</Label>
                    <Select
                      value={isAddingNewSoftware ? '__new_software' : (formData.medium || '__none_software')}
                      onValueChange={(value) => {
                        if (value === '__manage_software') {
                          setIsManageSoftwareOpen(true);
                          return;
                        }
                        if (value === '__new_software') {
                          setIsAddingNewSoftware(true);
                          setSoftwareInputValue('');
                          return;
                        }
                        if (value === '__none_software') {
                          setIsAddingNewSoftware(false);
                          setSoftwareInputValue('');
                          setFormData({ ...formData, medium: '' });
                          return;
                        }
                        setIsAddingNewSoftware(false);
                        setSoftwareInputValue('');
                        setFormData({ ...formData, medium: value });
                      }}
                    >
                      <SelectTrigger id="edit-software">
                        <SelectValue placeholder="Selecteaza software..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none_software">Nesetat</SelectItem>
                        {softwareSelectOptions.map((softwareName) => (
                          <SelectItem key={softwareName} value={softwareName}>
                            {softwareName}
                          </SelectItem>
                        ))}
                        {isAdmin && <div className="h-px bg-border my-1" />}
                        <SelectItem value="__new_software">
                          <span className="text-muted-foreground italic">+ Adauga software nou...</span>
                        </SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_software">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestioneaza software</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isAddingNewSoftware && (
                      <Input
                        value={softwareInputValue}
                        onChange={(e) => setSoftwareInputValue(e.target.value)}
                        placeholder="ex: Clip Studio Paint"
                        className="mt-2"
                        autoFocus
                        onBlur={async () => {
                          const normalized = sanitizeText(softwareInputValue);
                          if (!normalized) return;
                          await addSoftwareOption(normalized);
                          setFormData({ ...formData, medium: normalized });
                          setIsAddingNewSoftware(false);
                          setSoftwareInputValue('');
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const normalized = sanitizeText(softwareInputValue);
                            if (!normalized) return;
                            await addSoftwareOption(normalized);
                            setFormData({ ...formData, medium: normalized });
                            setIsAddingNewSoftware(false);
                            setSoftwareInputValue('');
                          }
                          if (e.key === 'Escape') {
                            setIsAddingNewSoftware(false);
                            setSoftwareInputValue('');
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dimensions">Dimensiuni</Label>
                    <Select
                      value={isCustomDimension ? '__custom_dimension' : (selectedDimensionPreset || '__none_dimension')}
                      onValueChange={(value) => {
                        if (value === '__manage_dimensions') {
                          setIsManageDimensionsOpen(true);
                          return;
                        }
                        if (value === '__custom_dimension') {
                          setIsCustomDimension(true);
                          setSelectedDimensionPreset('');
                          return;
                        }
                        if (value === '__none_dimension') {
                          setIsCustomDimension(false);
                          setSelectedDimensionPreset('');
                          setCustomDimensionWidth('');
                          setCustomDimensionHeight('');
                          setFormData({ ...formData, dimensions: '' });
                          return;
                        }
                        setIsCustomDimension(false);
                        setSelectedDimensionPreset(value);
                        setCustomDimensionWidth('');
                        setCustomDimensionHeight('');
                        setFormData({ ...formData, dimensions: value });
                      }}
                    >
                      <SelectTrigger id="edit-dimensions">
                        <SelectValue placeholder="Selecteaza dimensiuni..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none_dimension">Nesetat</SelectItem>
                        {dimensionSelectOptions.map((dimensionName) => (
                          <SelectItem key={dimensionName} value={dimensionName}>
                            {dimensionName}
                          </SelectItem>
                        ))}
                        <div className="h-px bg-border my-1" />
                        <SelectItem value="__custom_dimension">Custom (lungime x latime)</SelectItem>
                        {isAdmin && (
                          <SelectItem value="__manage_dimensions">
                            <div className="flex items-center gap-2">
                              <Settings2 className="h-3 w-3" />
                              <span>Gestioneaza dimensiuni</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isCustomDimension && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          value={customDimensionWidth}
                          onChange={(e) => setCustomDimensionWidth(e.target.value)}
                          placeholder="Lungime"
                          inputMode="decimal"
                        />
                        <Input
                          value={customDimensionHeight}
                          onChange={(e) => setCustomDimensionHeight(e.target.value)}
                          placeholder="Latime"
                          inputMode="decimal"
                        />
                        <Input
                          value={customDimensionUnit}
                          onChange={(e) => setCustomDimensionUnit(e.target.value)}
                          placeholder="Unitate (px/mm)"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Data Creării</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        id="edit-date"
                        type="number"
                        min={MIN_YEAR}
                        max={new Date().getFullYear()}
                        value={creationYear}
                        onChange={(e) => setCreationYear(e.target.value)}
                        onBlur={() => setCreationYear(clampYear(creationYear))}
                        placeholder="An"
                      />
                      <Select
                        value={creationMonth || '__none_month'}
                        onValueChange={(value) => setCreationMonth(value === '__none_month' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Luna (opțional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none_month">Fara luna</SelectItem>
                          {MONTH_OPTIONS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">Format salvat: {buildDateValue()}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-private"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                    />
                    <Label htmlFor="edit-private">Privat (vizibil doar pentru admin)</Label>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUploading}>
                  Anulează
                </Button>
                <Button onClick={handleEditArtwork} disabled={isUploading}>
                  {isUploading ? 'Se încarcă...' : 'Salvează'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Șterge Lucrarea</DialogTitle>
                <DialogDescription>
                  Ești sigur că vrei să ștergi lucrarea "{selectedArtwork?.title}"? Aceasta va fi mutată în coș.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Anulează
                </Button>
                <Button variant="destructive" onClick={handleDeleteArtwork}>
                  Șterge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Trash Dialog */}
          <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Coș de Reciclare</DialogTitle>
                <DialogDescription>
                  Lucrări șterse ({trashedArtworks.length})
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[60vh] space-y-3">
                {trashedArtworks.map((artwork) => (
                  <div key={artwork.id} className="flex items-center gap-4 p-3 border rounded">
                    <img
                      src={artwork.image}
                      alt={artwork.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{artwork.title}</h4>
                      {artwork.medium && (
                        <p className="text-sm text-muted-foreground">{artwork.medium}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreArtwork(artwork)}
                      >
                        <Undo2 className="w-4 h-4 mr-1" />
                        Restaurează
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentDelete(artwork)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isManageSoftwareOpen} onOpenChange={setIsManageSoftwareOpen}>
            <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestioneaza software</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {softwareOptions.map((option) => {
                  const isEditing = editingSoftwareId === option.id;
                  return (
                    <Card key={option.id} className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <Input
                              value={editingSoftwareName}
                              onChange={(e) => setEditingSoftwareName(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className="font-medium text-sm sm:text-base truncate">{option.name}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={handleUpdateSoftwareOption} className="h-8 px-3 text-xs">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSoftwareId(null);
                                  setEditingSoftwareName('');
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSoftwareId(option.id);
                                  setEditingSoftwareName(option.name);
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSoftwareOption(option.id)}
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
                  <div className="text-sm font-medium mb-3">Software nou</div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nume software"
                      value={newSoftwareName}
                      onChange={(e) => setNewSoftwareName(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSoftwareOption();
                      }}
                    />
                    <Button onClick={handleCreateSoftwareOption} className="w-full" disabled={!sanitizeText(newSoftwareName)}>
                      Adauga software
                    </Button>
                  </div>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isManageDimensionsOpen} onOpenChange={setIsManageDimensionsOpen}>
            <DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestioneaza dimensiuni</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {dimensionOptions.map((option) => {
                  const isEditing = editingDimensionId === option.id;
                  return (
                    <Card key={option.id} className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <Input
                              value={editingDimensionName}
                              onChange={(e) => setEditingDimensionName(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className="font-medium text-sm sm:text-base truncate">{option.name}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={handleUpdateDimensionOption} className="h-8 px-3 text-xs">
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingDimensionId(null);
                                  setEditingDimensionName('');
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingDimensionId(option.id);
                                  setEditingDimensionName(option.name);
                                }}
                                className="h-8 px-3 text-xs"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDimensionOption(option.id)}
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
                  <div className="text-sm font-medium mb-3">Dimensiune noua</div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Ex: A0 (841 x 1189 mm)"
                      value={newDimensionName}
                      onChange={(e) => setNewDimensionName(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateDimensionOption();
                      }}
                    />
                    <Button onClick={handleCreateDimensionOption} className="w-full" disabled={!sanitizeText(newDimensionName)}>
                      Adauga dimensiune
                    </Button>
                  </div>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageLayout>
  );
}
