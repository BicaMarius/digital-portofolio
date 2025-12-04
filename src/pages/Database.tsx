import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database as DatabaseIcon, Plus, Search, Filter, BarChart3, Users, Server, Code, MoreVertical, Trash2, Trash, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useProjects, useCreateProject, useUpdateProject, useSoftDeleteProject, useRestoreProject, usePermanentDeleteProject } from '@/hooks/useProjects';
import type { Project } from '@shared/schema';

function parseTagValue(tags: string[] | undefined, key: string, fallback: string = ''): string {
  const entry = (tags || []).find(t => t.toLowerCase().startsWith(`${key}:`));
  if (!entry) return fallback;
  const parts = entry.split(':');
  return parts.slice(1).join(':').trim();
}

const Database: React.FC = () => {
  const { isAdmin } = useAdmin();
  const { getCount, isLoading } = usePortfolioStats();
  const { data: allProjects = [] } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'design',
    status: 'completed',
    complexity: 'medium',
    technologies: '',
    tableCount: '',
    recordCount: '',
    performanceGain: '',
    isPrivate: false,
  });

  // Filter by subcategory "database" and admin visibility, exclude deleted
  const projects = useMemo(() => {
    const base = allProjects.filter(p => p.subcategory === 'database' && !p.deletedAt);
    return isAdmin ? base : base.filter(p => !p.isPrivate);
  }, [allProjects, isAdmin]);

  const projectCount = getCount('database-projects');

  // Load trashed projects for admin
  useEffect(() => {
    if (!isAdmin) return;
    const trashed = allProjects.filter(p => p.subcategory === 'database' && p.deletedAt);
    setTrashedProjects(trashed);
  }, [allProjects, isAdmin]);

  const visibleProjects = useMemo(() => {
    return projects.filter(project => {
      const type = project.projectType || '';
      const status = parseTagValue(project.tags, 'status', '');
      const complexity = parseTagValue(project.tags, 'complexity', '');
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
      } else if (e.key === 'ArrowLeft') {
        const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
        if (idx > 0) setSelectedProject(visibleProjects[idx - 1]);
      } else if (e.key === 'ArrowRight') {
        const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
        if (idx < visibleProjects.length - 1) setSelectedProject(visibleProjects[idx + 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedProject, visibleProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-blue-500/20 text-blue-400';
      case 'medium': return 'bg-orange-500/20 text-orange-400';
      case 'complex': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'design': return <DatabaseIcon className="h-4 w-4" />;
      case 'optimization': return <BarChart3 className="h-4 w-4" />;
      case 'migration': return <Server className="h-4 w-4" />;
      case 'analysis': return <Users className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getProjectTechnologies = (p: Project) => parseTagValue(p.tags, 'technologies', '');
  const getProjectStatus = (p: Project) => parseTagValue(p.tags, 'status', '');
  const getProjectComplexity = (p: Project) => parseTagValue(p.tags, 'complexity', '');
  const getProjectTableCount = (p: Project) => parseTagValue(p.tags, 'tables', '');
  const getProjectRecordCount = (p: Project) => parseTagValue(p.tags, 'records', '');
  const getProjectPerformanceGain = (p: Project) => parseTagValue(p.tags, 'gain', '');

  const openAddDialog = () => {
    setFormData({
      title: '', description: '', type: 'design', status: 'completed', complexity: 'medium',
      technologies: '', tableCount: '', recordCount: '', performanceGain: '', isPrivate: false,
    });
    setShowAddDialog(true);
  };

  const openEditDialog = (p: Project) => {
    setSelectedProject(p);
    setFormData({
      title: p.title || '',
      description: p.description || '',
      type: p.projectType || 'design',
      status: getProjectStatus(p) || 'completed',
      complexity: getProjectComplexity(p) || 'medium',
      technologies: getProjectTechnologies(p) || '',
      tableCount: getProjectTableCount(p) || '',
      recordCount: getProjectRecordCount(p) || '',
      performanceGain: getProjectPerformanceGain(p) || '',
      isPrivate: !!p.isPrivate,
    });
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    const tags = [
      `status:${formData.status}`,
      `complexity:${formData.complexity}`,
      formData.technologies ? `technologies:${formData.technologies}` : undefined,
      formData.tableCount ? `tables:${formData.tableCount}` : undefined,
      formData.recordCount ? `records:${formData.recordCount}` : undefined,
      formData.performanceGain ? `gain:${formData.performanceGain}` : undefined,
    ].filter(Boolean) as string[];
    await createProject.mutateAsync({
      title: formData.title,
      description: formData.description,
      image: '',
      category: 'tech',
      subcategory: 'database',
      isPrivate: formData.isPrivate,
      tags,
      projectType: formData.type,
      icon: undefined,
      images: [],
    });
    setShowAddDialog(false);
  };

  const handleUpdate = async () => {
    if (!selectedProject) return;
    const tags = [
      `status:${formData.status}`,
      `complexity:${formData.complexity}`,
      formData.technologies ? `technologies:${formData.technologies}` : undefined,
      formData.tableCount ? `tables:${formData.tableCount}` : undefined,
      formData.recordCount ? `records:${formData.recordCount}` : undefined,
      formData.performanceGain ? `gain:${formData.performanceGain}` : undefined,
    ].filter(Boolean) as string[];
    await updateProject.mutateAsync({ id: selectedProject.id, updates: {
      title: formData.title,
      description: formData.description,
      isPrivate: formData.isPrivate,
      projectType: formData.type,
      tags,
    }});
    setShowEditDialog(false);
    setSelectedProject(null);
  };

  const handleSoftDelete = async (p: Project) => {
    await softDeleteProject.mutateAsync(p.id);
  };
  const handleRestore = async (p: Project) => {
    await restoreProject.mutateAsync(p.id);
  };
  const handlePermanentDelete = async (p: Project) => {
    await permanentDeleteProject.mutateAsync(p.id);
  };

  return (
    <PageLayout>
      <section className="page-hero-section">
        <div className="page-container">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <DatabaseIcon className="h-8 w-8 text-tech-accent" />
              <h1 className="text-2xl font-bold gradient-text">
                Proiecte Baze de Date
              </h1>
            </div>
            <p className="hidden sm:block text-base text-muted-foreground max-w-2xl mx-auto">
              Design, optimizare și management sisteme de baze de date complexe
            </p>
          </div>

        </div>
      </section>

      <section className="page-content-section flex-1">
        <div className="page-container">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Proiecte Database</h2>
            <span className="text-sm text-muted-foreground">
              Total: {isLoading ? '…' : projectCount}
            </span>
          </div>

          {/* Controls Toolbar */}
          <div className="mb-8 relative">
            {/* Desktop: single row */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută proiecte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tip proiect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="optimization">Optimizare</SelectItem>
                  <SelectItem value="migration">Migrare</SelectItem>
                  <SelectItem value="analysis">Analiză</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="completed">Finalizat</SelectItem>
                  <SelectItem value="in-progress">În progres</SelectItem>
                  <SelectItem value="archived">Arhivat</SelectItem>
                </SelectContent>
              </Select>

              {isAdmin && (
                <>
                  {trashedProjects.length > 0 && (
                    <Button variant="outline" onClick={() => setShowTrashDialog(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Coș
                      <Badge className="ml-2" variant="secondary">{trashedProjects.length}</Badge>
                    </Button>
                  )}
                  <Button onClick={openAddDialog} className="bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg">
                    <DatabaseIcon className="h-4 w-4 mr-2" />
                    Adaugă Proiect
                  </Button>
                </>
              )}
            </div>

            {/* Mobile: two rows */}
            <div className="md:hidden space-y-4">
              {/* First row: search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută proiecte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Second row: filters */}
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="flex-1">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="optimization">Optimizare</SelectItem>
                    <SelectItem value="migration">Migrare</SelectItem>
                    <SelectItem value="analysis">Analiză</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toate</SelectItem>
                    <SelectItem value="completed">Finalizat</SelectItem>
                    <SelectItem value="in-progress">În progres</SelectItem>
                    <SelectItem value="archived">Arhivat</SelectItem>
                  </SelectContent>
                </Select>

                {isAdmin && trashedProjects.length > 0 && (
                  <Button variant="outline" size="icon" onClick={() => setShowTrashDialog(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile FAB */}
            {isAdmin && (
              <Button
                onClick={openAddDialog}
                className="md:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg z-50"
                size="icon"
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project, index) => (
              <Card 
                key={project.id}
                className="hover-scale cursor-pointer group border-tech-accent/20 hover:border-tech-accent/50 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedProject(project)}
              >
                {/* Desktop: vertical layout */}
                <div className="hidden sm:block">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(project.projectType || 'design')}
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.isPrivate && !isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}>Editează</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSoftDelete(project); }} className="text-red-500">Mută în coș</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">
                      {project.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2">
                      {(getProjectTechnologies(project) || '')
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span 
                            key={tech}
                            className="px-2 py-1 bg-tech-accent/20 text-tech-accent rounded-md text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                    </div>

                    {/* Status & Complexity */}
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(getProjectStatus(project))} variant="outline">
                        {getProjectStatus(project) === 'completed' ? 'Finalizat' : 
                         getProjectStatus(project) === 'in-progress' ? 'În progres' : 
                         getProjectStatus(project) === 'archived' ? 'Arhivat' : 'Status' }
                      </Badge>
                      <Badge className={getComplexityColor(getProjectComplexity(project))} variant="outline">
                        {getProjectComplexity(project) === 'simple' ? 'Simplu' :
                         getProjectComplexity(project) === 'medium' ? 'Mediu' : 
                         getProjectComplexity(project) === 'complex' ? 'Complex' : 'Complexitate'}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      {getProjectTableCount(project) && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Tabele</p>
                          <p className="font-semibold text-sm">{getProjectTableCount(project)}</p>
                        </div>
                      )}
                      {getProjectRecordCount(project) && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Înregistrări</p>
                          <p className="font-semibold text-sm">{getProjectRecordCount(project)}</p>
                        </div>
                      )}
                      {getProjectPerformanceGain(project) && (
                        <div className="text-center col-span-2">
                          <p className="text-xs text-muted-foreground">Îmbunătățire</p>
                          <p className="font-semibold text-sm text-green-400">{getProjectPerformanceGain(project)}</p>
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
                        {getTypeIcon(project.projectType || 'design')}
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
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(project); }}>Editează</DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSoftDelete(project); }} className="text-red-500">Mută în coș</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-1">{project.description}</p>
                        <div className="flex gap-1 flex-wrap">
                          <Badge className={`${getStatusColor(getProjectStatus(project))} h-5`} variant="outline">
                            <span className="text-[10px]">
                              {getProjectStatus(project) === 'completed' ? 'Done' : 
                               getProjectStatus(project) === 'in-progress' ? 'WIP' : 'Arch'}
                            </span>
                          </Badge>
                          <Badge className={`${getComplexityColor(getProjectComplexity(project))} h-5`} variant="outline">
                            <span className="text-[10px]">
                              {getProjectComplexity(project) === 'simple' ? 'S' :
                               getProjectComplexity(project) === 'medium' ? 'M' : 'C'}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getProjectTableCount(project) && (
                            <span className="text-muted-foreground">{getProjectTableCount(project)} tables</span>
                          )}
                          {getProjectPerformanceGain(project) && (
                            <span className="text-green-400 font-medium">{getProjectPerformanceGain(project)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {visibleProjects.length === 0 && (
            <div className="text-center py-12">
              <DatabaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite proiecte</p>
            </div>
          )}
        </div>
      </section>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adaugă proiect Database</DialogTitle>
            <DialogDescription>Completează detalii pentru proiectul de baze de date</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalii</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Titlu</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <Label>Descriere</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tip</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Tip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="optimization">Optimizare</SelectItem>
                      <SelectItem value="migration">Migrare</SelectItem>
                      <SelectItem value="analysis">Analiză</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Finalizat</SelectItem>
                      <SelectItem value="in-progress">În progres</SelectItem>
                      <SelectItem value="archived">Arhivat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="metadata" className="space-y-4">
              <div>
                <Label>Tehnologii (separate prin virgulă)</Label>
                <Input value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })} placeholder="PostgreSQL, Redis, MongoDB" />
              </div>
              <div>
                <Label>Complexitate</Label>
                <Select value={formData.complexity} onValueChange={(v) => setFormData({ ...formData, complexity: v })}>
                  <SelectTrigger><SelectValue placeholder="Complexitate" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simplu</SelectItem>
                    <SelectItem value="medium">Mediu</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tabele</Label>
                  <Input value={formData.tableCount} onChange={e => setFormData({ ...formData, tableCount: e.target.value })} placeholder="45" />
                </div>
                <div>
                  <Label>Înregistrări</Label>
                  <Input value={formData.recordCount} onChange={e => setFormData({ ...formData, recordCount: e.target.value })} placeholder="2.5M+" />
                </div>
              </div>
              <div>
                <Label>Îmbunătățire performanță</Label>
                <Input value={formData.performanceGain} onChange={e => setFormData({ ...formData, performanceGain: e.target.value })} placeholder="40% faster queries" />
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Proiect privat</Label>
                  <p className="text-sm text-muted-foreground">Doar adminul poate vizualiza acest proiect</p>
                </div>
                <Switch checked={formData.isPrivate} onCheckedChange={(v) => setFormData({ ...formData, isPrivate: v })} />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anulează</Button>
            <Button onClick={handleCreate}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează proiect Database</DialogTitle>
            <DialogDescription>Actualizează detaliile proiectului</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalii</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Titlu</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <Label>Descriere</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tip</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Tip" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="optimization">Optimizare</SelectItem>
                      <SelectItem value="migration">Migrare</SelectItem>
                      <SelectItem value="analysis">Analiză</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Finalizat</SelectItem>
                      <SelectItem value="in-progress">În progres</SelectItem>
                      <SelectItem value="archived">Arhivat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="metadata" className="space-y-4">
              <div>
                <Label>Tehnologii (separate prin virgulă)</Label>
                <Input value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })} placeholder="PostgreSQL, Redis, MongoDB" />
              </div>
              <div>
                <Label>Complexitate</Label>
                <Select value={formData.complexity} onValueChange={(v) => setFormData({ ...formData, complexity: v })}>
                  <SelectTrigger><SelectValue placeholder="Complexitate" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simplu</SelectItem>
                    <SelectItem value="medium">Mediu</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tabele</Label>
                  <Input value={formData.tableCount} onChange={e => setFormData({ ...formData, tableCount: e.target.value })} placeholder="45" />
                </div>
                <div>
                  <Label>Înregistrări</Label>
                  <Input value={formData.recordCount} onChange={e => setFormData({ ...formData, recordCount: e.target.value })} placeholder="2.5M+" />
                </div>
              </div>
              <div>
                <Label>Îmbunătățire performanță</Label>
                <Input value={formData.performanceGain} onChange={e => setFormData({ ...formData, performanceGain: e.target.value })} placeholder="40% faster queries" />
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Proiect privat</Label>
                  <p className="text-sm text-muted-foreground">Doar adminul poate vizualiza acest proiect</p>
                </div>
                <Switch checked={formData.isPrivate} onCheckedChange={(v) => setFormData({ ...formData, isPrivate: v })} />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Anulează</Button>
            <Button onClick={handleUpdate}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trash Dialog */}
      <Dialog open={showTrashDialog} onOpenChange={setShowTrashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proiecte în coș</DialogTitle>
            <DialogDescription>Restaurează sau șterge permanent proiectele</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {trashedProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">Coșul este gol.</p>
            )}
            {trashedProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(p.projectType || 'design')}
                  <span className="font-medium">{p.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRestore(p)}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Restore
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete(p)}>
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen View */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogTitle className="sr-only">{selectedProject.title}</DialogTitle>
            <DialogDescription className="sr-only">Vizualizare detalii proiect database</DialogDescription>
            
            {/* Navigation arrows */}
            {(() => {
              const idx = visibleProjects.findIndex(p => p.id === selectedProject.id);
              const canPrev = idx > 0;
              const canNext = idx < visibleProjects.length - 1;
              return (
                <>
                  {canPrev && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setSelectedProject(visibleProjects[idx - 1])}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  {canNext && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setSelectedProject(visibleProjects[idx + 1])}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}
                </>
              );
            })()}

            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {getTypeIcon(selectedProject.projectType || 'design')}
                  <h2 className="text-2xl sm:text-3xl font-bold">{selectedProject.title}</h2>
                </div>
                {selectedProject.description && (
                  <p className="text-muted-foreground text-base">{selectedProject.description}</p>
                )}
              </div>

              {/* Badges row */}
              <div className="flex gap-2 flex-wrap mb-6">
                <Badge className={getStatusColor(getProjectStatus(selectedProject))} variant="outline">
                  {getProjectStatus(selectedProject) === 'completed' ? 'Finalizat' : 
                   getProjectStatus(selectedProject) === 'in-progress' ? 'În progres' : 
                   getProjectStatus(selectedProject) === 'archived' ? 'Arhivat' : 'Status' }
                </Badge>
                <Badge className={getComplexityColor(getProjectComplexity(selectedProject))} variant="outline">
                  {getProjectComplexity(selectedProject) === 'simple' ? 'Simplu' :
                   getProjectComplexity(selectedProject) === 'medium' ? 'Mediu' : 
                   getProjectComplexity(selectedProject) === 'complex' ? 'Complex' : 'Complexitate'}
                </Badge>
                <Badge variant="outline">
                  {selectedProject.projectType === 'design' ? 'Design' :
                   selectedProject.projectType === 'optimization' ? 'Optimizare' :
                   selectedProject.projectType === 'migration' ? 'Migrare' :
                   selectedProject.projectType === 'analysis' ? 'Analiză' : 'Database'}
                </Badge>
                {selectedProject.isPrivate && (
                  <Badge variant="secondary">Privat</Badge>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="stack">Tech Stack</TabsTrigger>
                </TabsList>

                {/* Metrics */}
                <TabsContent value="metrics" className="space-y-4">
                  {(getProjectTableCount(selectedProject) || getProjectRecordCount(selectedProject) || getProjectPerformanceGain(selectedProject)) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {getProjectTableCount(selectedProject) && (
                        <div className="rounded-lg border bg-card p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-2">Tabele</p>
                          <p className="text-3xl font-bold">{getProjectTableCount(selectedProject)}</p>
                        </div>
                      )}
                      {getProjectRecordCount(selectedProject) && (
                        <div className="rounded-lg border bg-card p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-2">Înregistrări</p>
                          <p className="text-3xl font-bold">{getProjectRecordCount(selectedProject)}</p>
                        </div>
                      )}
                      {getProjectPerformanceGain(selectedProject) && (
                        <div className="rounded-lg border bg-card p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-2">Îmbunătățire</p>
                          <p className="text-3xl font-bold text-green-400">{getProjectPerformanceGain(selectedProject)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nu sunt disponibile metrici pentru acest proiect.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Tech Stack */}
                <TabsContent value="stack" className="space-y-4">
                  {getProjectTechnologies(selectedProject) ? (
                    <div className="flex flex-wrap gap-3">
                      {getProjectTechnologies(selectedProject)
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span key={tech} className="px-4 py-2 bg-tech-accent/20 text-tech-accent rounded-lg text-base font-medium">
                            {tech}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nu sunt specificate tehnologii pentru acest proiect.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageLayout>
  );
};

export default Database;