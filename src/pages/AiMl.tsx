import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Plus, Search, Filter, Brain, Code, BarChart3, Zap, MoreVertical, ChevronLeft, ChevronRight, Trash2, Trash, RotateCcw } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { usePortfolioStats } from '@/hooks/usePortfolioStats';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useSoftDeleteProject, useRestoreProject, usePermanentDeleteProject } from '@/hooks/useProjects';
import type { Project } from '@shared/schema';

function getTypeIcon(type: string) {
  switch (type) {
    case 'ml-model': return <Brain className="h-4 w-4" />;
    case 'ai-application': return <Bot className="h-4 w-4" />;
    case 'data-analysis': return <BarChart3 className="h-4 w-4" />;
    case 'automation': return <Zap className="h-4 w-4" />;
    default: return <Code className="h-4 w-4" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'ml-model': return 'ML Model';
    case 'ai-application': return 'AI App';
    case 'data-analysis': return 'Data Analysis';
    case 'automation': return 'Automation';
    default: return type;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-400';
    case 'in-progress': return 'bg-yellow-500/20 text-yellow-400';
    case 'experimental': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-muted text-muted-foreground';
  }
}

function parseTagValue(tags: string[] | undefined, key: string, fallback: string = ''): string {
  const entry = (tags || []).find(t => t.toLowerCase().startsWith(`${key}:`));
  if (!entry) return fallback;
  const parts = entry.split(':');
  return parts.slice(1).join(':').trim();
}

