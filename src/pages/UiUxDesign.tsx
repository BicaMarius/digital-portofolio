import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Plus, Search, Filter, Monitor, Tablet, Eye, ExternalLink, Edit, Trash2, Trash, Undo2, EyeOff, Figma, X, ChevronLeft, ChevronRight, Grid3x3, List, RotateCcw } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
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

type UiUxProject = GalleryItem;

export default function UiUxDesign() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const { getCount } = usePortfolioStats();
  
  // State
  const [projects, setProjects] = useState<UiUxProject[]>([]);
  const [trashedProjects, setTrashedProjects] = useState<UiUxProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<UiUxProject | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'mobile-app',
    platform: 'web',
    status: 'concept',
    tools: '',
    screens: '',
    interactive: false,
    prototypeUrl: '',
    isPrivate: false
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fullscreen navigation state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Load projects from cloud
  const reloadProjects = async () => {
    try {
      setLoading(true);
      const items = await getGalleryItemsByCategory('ui-ux');
      
      if (!isAdmin) {
        setProjects(items.filter(p => !p.isPrivate) as UiUxProject[]);
      } else {
        setProjects(items as UiUxProject[]);
      }
    } catch (error) {
      console.error('Error loading UI/UX projects:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca proiectele.',
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
      const items = await getTrashedGalleryItemsByCategory('ui-ux');
      setTrashedProjects(items as UiUxProject[]);
    } catch (error) {
      console.error('Error loading trash:', error);
    }
  };

  useEffect(() => {
    reloadProjects();
    if (isAdmin) {
      reloadTrash();
    }
  }, [isAdmin]);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!selectedProject || showEditDialog || showDeleteDialog) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setCurrentImageIndex(0);
      } else if (e.key === 'ArrowLeft') {
        navigateToPrevProject();
      } else if (e.key === 'ArrowRight') {
        navigateToNextProject();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedProject, showEditDialog, showDeleteDialog, projects]);

  // Navigate to previous project
  const navigateToPrevProject = () => {
    if (!selectedProject) return;
    const currentIndex = visibleProjects.findIndex(p => p.id === selectedProject.id);
    if (currentIndex > 0) {
      setSelectedProject(visibleProjects[currentIndex - 1]);
      setCurrentImageIndex(0);
      setIsAutoRotating(true); // Resume auto-rotation for new project
    }
  };

  // Navigate to next project
  const navigateToNextProject = () => {
    if (!selectedProject) return;
    const currentIndex = visibleProjects.findIndex(p => p.id === selectedProject.id);
    if (currentIndex < visibleProjects.length - 1) {
      setSelectedProject(visibleProjects[currentIndex + 1]);
      setCurrentImageIndex(0);
      setIsAutoRotating(true); // Resume auto-rotation for new project
    }
  };

  // Auto-rotation for project images (carousel)
  useEffect(() => {
    if (!selectedProject || !isAutoRotating) return;
    
    // Extract images from date field
    const projectImages = selectedProject.date?.includes('|') 
      ? selectedProject.date.split('|')
      : [selectedProject.image];
    
    if (projectImages.length <= 1) return; // No rotation needed for single image
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
    }, 4000); // Rotate every 4 seconds
    
    return () => clearInterval(interval);
  }, [selectedProject, isAutoRotating]);

  // Filtered projects
  const visibleProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || project.subcategory === filterType;
    const matchesPlatform = filterPlatform === 'all' || (project as any).device === filterPlatform;
    return matchesSearch && matchesType && matchesPlatform;
  });

  // Use actual projects count, fallback to getCount only if projects not loaded yet
  const projectCount = projects.length > 0 ? (isAdmin ? projects.length : projects.filter(p => !p.isPrivate).length) : (getCount('ui-ux') ?? 0);

  // Handle add project
  const handleAddProject = async () => {
    if (!formData.title || imageFiles.length === 0) {
      toast({
        title: 'Eroare',
        description: 'Titlul și cel puțin o imagine sunt obligatorii.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload all images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'ui-ux');
        const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        const { url } = await uploadRes.json();
        uploadedUrls.push(url);
      }

      // Use first image as main image, store all URLs concatenated with | separator
      const mainImage = uploadedUrls[0];
      const allImagesString = uploadedUrls.join('|');

      await createGalleryItem({
        category: 'ui-ux',
        subcategory: formData.type,
        title: formData.title,
        image: mainImage,
        description: formData.description,
        device: formData.platform,
        materials: formData.tools.split(',').map(t => t.trim()).filter(Boolean),
        dimensions: formData.screens,
        location: formData.prototypeUrl,
        medium: formData.status,
        isPrivate: formData.isPrivate,
        // Store all images in date field as temporary solution
        date: allImagesString
      } as any);

      toast({
        title: 'Succes',
        description: 'Proiectul a fost adăugat cu succes.'
      });

      setShowAddDialog(false);
      resetForm();
      await reloadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga proiectul.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle edit project
  const handleEditProject = async () => {
    if (!selectedProject || !formData.title) {
      toast({
        title: 'Eroare',
        description: 'Titlul este obligatoriu.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      
      let imageUrl = selectedProject.image;
      
      // Upload new image if selected
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('folder', 'ui-ux');
        const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: fd });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      await updateGalleryItem(selectedProject.id!, {
        subcategory: formData.type,
        title: formData.title,
        image: imageUrl,
        description: formData.description,
        device: formData.platform,
        materials: formData.tools.split(',').map(t => t.trim()).filter(Boolean),
        dimensions: formData.screens,
        location: formData.prototypeUrl,
        medium: formData.status,
        isPrivate: formData.isPrivate
      } as any);

      toast({
        title: 'Succes',
        description: 'Proiectul a fost actualizat cu succes.'
      });

      setShowEditDialog(false);
      setSelectedProject(null);
      resetForm();
      await reloadProjects();
    } catch (error) {
      console.error('Error editing project:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza proiectul.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await softDeleteGalleryItem(selectedProject.id!);

      toast({
        title: 'Succes',
        description: 'Proiectul a fost mutat în coș.'
      });

      setShowDeleteDialog(false);
      setSelectedProject(null);
      await reloadProjects();
      await reloadTrash();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge proiectul.',
        variant: 'destructive'
      });
    }
  };

  // Handle restore project
  const handleRestoreProject = async (project: UiUxProject) => {
    try {
      await restoreGalleryItem(project.id!);

      toast({
        title: 'Succes',
        description: 'Proiectul a fost restaurat.'
      });

      await reloadProjects();
      await reloadTrash();
    } catch (error) {
      console.error('Error restoring project:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut restaura proiectul.',
        variant: 'destructive'
      });
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (project: UiUxProject) => {
    try {
      await deleteGalleryItem(project.id!);

      toast({
        title: 'Succes',
        description: 'Proiectul a fost șters permanent.'
      });

      await reloadTrash();
    } catch (error) {
      console.error('Error permanently deleting project:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge proiectul.',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'mobile-app',
      platform: 'web',
      status: 'concept',
      tools: '',
      screens: '',
      interactive: false,
      prototypeUrl: '',
      isPrivate: false
    });
    setImageFile(null);
    setImageFiles([]);
    setImagePreview('');
    setImagePreviews([]);
  };

  // Open edit dialog
  const openEditDialog = (project: UiUxProject) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      type: project.subcategory || 'mobile-app',
      platform: (project as any).device || 'web',
      status: (project as any).medium || 'concept',
      tools: (project as any).materials?.join(', ') || '',
      screens: (project as any).dimensions || '',
      interactive: !!(project as any).location,
      prototypeUrl: (project as any).location || '',
      isPrivate: project.isPrivate || false
    });
    setImageFile(null);
    setImageFiles([]);
    setImagePreview(project.image);
    setImagePreviews([]);
    setShowEditDialog(true);
  };

  // Handle single image file selection (backward compatibility)
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

  // Handle multiple image files selection
  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setImageFiles(fileArray);
      
      // Generate previews for all files
      const previews: string[] = [];
      let loadedCount = 0;
      
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          loadedCount++;
          
          if (loadedCount === fileArray.length) {
            setImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'final': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'prototype': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'concept': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios':
      case 'android': return <Smartphone className="h-4 w-4" />;
      case 'web': return <Monitor className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'cross-platform': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  // Get current project index
  const getCurrentProjectIndex = () => {
    if (!selectedProject) return -1;
    return visibleProjects.findIndex(p => p.id === selectedProject.id);
  };

  const canNavigatePrev = getCurrentProjectIndex() > 0;
  const canNavigateNext = getCurrentProjectIndex() < visibleProjects.length - 1;

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Figma className="h-7 w-7 sm:h-8 sm:w-8 text-art-accent" />
              <h1 className="text-2xl font-bold gradient-text leading-tight">
                Design UI/UX
              </h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Interfețe moderne și experiențe utilizator intuitive
            </p>
          </div>
        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Proiecte UI/UX</h2>
            <span className="text-sm text-muted-foreground">
              Total: {loading ? '...' : projectCount}
            </span>
          </div>

          {/* Toolbar */}
          <div className="space-y-3 md:space-y-0">
            {/* Search bar - full width on mobile */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Caută proiecte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Controls row */}
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3">
              {/* Search bar for desktop */}
              <div className="relative hidden md:block flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Caută proiecte UI/UX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filters and View Toggle Row (mobile: same row, desktop: with search) */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filters */}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tipurile</SelectItem>
                    <SelectItem value="mobile-app">Mobile App</SelectItem>
                    <SelectItem value="web-app">Web App</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="landing-page">Landing Page</SelectItem>
                    <SelectItem value="prototype">Prototype</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-[120px] sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="cross-platform">Cross-platform</SelectItem>
                  </SelectContent>
                </Select>

                {/* View mode toggle - only icons */}
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-2"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Trash button (admin only, desktop) */}
              {isAdmin && !isMobile && trashedProjects.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowTrashDialog(true)}
                  className="relative"
                >
                  <Trash className="w-4 h-4" />
                  <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                    {trashedProjects.length}
                  </span>
                </Button>
              )}
              
              {/* Add button (admin only, desktop) */}
              {isAdmin && !isMobile && (
                <Button onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }} className="ml-auto">
                  <Figma className="w-4 h-4 mr-2" />
                  Adaugă Design
                </Button>
              )}
            </div>
          </div>

          {/* Spacing */}
          <div className="h-6 md:h-8" />

          {/* Content */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : visibleProjects.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterPlatform !== 'all'
                  ? 'Nu s-au găsit proiecte.'
                  : 'Nu există încă proiecte.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleProjects.map((project, index) => (
                <Card 
                  key={project.id}
                  className="group overflow-hidden hover-scale animate-scale-in border-art-accent/20 hover:border-art-accent/50 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentImageIndex(0);
                  }}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[16/10] sm:aspect-[4/3] bg-muted overflow-hidden relative">
                      <img 
                        src={project.image} 
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {project.isPrivate && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white p-1.5 rounded z-10">
                          <EyeOff className="w-3 h-3" />
                        </div>
                      )}
                      {(project as any).location && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                            <Eye className="h-3 w-3 mr-1" />
                            Interactiv
                          </Badge>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="absolute bottom-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/50 hover:bg-blue-500/90 text-white transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(project);
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
                              setSelectedProject(project);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {(project as any).materials && (project as any).materials.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-2">
                          {(project as any).materials.slice(0, 3).map((tool: string) => (
                            <span 
                              key={tool}
                              className="px-2 py-1 bg-art-accent/20 text-art-accent rounded-md text-xs"
                            >
                              {tool}
                            </span>
                          ))}
                          {(project as any).materials.length > 3 && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                              +{(project as any).materials.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30" variant="outline">
                          <span className="flex items-center gap-1 text-xs">
                            {getPlatformIcon((project as any).device || 'web')}
                            <span className="hidden sm:inline">
                              {((project as any).device || 'web').charAt(0).toUpperCase() + ((project as any).device || 'web').slice(1)}
                            </span>
                          </span>
                        </Badge>
                        <Badge className={getStatusColor((project as any).medium || 'concept')} variant="outline">
                          <span className="text-xs">
                            {(project as any).medium === 'implemented' ? 'Implementat' : 
                             (project as any).medium === 'final' ? 'Final' :
                             (project as any).medium === 'prototype' ? 'Prototip' : 'Concept'}
                          </span>
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs sm:text-sm">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Ecrane</p>
                          <p className="font-semibold">{(project as any).dimensions || 'N/A'}</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-xs text-muted-foreground">Tip</p>
                          <p className="font-semibold capitalize text-xs sm:text-sm truncate">
                            {(project.subcategory || 'mobile-app').replace('-', ' ')}
                          </p>
                        </div>
                        {(project as any).location && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-art-accent/20 hover:border-art-accent h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open((project as any).location, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Vezi</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3 md:space-y-4">
              {visibleProjects.map((project, index) => (
                <Card
                  key={project.id}
                  className="group overflow-hidden hover-scale animate-scale-in border-art-accent/20 hover:border-art-accent/50 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentImageIndex(0);
                  }}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Compact thumbnail for mobile, larger for desktop */}
                      <div className="w-24 sm:w-48 md:w-56 lg:w-64 flex-shrink-0 relative">
                        <div className="aspect-[3/4] sm:aspect-square bg-muted overflow-hidden relative rounded-l-lg sm:rounded-lg">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {project.isPrivate && (
                            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-black/70 text-white p-1 sm:p-1.5 rounded z-10">
                              <EyeOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                          )}
                          {(project as any).location && (
                            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[10px] sm:text-xs px-1 py-0 sm:px-2 sm:py-0.5">
                                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Interactiv</span>
                              </Badge>
                            </div>
                          )}

                          {isAdmin && (
                            <div className="sm:hidden absolute bottom-1.5 right-1.5 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-black/50 hover:bg-blue-500/90 text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(project);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-black/50 hover:bg-red-500/90 text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject(project);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact info for mobile, detailed for desktop */}
                      <div className="flex-1 py-2 pr-2 sm:p-4 sm:py-3 flex flex-col justify-between min-w-0">
                        <div className="space-y-1 sm:space-y-3">
                          <div>
                            <h3 className="font-semibold text-sm sm:text-lg mb-0.5 sm:mb-1 line-clamp-1">
                              {project.title}
                            </h3>
                            <p className="text-muted-foreground text-[11px] sm:text-sm line-clamp-1 sm:line-clamp-3">
                              {project.description}
                            </p>
                          </div>

                          <div className="flex gap-1 sm:gap-2 flex-wrap">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 h-5 sm:h-auto" variant="outline">
                              <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
                                {getPlatformIcon((project as any).device || 'web')}
                                <span className="hidden sm:inline">{((project as any).device || 'web').charAt(0).toUpperCase() + ((project as any).device || 'web').slice(1)}</span>
                              </span>
                            </Badge>
                            <Badge className={`${getStatusColor((project as any).medium || 'concept')} h-5 sm:h-auto`} variant="outline">
                              <span className="text-[10px] sm:text-xs">
                                {(project as any).medium === 'implemented' ? 'Impl.' : 
                                 (project as any).medium === 'final' ? 'Final' :
                                 (project as any).medium === 'prototype' ? 'Proto' : 'Concept'}
                              </span>
                            </Badge>
                            <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-auto hidden sm:flex">
                              <span className="capitalize">
                                {(project.subcategory || 'mobile-app').replace('-', ' ')}
                              </span>
                            </Badge>
                          </div>

                          {(project as any).materials && (project as any).materials.length > 0 && (
                            <div className="hidden md:flex flex-wrap gap-1.5">
                              {(project as any).materials.slice(0, 4).map((tool: string) => (
                                <span
                                  key={tool}
                                  className="px-2 py-0.5 bg-art-accent/20 text-art-accent rounded text-xs"
                                >
                                  {tool}
                                </span>
                              ))}
                              {(project as any).materials.length > 4 && (
                                <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                  +{(project as any).materials.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3.5 h-3.5" />
                              <span>{(project as any).dimensions || 'N/A'} ecrane</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {(project as any).location && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-art-accent/20 hover:border-art-accent h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open((project as any).location, '_blank');
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Vezi
                              </Button>
                            )}

                            {isAdmin && !isMobile && (
                              <div className="hidden sm:flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(project);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(project);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (Mobile Admin) */}
      {isAdmin && isMobile && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
          {trashedProjects.length > 0 && (
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full shadow-lg bg-background relative"
              onClick={() => setShowTrashDialog(true)}
            >
              <Trash className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                {trashedProjects.length}
              </span>
            </Button>
          )}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
          >
            <Figma className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Fullscreen Project Dialog with Navigation */}
      {selectedProject && !showEditDialog && !showDeleteDialog && (
        <Dialog open={!!selectedProject} onOpenChange={() => {
          setSelectedProject(null);
          setCurrentImageIndex(0);
        }}>
          <DialogContent className="max-w-7xl w-full max-h-[95vh] p-0">
            <DialogTitle className="sr-only">{selectedProject.title}</DialogTitle>
            <DialogDescription className="sr-only">Vizualizare detalii proiect UI/UX</DialogDescription>
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Image Section with Navigation */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted/50 relative">
                {/* Navigation Arrows for Projects */}
                {canNavigatePrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={navigateToPrevProject}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                {canNavigateNext && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={navigateToNextProject}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}

                {/* Main Image Display */}
                <div className="flex-1 flex items-center justify-center">
                  {(() => {
                    // Extract images from date field (format: "url1|url2|url3")
                    const projectImages = selectedProject.date?.includes('|') 
                      ? selectedProject.date.split('|')
                      : [selectedProject.image];
                    const currentImage = projectImages[currentImageIndex] || selectedProject.image;
                    
                    return (
                      <img
                        src={currentImage}
                        alt={`${selectedProject.title} - Image ${currentImageIndex + 1}`}
                        className="max-w-full max-h-[50vh] lg:max-h-[75vh] object-contain rounded-lg shadow-2xl"
                      />
                    );
                  })()}
                </div>

                {/* Image Navigator (Dots) */}
                {(() => {
                  const projectImages = selectedProject.date?.includes('|') 
                    ? selectedProject.date.split('|')
                    : [selectedProject.image];
                    
                  if (projectImages.length > 1) {
                    return (
                      <div className="flex gap-2 mt-4 pb-2">
                        {projectImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentImageIndex(index);
                              setIsAutoRotating(false); // Pause auto-rotation on manual click
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              index === currentImageIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              
              {/* Details Panel */}
              <div className="w-full lg:w-96 bg-background p-6 overflow-y-auto border-t lg:border-t-0 lg:border-l">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
                    {selectedProject.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {selectedProject.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <span className="flex items-center gap-1.5">
                        {getPlatformIcon((selectedProject as any).device || 'web')}
                        {((selectedProject as any).device || 'web').charAt(0).toUpperCase() + ((selectedProject as any).device || 'web').slice(1)}
                      </span>
                    </Badge>
                    <Badge className={getStatusColor((selectedProject as any).medium || 'concept')}>
                      {(selectedProject as any).medium === 'implemented' ? 'Implementat' : 
                       (selectedProject as any).medium === 'final' ? 'Final' :
                       (selectedProject as any).medium === 'prototype' ? 'Prototip' : 'Concept'}
                    </Badge>
                    {(selectedProject as any).location && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Eye className="h-3 w-3 mr-1" />
                        Interactiv
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tip Proiect</p>
                      <p className="font-medium text-sm capitalize">
                        {(selectedProject.subcategory || 'mobile-app').replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Platformă</p>
                      <p className="font-medium text-sm capitalize">
                        {(selectedProject as any).device || 'Web'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ecrane</p>
                      <p className="font-medium text-sm">
                        {(selectedProject as any).dimensions || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="font-medium text-sm capitalize">
                        {(selectedProject as any).medium || 'Concept'}
                      </p>
                    </div>
                  </div>

                  {(selectedProject as any).materials && (selectedProject as any).materials.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Instrumente</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProject as any).materials.map((tool: string) => (
                          <span 
                            key={tool}
                            className="px-3 py-1.5 bg-art-accent/20 text-art-accent rounded-md text-sm font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedProject as any).location && (
                    <div>
                      <Button
                        className="w-full"
                        onClick={() => window.open((selectedProject as any).location, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Vezi Prototipul Interactiv
                      </Button>
                    </div>
                  )}

                  {selectedProject.isPrivate && (
                    <div className="flex items-center gap-2 text-muted-foreground pt-4 border-t">
                      <EyeOff className="w-4 h-4" />
                      <span className="text-xs">Privat (vizibil doar pentru admin)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* CRUD Dialogs */}
      {isAdmin && (
        <>
          {/* Add Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adaugă Proiect Nou</DialogTitle>
                <DialogDescription>
                  Completează detaliile proiectului de design UI/UX.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informații</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="add-title">Titlu *</Label>
                    <Input
                      id="add-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ex: Banking Mobile App"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-image">Imagini (selectează una sau mai multe) *</Label>
                    <Input
                      id="add-image"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesChange}
                      className="cursor-pointer"
                    />
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-video rounded border overflow-hidden bg-muted">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}/{imagePreviews.length}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-description">Descriere</Label>
                    <Textarea
                      id="add-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrierea proiectului..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-type">Tip Proiect</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger id="add-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                          <SelectItem value="web-app">Web App</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="landing-page">Landing Page</SelectItem>
                          <SelectItem value="prototype">Prototype</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-platform">Platformă</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      >
                        <SelectTrigger id="add-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ios">iOS</SelectItem>
                          <SelectItem value="android">Android</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="cross-platform">Cross-platform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="add-tools">Instrumente (separate prin virgulă)</Label>
                    <Input
                      id="add-tools"
                      value={formData.tools}
                      onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                      placeholder="ex: Figma, Adobe XD, Principle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-screens">Număr Ecrane</Label>
                      <Input
                        id="add-screens"
                        value={formData.screens}
                        onChange={(e) => setFormData({ ...formData, screens: e.target.value })}
                        placeholder="ex: 25"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="add-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concept">Concept</SelectItem>
                          <SelectItem value="prototype">Prototip</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="implemented">Implementat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add-prototype-url">Link Prototip Interactiv (opțional)</Label>
                    <Input
                      id="add-prototype-url"
                      value={formData.prototypeUrl}
                      onChange={(e) => setFormData({ ...formData, prototypeUrl: e.target.value })}
                      placeholder="https://figma.com/proto/..."
                    />
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
                <Button onClick={handleAddProject} disabled={isUploading}>
                  {isUploading ? 'Se încarcă...' : 'Adaugă'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editează Proiect</DialogTitle>
                <DialogDescription>
                  Modifică detaliile proiectului de design UI/UX.
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
                      placeholder="ex: Banking Mobile App"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-image">Imagine Preview (lasă gol pentru a păstra imaginea curentă)</Label>
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
                    <Label htmlFor="edit-description">Descriere</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrierea proiectului..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-type">Tip Proiect</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger id="edit-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile-app">Mobile App</SelectItem>
                          <SelectItem value="web-app">Web App</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="landing-page">Landing Page</SelectItem>
                          <SelectItem value="prototype">Prototype</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-platform">Platformă</Label>
                      <Select
                        value={formData.platform}
                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      >
                        <SelectTrigger id="edit-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ios">iOS</SelectItem>
                          <SelectItem value="android">Android</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="desktop">Desktop</SelectItem>
                          <SelectItem value="cross-platform">Cross-platform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                  <div className="space-y-2">
                    <Label htmlFor="edit-tools">Instrumente (separate prin virgulă)</Label>
                    <Input
                      id="edit-tools"
                      value={formData.tools}
                      onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                      placeholder="ex: Figma, Adobe XD, Principle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-screens">Număr Ecrane</Label>
                      <Input
                        id="edit-screens"
                        value={formData.screens}
                        onChange={(e) => setFormData({ ...formData, screens: e.target.value })}
                        placeholder="ex: 25"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concept">Concept</SelectItem>
                          <SelectItem value="prototype">Prototip</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                          <SelectItem value="implemented">Implementat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-prototype-url">Link Prototip Interactiv (opțional)</Label>
                    <Input
                      id="edit-prototype-url"
                      value={formData.prototypeUrl}
                      onChange={(e) => setFormData({ ...formData, prototypeUrl: e.target.value })}
                      placeholder="https://figma.com/proto/..."
                    />
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
                <Button onClick={handleEditProject} disabled={isUploading}>
                  {isUploading ? 'Se salvează...' : 'Salvează'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
                <AlertDialogDescription>
                  Ești sigur că vrei să ștergi acest proiect? Îl vei putea recupera din coșul de gunoi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>
                  Șterge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Trash Management Dialog */}
          <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Coș de gunoi ({trashedProjects.length})</DialogTitle>
                <DialogDescription>
                  Restaurează sau șterge permanent proiectele.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {trashedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
                    <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{project.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.subcategory} • {project.device}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreProject(project)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restaurează
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentDelete(project)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Șterge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageLayout>
  );
}