export default function AiMl() {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const toast = useToast();
  const { getCount, isLoading } = usePortfolioStats();
  const { data: allProjects = [], isLoading: loadingProjects } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const softDeleteProject = useSoftDeleteProject();
  const restoreProject = useRestoreProject();
  const permanentDeleteProject = usePermanentDeleteProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<Project | null>(null);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [trashedProjects, setTrashedProjects] = useState<Project[]>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ml-model',
    status: 'completed',
    technologies: '',
    framework: '',
    accuracy: '',
    dataset: '',
    isPrivate: false,
  });

  // Visible projects filtered by subcategory and admin visibility
  const projects = useMemo(() => {
    const base = allProjects.filter(p => p.subcategory === 'ai-ml' && !p.deletedAt);
    return isAdmin ? base : base.filter(p => !p.isPrivate);
  }, [allProjects, isAdmin]);

  const projectCount = getCount('ai-ml-projects');

  // Load trashed projects
  useEffect(() => {
    const loadTrashed = async () => {
      if (!isAdmin) return;
      try {
        const trashed = allProjects.filter(p => p.subcategory === 'ai-ml' && p.deletedAt);
        setTrashedProjects(trashed);
      } catch (error) {
        console.error('Error loading trashed projects:', error);
      }
    };
    loadTrashed();
  }, [allProjects, isAdmin]);

  const visibleProjects = useMemo(() => {
    return projects.filter(project => {
      const status = parseTagValue(project.tags, 'status', '');
      const type = project.projectType || '';
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || type === filterType;
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [projects, searchTerm, filterType, filterStatus]);

  // Keyboard navigation in fullscreen
  useEffect(() => {
    if (!selectedProject) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setCurrentImageIndex(0);
      } else if (e.key === 'ArrowLeft') {
        const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
        if (idx > 0) {
          setSelectedProject(visibleProjects[idx - 1]);
          setCurrentImageIndex(0);
          setIsAutoRotating(true);
        }
      } else if (e.key === 'ArrowRight') {
        const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
        if (idx < visibleProjects.length - 1) {
          setSelectedProject(visibleProjects[idx + 1]);
          setCurrentImageIndex(0);
          setIsAutoRotating(true);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedProject, visibleProjects]);

  // Auto-rotate images in fullscreen
  useEffect(() => {
    if (!selectedProject || !isAutoRotating) return;
    const imgs = selectedProject.images && selectedProject.images.length > 0 ? selectedProject.images : [selectedProject.image];
    if (imgs.length <= 1) return;
    const t = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % imgs.length);
    }, 4000);
    return () => clearInterval(t);
  }, [selectedProject, isAutoRotating]);

  const getProjectFramework = (p: Project) => parseTagValue(p.tags, 'framework', '');
  const getProjectAccuracy = (p: Project) => parseTagValue(p.tags, 'accuracy', '');
  const getProjectDataset = (p: Project) => parseTagValue(p.tags, 'dataset', '');
  const getProjectStatus = (p: Project) => parseTagValue(p.tags, 'status', '');

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setImageFiles(arr);
    const previews: string[] = [];
    let done = 0;
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        done++;
        if (done === arr.length) setImagePreviews(previews);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setIconPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const { url } = await res.json();
    return url as string;
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'ml-model',
      status: 'completed',
      technologies: '',
      framework: '',
      accuracy: '',
      dataset: '',
      isPrivate: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setIconFile(null);
    setIconPreview('');
  };

  const openEdit = (p: Project) => {
    setSelectedProject(p);
    setFormData({
      title: p.title,
      description: p.description || '',
      type: p.projectType || 'ml-model',
      status: getProjectStatus(p) || 'completed',
      technologies: (p.frontendTech || []).join(', '),
      framework: getProjectFramework(p) || '',
      accuracy: getProjectAccuracy(p) || '',
      dataset: getProjectDataset(p) || '',
      isPrivate: !!p.isPrivate,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setIconFile(null);
    setIconPreview(p.icon || '');
    setShowEditDialog(true);
  };

  const handleAddProject = async () => {
    if (!formData.title) {
      toast.toast({ title: 'Eroare', description: 'Titlul este obligatoriu.', variant: 'destructive' });
      return;
    }
    try {
      setIsUploading(true);
      const uploadedImages: string[] = [];
      for (const f of imageFiles) {
        uploadedImages.push(await uploadFile(f, 'ai-ml'));
      }
      const mainImage = uploadedImages.length > 0 ? uploadedImages[0] : '';
      let iconUrl = '';
      if (iconFile) iconUrl = await uploadFile(iconFile, 'ai-ml');

      const tags: string[] = [];
      if (formData.status) tags.push(`status:${formData.status}`);
      if (formData.framework) tags.push(`framework:${formData.framework}`);
      if (formData.accuracy) tags.push(`accuracy:${formData.accuracy}`);
      if (formData.dataset) tags.push(`dataset:${formData.dataset}`);

      await createProject.mutateAsync({
        title: formData.title,
        description: formData.description,
        image: mainImage,
        category: 'tech',
        subcategory: 'ai-ml',
        isPrivate: formData.isPrivate,
        tags,
        projectType: formData.type,
        icon: iconUrl || undefined,
        images: uploadedImages,
        frontendTech: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
      } as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);

      toast.toast({ title: 'Succes', description: 'Proiectul AI/ML a fost adăugat.' });
      setShowAddDialog(false);
      resetForm();
    } catch (e) {
      toast.toast({ title: 'Eroare', description: (e as Error).message || 'Nu s-a putut adăuga proiectul.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;
    try {
      setIsUploading(true);
      let images = selectedProject.images || [];
      let mainImage = selectedProject.image;
      if (imageFiles.length > 0) {
        const uploadedImages: string[] = [];
        for (const f of imageFiles) uploadedImages.push(await uploadFile(f, 'ai-ml'));
        images = uploadedImages;
        mainImage = uploadedImages[0];
      }
      let iconUrl = selectedProject.icon || '';
      if (iconFile) iconUrl = await uploadFile(iconFile, 'ai-ml');

      const tags: string[] = [];
      if (formData.status) tags.push(`status:${formData.status}`);
      if (formData.framework) tags.push(`framework:${formData.framework}`);
      if (formData.accuracy) tags.push(`accuracy:${formData.accuracy}`);
      if (formData.dataset) tags.push(`dataset:${formData.dataset}`);

      await updateProject.mutateAsync({
        id: selectedProject.id,
        updates: {
          title: formData.title,
          description: formData.description,
          image: mainImage,
          isPrivate: formData.isPrivate,
          tags,
          projectType: formData.type,
          icon: iconUrl || undefined,
          images,
          frontendTech: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
        },
      });

      toast.toast({ title: 'Succes', description: 'Proiectul a fost actualizat.' });
      setShowEditDialog(false);
      setSelectedProject(null);
      resetForm();
    } catch (e) {
      toast.toast({ title: 'Eroare', description: (e as Error).message || 'Nu s-a putut actualiza proiectul.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!showDeleteDialog) return;
    try {
      await softDeleteProject.mutateAsync(showDeleteDialog.id);
      toast.toast({ title: 'Șters', description: 'Proiectul a fost mutat în coș.' });
      setShowDeleteDialog(null);
    } catch (e) {
      toast.toast({ title: 'Eroare', description: (e as Error).message || 'Nu s-a putut șterge proiectul.', variant: 'destructive' });
    }
  };

  const handleRestoreProject = async (project: Project) => {
    try {
      await restoreProject.mutateAsync(project.id);
      toast.toast({ title: 'Restaurat', description: 'Proiectul a fost restaurat.' });
    } catch (e) {
      toast.toast({ title: 'Eroare', description: (e as Error).message || 'Nu s-a putut restaura proiectul.', variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (project: Project) => {
    try {
      await permanentDeleteProject.mutateAsync(project.id);
      toast.toast({ title: 'Șters permanent', description: 'Proiectul a fost șters permanent.' });
    } catch (e) {
      toast.toast({ title: 'Eroare', description: (e as Error).message || 'Nu s-a putut șterge permanent proiectul.', variant: 'destructive' });
    }
  };

  const canNavigatePrev = selectedProject ? visibleProjects.findIndex(p => p.id === selectedProject.id) > 0 : false;
  const canNavigateNext = selectedProject ? visibleProjects.findIndex(p => p.id === selectedProject.id) < visibleProjects.length - 1 : false;

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="h-8 w-8 text-tech-accent" />
              <h1 className="text-2xl font-bold gradient-text">AI & Machine Learning</h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Modele de inteligență artificială și soluții de machine learning
            </p>
          </div>
        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Proiecte AI/ML</h2>
            <span className="text-sm text-muted-foreground">Total: {isLoading ? '…' : projectCount}</span>
          </div>

          {/* Toolbar: compact two rows on mobile */}
          <div className="space-y-2 md:space-y-0 relative">
            {/* Trash and Add buttons in corner (admin, desktop) */}
            {isAdmin && !isMobile && (
              <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
                {trashedProjects.length > 0 && (
                  <Button variant="outline" onClick={() => setShowTrashDialog(true)} className="relative">
                    <Trash className="w-4 h-4" />
                    <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {trashedProjects.length}
                    </span>
                  </Button>
                )}
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  <Brain className="h-4 w-4 mr-2" />
                  Adaugă Proiect AI/ML
                </Button>
              </div>
            )}

            {/* Row 1: Search bar */}
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută proiecte AI/ML..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 w-full" />
            </div>

            {/* Row 2: Filters + View toggle */}
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
              <div className="relative hidden md:block flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Caută proiecte AI/ML..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 w-full" />
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 w-[150px] sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2 hidden sm:inline" />
                    <SelectValue placeholder="Tip proiect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate tipurile</SelectItem>
                    <SelectItem value="ml-model">ML Model</SelectItem>
                    <SelectItem value="ai-application">AI Application</SelectItem>
                    <SelectItem value="data-analysis">Data Analysis</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 w-[130px] sm:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="completed">Finalizat</SelectItem>
                    <SelectItem value="in-progress">În progres</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-6 md:h-8" />

          {/* Content */}
          {loadingProjects ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : visibleProjects.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite proiecte AI/ML</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleProjects.map((project, index) => (
                <Card key={project.id} className="hover-scale cursor-pointer group border-tech-accent/20 hover:border-tech-accent/50 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }} onClick={() => { setSelectedProject(project); setCurrentImageIndex(0); }}>
                  {/* Desktop: vertical layout */}
                  <div className="hidden sm:block">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getTypeIcon(project.projectType || '')}
                          <CardTitle className="text-base sm:text-lg line-clamp-1">{project.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.isPrivate && !isAdmin && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>Editează</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(project); }}>Șterge</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(project.frontendTech || []).map((tech) => (
                          <span key={tech} className="px-2 py-1 bg-tech-accent/20 text-tech-accent rounded-md text-xs">{tech}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400" variant="outline">{getTypeLabel(project.projectType || '')}</Badge>
                        {getProjectStatus(project) && (
                          <Badge className={getStatusColor(getProjectStatus(project))} variant="outline">
                            {getProjectStatus(project) === 'completed' ? 'Finalizat' : getProjectStatus(project) === 'in-progress' ? 'În progres' : 'Experimental'}
                          </Badge>
                        )}
                      </div>
                      {getProjectFramework(project) && (
                        <div className="text-center pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">Framework</p>
                          <p className="font-semibold text-sm">{getProjectFramework(project)}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {getProjectAccuracy(project) && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Acuratețe</p>
                            <p className="font-semibold text-sm text-green-400">{getProjectAccuracy(project)}</p>
                          </div>
                        )}
                        {getProjectDataset(project) && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Dataset</p>
                            <p className="font-semibold text-sm">{getProjectDataset(project)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Mobile: compact horizontal layout */}
                  <div className="sm:hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="flex items-start justify-center pt-1">
                          {getTypeIcon(project.projectType || '')}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-1">{project.title}</h3>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>Editează</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(project); }}>Șterge</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs line-clamp-1">{project.description}</p>
                          <div className="flex gap-1 flex-wrap">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 h-5" variant="outline">
                              <span className="text-[10px]">{getTypeLabel(project.projectType || '')}</span>
                            </Badge>
                            {getProjectStatus(project) && (
                              <Badge className={`${getStatusColor(getProjectStatus(project))} h-5`} variant="outline">
                                <span className="text-[10px]">
                                  {getProjectStatus(project) === 'completed' ? 'Done' : getProjectStatus(project) === 'in-progress' ? 'WIP' : 'Exp'}
                                </span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {getProjectAccuracy(project) && (
                              <span className="text-green-400 font-medium">{getProjectAccuracy(project)}</span>
                            )}
                            {getProjectFramework(project) && (
                              <span className="text-muted-foreground truncate">{getProjectFramework(project)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile FAB for Add (Admin) */}
      {isAdmin && isMobile && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Fullscreen Dialog - bespoke AI/ML presentation */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => { setSelectedProject(null); setCurrentImageIndex(0); }}>
          <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0">
            <DialogTitle className="sr-only">{selectedProject.title}</DialogTitle>
            <DialogDescription className="sr-only">Vizualizare proiect AI/ML</DialogDescription>
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
              {/* Media + Navigator */}
              <div className="lg:col-span-7 bg-muted/40 relative p-4 sm:p-6 flex flex-col">
                {/* Project navigation arrows */}
                {canNavigatePrev && (
                  <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => {
                    const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
                    if (idx > 0) { setSelectedProject(visibleProjects[idx - 1]); setCurrentImageIndex(0); setIsAutoRotating(true); }
                  }}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                {canNavigateNext && (
                  <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white" onClick={() => {
                    const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
                    if (idx < visibleProjects.length - 1) { setSelectedProject(visibleProjects[idx + 1]); setCurrentImageIndex(0); setIsAutoRotating(true); }
                  }}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}

                {/* Image area */}
                <div className="flex-1 flex items-center justify-center">
                  {(() => {
                    const imgs = selectedProject.images && selectedProject.images.length > 0 ? selectedProject.images : [selectedProject.image];
                    const currentImage = imgs[currentImageIndex] || selectedProject.image;
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={currentImage} alt={`${selectedProject.title} - ${currentImageIndex + 1}`} className="max-w-full max-h-[50vh] lg:max-h-[70vh] object-contain rounded-lg shadow-2xl" />
                      </div>
                    );
                  })()}
                </div>

                {/* Dots navigator */}
                {(() => {
                  const imgs = selectedProject.images && selectedProject.images.length > 0 ? selectedProject.images : [selectedProject.image];
                  if (imgs.length > 1) {
                    return (
                      <div className="flex gap-2 mt-4 pb-2 justify-center">
                        {imgs.map((_, index) => (
                          <button key={index} onClick={() => { setCurrentImageIndex(index); setIsAutoRotating(false); }} className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'}`} aria-label={`Go to image ${index + 1}`} />
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Details panel with tabs and metrics */}
              <div className="lg:col-span-5 bg-background border-t lg:border-t-0 lg:border-l p-4 sm:p-6 overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{selectedProject.title}</h2>
                    {selectedProject.description && (
                      <p className="text-muted-foreground text-sm sm:text-base">{selectedProject.description}</p>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="stack">Tech Stack</TabsTrigger>
                  </TabsList>

                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{getTypeLabel(selectedProject.projectType || '')}</Badge>
                      {getProjectStatus(selectedProject) && (
                        <Badge className={getStatusColor(getProjectStatus(selectedProject))}>
                          {getProjectStatus(selectedProject) === 'completed' ? 'Finalizat' : getProjectStatus(selectedProject) === 'in-progress' ? 'În progres' : 'Experimental'}
                        </Badge>
                      )}
                    </div>
                    {(selectedProject.images || []).length > 1 && (
                      <div className="text-xs text-muted-foreground">{(selectedProject.images || []).length} imagini în project</div>
                    )}
                  </TabsContent>

                  {/* Metrics */}
                  <TabsContent value="metrics" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Accuracy circular indicator */}
                      <div className="flex items-center justify-center">
                        {(() => {
                          const accText = getProjectAccuracy(selectedProject);
                          const pct = accText && accText.endsWith('%') ? Number(accText.replace('%', '')) : accText ? Number(accText) : 0;
                          const clamped = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));
                          const deg = (clamped / 100) * 360;
                          return (
                            <div className="relative w-40 h-40 rounded-full bg-muted" style={{ backgroundImage: `conic-gradient(#22c55e ${deg}deg, rgba(255,255,255,0.2) ${deg}deg)` }}>
                              <div className="absolute inset-3 rounded-full bg-background flex flex-col items-center justify-center">
                                <span className="text-xs text-muted-foreground">Acuratețe</span>
                                <span className="text-2xl font-bold">{clamped}%</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Dataset and framework cards */}
                      <div className="space-y-4">
                        {getProjectFramework(selectedProject) && (
                          <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Framework</p>
                            <p className="font-semibold">{getProjectFramework(selectedProject)}</p>
                          </div>
                        )}
                        {getProjectDataset(selectedProject) && (
                          <div className="rounded-lg border p-4">
                            <p className="text-xs text-muted-foreground">Dataset</p>
                            <p className="font-semibold">{getProjectDataset(selectedProject)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tech Stack */}
                  <TabsContent value="stack" className="space-y-4">
                    {(selectedProject.frontendTech || []).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(selectedProject.frontendTech || []).map((tool: string) => (
                          <span key={tool} className="px-3 py-1.5 bg-tech-accent/20 text-tech-accent rounded-md text-sm font-medium">{tool}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Nu sunt specificate tehnologii.</p>
                    )}
                  </TabsContent>
                </Tabs>

                {selectedProject.isPrivate && (
                  <div className="flex items-center gap-2 text-muted-foreground pt-4 border-t">
                    <span className="text-xs">Privat (vizibil doar pentru admin)</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog */}
      {isAdmin && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adaugă Proiect AI/ML</DialogTitle>
              <DialogDescription>Completează detaliile proiectului AI/ML.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informații</TabsTrigger>
                <TabsTrigger value="details">Detalii</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4 min-h-[400px]">
                <div className="space-y-2">
                  <Label htmlFor="add-title">Titlu *</Label>
                  <Input id="add-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ex: Image Classification System" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-images">Imagini (opțional)</Label>
                  <Input id="add-images" type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} className="cursor-pointer" />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-video rounded border overflow-hidden bg-muted">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">{idx + 1}/{imagePreviews.length}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-description">Descriere</Label>
                  <Textarea id="add-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrierea proiectului..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-type">Tip Proiect</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger id="add-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml-model">ML Model</SelectItem>
                        <SelectItem value="ai-application">AI Application</SelectItem>
                        <SelectItem value="data-analysis">Data Analysis</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger id="add-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Finalizat</SelectItem>
                        <SelectItem value="in-progress">În progres</SelectItem>
                        <SelectItem value="experimental">Experimental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                <div className="space-y-2">
                  <Label htmlFor="add-tech">Tehnologii (separate prin virgulă)</Label>
                  <Input id="add-tech" value={formData.technologies} onChange={(e) => setFormData({ ...formData, technologies: e.target.value })} placeholder="ex: Python, TensorFlow, OpenCV" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-framework">Framework</Label>
                    <Input id="add-framework" value={formData.framework} onChange={(e) => setFormData({ ...formData, framework: e.target.value })} placeholder="ex: TensorFlow" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-accuracy">Acuratețe</Label>
                    <Input id="add-accuracy" value={formData.accuracy} onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })} placeholder="ex: 94.2%" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-dataset">Dataset</Label>
                  <Input id="add-dataset" value={formData.dataset} onChange={(e) => setFormData({ ...formData, dataset: e.target.value })} placeholder="ex: 50,000 images" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-icon">Iconiță (opțional)</Label>
                  <Input id="add-icon" type="file" accept="image/*" onChange={handleIconChange} className="cursor-pointer" />
                  {iconPreview && (
                    <div className="relative w-full aspect-video rounded border overflow-hidden bg-muted">
                      <img src={iconPreview} alt="Preview icon" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="add-private" checked={formData.isPrivate} onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })} />
                  <Label htmlFor="add-private">Privat (vizibil doar pentru admin)</Label>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isUploading}>Anulează</Button>
              <Button onClick={handleAddProject} disabled={isUploading}>{isUploading ? 'Se încarcă...' : 'Adaugă'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {isAdmin && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editează Proiect</DialogTitle>
              <DialogDescription>Modifică detaliile proiectului AI/ML.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informații</TabsTrigger>
                <TabsTrigger value="details">Detalii</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4 min-h-[400px]">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Titlu *</Label>
                  <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-images">Înlocuiește imaginile (opțional)</Label>
                  <Input id="edit-images" type="file" accept="image/*" multiple onChange={handleMultipleImagesChange} className="cursor-pointer" />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative aspect-video rounded border overflow-hidden bg-muted">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">{idx + 1}/{imagePreviews.length}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descriere</Label>
                  <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Tip Proiect</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger id="edit-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml-model">ML Model</SelectItem>
                        <SelectItem value="ai-application">AI Application</SelectItem>
                        <SelectItem value="data-analysis">Data Analysis</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Finalizat</SelectItem>
                        <SelectItem value="in-progress">În progres</SelectItem>
                        <SelectItem value="experimental">Experimental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
                <div className="space-y-2">
                  <Label htmlFor="edit-tech">Tehnologii (separate prin virgulă)</Label>
                  <Input id="edit-tech" value={formData.technologies} onChange={(e) => setFormData({ ...formData, technologies: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-framework">Framework</Label>
                    <Input id="edit-framework" value={formData.framework} onChange={(e) => setFormData({ ...formData, framework: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-accuracy">Acuratețe</Label>
                    <Input id="edit-accuracy" value={formData.accuracy} onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataset">Dataset</Label>
                  <Input id="edit-dataset" value={formData.dataset} onChange={(e) => setFormData({ ...formData, dataset: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-icon">Iconiță (opțional)</Label>
                  <Input id="edit-icon" type="file" accept="image/*" onChange={handleIconChange} className="cursor-pointer" />
                  {iconPreview && (
                    <div className="relative w-full aspect-video rounded border overflow-hidden bg-muted">
                      <img src={iconPreview} alt="Preview icon" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUploading}>Anulează</Button>
              <Button onClick={handleEditProject} disabled={isUploading}>{isUploading ? 'Se salvează...' : 'Salvează'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmare ștergere</DialogTitle>
              <DialogDescription>Ești sigur că vrei să ștergi acest proiect? Va fi mutat în coșul de gunoi.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Anulează</Button>
              <Button variant="destructive" onClick={handleDeleteCurrent}>Șterge</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                  {project.icon ? (
                    <img src={project.icon} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    getTypeIcon(project.projectType || '')
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{project.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {getTypeLabel(project.projectType || '')} • {parseTagValue(project.tags, 'status', 'N/A')}
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
    </PageLayout>
  );
}