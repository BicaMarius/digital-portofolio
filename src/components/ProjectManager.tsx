import React, { useState, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Eye, Lock, Unlock, X, Upload, FileText, 
  Code2, Globe, Github, Calendar, Clock, Folder, Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAdmin } from '@/contexts/AdminContext';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Project } from '@shared/schema';
import { ProjectDetailsDialog } from './ProjectDetailsDialog';
import { ProjectSearchFilter } from './ProjectSearchFilter';

interface ProjectManagerProps {
  category: string;
  categoryTitle: string;
}

const PROJECT_TYPES = [
  { value: 'aplicatie', label: 'Aplicație' },
  { value: 'site-web', label: 'Site Web' },
  { value: 'platforma', label: 'Platformă' },
  { value: 'joc', label: 'Joc' },
  { value: 'biblioteca', label: 'Bibliotecă' },
  { value: 'api', label: 'API' },
  { value: 'extensie', label: 'Extensie' },
  { value: 'altele', label: 'Altele' },
];

// Common tech stacks for quick selection
const COMMON_FRONTEND = ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'SASS'];
const COMMON_BACKEND = ['Node.js', 'Express', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C#', '.NET', 'PHP', 'Laravel'];

export const ProjectManager: React.FC<ProjectManagerProps> = ({ category, categoryTitle }) => {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const { data: allProjects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<string>('all');

  // File upload refs
  const iconInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    image: '',
    category: category.includes('art') ? 'art' : 'tech',
    subcategory: category,
    isPrivate: false,
    tags: [] as string[],
    projectType: '',
    icon: '',
    images: [] as string[],
    hoursWorked: undefined as number | undefined,
    frontendTech: [] as string[],
    backendTech: [] as string[],
    initialReleaseDate: '',
    lastUpdatedDate: '',
    additionalFiles: [] as string[],
    gitUrl: '',
    projectUrl: '',
  });

  const [tempInputs, setTempInputs] = useState({
    tagInput: '',
    frontendInput: '',
    backendInput: '',
  });

  // Filter projects by category and search/filters
  const filteredProjects = allProjects.filter((project) => {
    if (project.subcategory !== category) return false;
    if (!isAdmin && project.isPrivate) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query)) ||
        project.frontendTech?.some(tech => tech.toLowerCase().includes(query)) ||
        project.backendTech?.some(tech => tech.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && project.projectType !== filterType) return false;

    // Privacy filter
    if (filterPrivacy === 'public' && project.isPrivate) return false;
    if (filterPrivacy === 'private' && !project.isPrivate) return false;

    return true;
  });

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.description) {
      toast({
        title: 'Eroare',
        description: 'Titlul și descrierea sunt obligatorii',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProject.mutateAsync(newProject);
      toast({
        title: 'Succes',
        description: 'Proiectul a fost creat cu succes',
      });
      setShowAddDialog(false);
      resetNewProject();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut crea proiectul',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editingProject.title || !editingProject.description) {
      toast({
        title: 'Eroare',
        description: 'Titlul și descrierea sunt obligatorii',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateProject.mutateAsync({ 
        id: editingProject.id, 
        updates: editingProject 
      });
      toast({
        title: 'Succes',
        description: 'Proiectul a fost actualizat cu succes',
      });
      setEditingProject(null);
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza proiectul',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Sigur vrei să ștergi acest proiect? Această acțiune este ireversibilă.')) {
      return;
    }

    try {
      await deleteProject.mutateAsync(id);
      toast({
        title: 'Succes',
        description: 'Proiectul a fost șters cu succes',
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge proiectul',
        variant: 'destructive',
      });
    }
  };

  const togglePrivacy = async (project: Project) => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        updates: { isPrivate: !project.isPrivate },
      });
      toast({
        title: 'Succes',
        description: `Proiectul este acum ${!project.isPrivate ? 'privat' : 'public'}`,
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut schimba vizibilitatea proiectului',
        variant: 'destructive',
      });
    }
  };

  const resetNewProject = () => {
    setNewProject({
      title: '',
      description: '',
      image: '',
      category: category.includes('art') ? 'art' : 'tech',
      subcategory: category,
      isPrivate: false,
      tags: [],
      projectType: '',
      icon: '',
      images: [],
      hoursWorked: undefined,
      frontendTech: [],
      backendTech: [],
      initialReleaseDate: '',
      lastUpdatedDate: '',
      additionalFiles: [],
      gitUrl: '',
      projectUrl: '',
    });
    setTempInputs({
      tagInput: '',
      frontendInput: '',
      backendInput: '',
    });
  };

  const handleAddTag = (tagInput: string, setter: React.Dispatch<React.SetStateAction<typeof newProject>>) => {
    if (tagInput.trim()) {
      setter((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTempInputs((prev) => ({ ...prev, tagInput: '' }));
    }
  };

  const handleAddTech = (tech: string, field: 'frontendTech' | 'backendTech', setter: React.Dispatch<React.SetStateAction<typeof newProject>>) => {
    if (tech.trim()) {
      setter((prev: any) => {
        if (!prev[field].includes(tech.trim())) {
          return {
            ...prev,
            [field]: [...prev[field], tech.trim()],
          };
        }
        return prev;
      });
    }
  };

  const handleRemoveTag = (index: number, setter: React.Dispatch<React.SetStateAction<typeof newProject>>) => {
    setter((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveTech = (index: number, field: 'frontendTech' | 'backendTech', setter: React.Dispatch<React.SetStateAction<typeof newProject>>) => {
    setter((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i: number) => i !== index),
    }));
  };

  // Image upload handlers (placeholder - will be enhanced with Cloudinary)
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement Cloudinary upload
      toast({
        title: 'Info',
        description: 'Upload imagini va fi implementat cu Cloudinary',
      });
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Implement Cloudinary upload for multiple images
      toast({
        title: 'Info',
        description: 'Upload imagini va fi implementat cu Cloudinary',
      });
    }
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // TODO: Implement Cloudinary upload for files
      toast({
        title: 'Info',
        description: 'Upload fișiere va fi implementat cu Cloudinary',
      });
    }
  };

  const renderProjectForm = (
    project: typeof newProject,
    setProject: React.Dispatch<React.SetStateAction<typeof newProject>>,
    onSubmit: () => void,
    onCancel: () => void,
    submitLabel: string
  ) => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Bază</TabsTrigger>
        <TabsTrigger value="tech">Tehnologii</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
        <TabsTrigger value="links">Link-uri</TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[500px] pr-4">
        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Titlu *</Label>
            <Input
              id="title"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
              placeholder="Numele proiectului"
            />
          </div>

          <div>
            <Label htmlFor="description">Descriere *</Label>
            <Textarea
              id="description"
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              placeholder="Descriere detaliată a proiectului"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="projectType">Tip Proiect</Label>
            <Select
              value={project.projectType}
              onValueChange={(value) => setProject({ ...project, projectType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectează tipul" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="initialRelease">Prima Versiune</Label>
              <Input
                id="initialRelease"
                type="date"
                value={project.initialReleaseDate}
                onChange={(e) => setProject({ ...project, initialReleaseDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="lastUpdate">Ultima Actualizare</Label>
              <Input
                id="lastUpdate"
                type="date"
                value={project.lastUpdatedDate}
                onChange={(e) => setProject({ ...project, lastUpdatedDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hoursWorked">Ore Lucrate</Label>
            <Input
              id="hoursWorked"
              type="number"
              value={project.hoursWorked || ''}
              onChange={(e) => setProject({ ...project, hoursWorked: parseInt(e.target.value) || undefined })}
              placeholder="Ex: 120"
            />
          </div>

          <div>
            <Label>Tag-uri</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tempInputs.tagInput}
                onChange={(e) => setTempInputs({ ...tempInputs, tagInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tempInputs.tagInput, setProject);
                  }
                }}
                placeholder="Adaugă tag"
              />
              <Button
                type="button"
                onClick={() => handleAddTag(tempInputs.tagInput, setProject)}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(index, setProject)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={project.isPrivate}
              onCheckedChange={(checked) => setProject({ ...project, isPrivate: checked })}
            />
            <Label htmlFor="private">Proiect Privat</Label>
          </div>
        </TabsContent>

        {/* Technologies Tab */}
        <TabsContent value="tech" className="space-y-4 mt-4">
          <div>
            <Label>Tehnologii Frontend</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tempInputs.frontendInput}
                onChange={(e) => setTempInputs({ ...tempInputs, frontendInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech(tempInputs.frontendInput, 'frontendTech', setProject);
                    setTempInputs({ ...tempInputs, frontendInput: '' });
                  }
                }}
                placeholder="Adaugă tehnologie"
              />
              <Button
                type="button"
                onClick={() => {
                  handleAddTech(tempInputs.frontendInput, 'frontendTech', setProject);
                  setTempInputs({ ...tempInputs, frontendInput: '' });
                }}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">Selectare rapidă:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_FRONTEND.map((tech) => (
                  <Button
                    key={tech}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTech(tech, 'frontendTech', setProject)}
                    disabled={project.frontendTech.includes(tech)}
                  >
                    {tech}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.frontendTech.map((tech, index) => (
                <Badge key={index} variant="default" className="gap-1">
                  {tech}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTech(index, 'frontendTech', setProject)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label>Tehnologii Backend</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tempInputs.backendInput}
                onChange={(e) => setTempInputs({ ...tempInputs, backendInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech(tempInputs.backendInput, 'backendTech', setProject);
                    setTempInputs({ ...tempInputs, backendInput: '' });
                  }
                }}
                placeholder="Adaugă tehnologie"
              />
              <Button
                type="button"
                onClick={() => {
                  handleAddTech(tempInputs.backendInput, 'backendTech', setProject);
                  setTempInputs({ ...tempInputs, backendInput: '' });
                }}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">Selectare rapidă:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_BACKEND.map((tech) => (
                  <Button
                    key={tech}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTech(tech, 'backendTech', setProject)}
                    disabled={project.backendTech.includes(tech)}
                  >
                    {tech}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.backendTech.map((tech, index) => (
                <Badge key={index} variant="default" className="gap-1">
                  {tech}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTech(index, 'backendTech', setProject)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="icon">Icon Proiect</Label>
            <div className="flex gap-2">
              <Input
                id="icon"
                value={project.icon || ''}
                onChange={(e) => setProject({ ...project, icon: e.target.value })}
                placeholder="URL icon sau emoji (ex: 🚀)"
              />
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => iconInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {project.icon && (
              <div className="mt-2 flex items-center gap-2">
                {project.icon.startsWith('http') ? (
                  <img src={project.icon} alt="Icon" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <span className="text-4xl">{project.icon}</span>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="mainImage">Imagine Principală</Label>
            <Input
              id="mainImage"
              value={project.image}
              onChange={(e) => setProject({ ...project, image: e.target.value })}
              placeholder="URL imagine principală"
            />
          </div>

          <div>
            <Label>Galerie Imagini (Preview-uri)</Label>
            <div className="space-y-2">
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => imagesInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Imagini
              </Button>
              {project.images && project.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {project.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => setProject({
                          ...project,
                          images: project.images?.filter((_, i) => i !== index) || []
                        })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Fișiere Adiționale (Documentație, Prezentări)</Label>
            <input
              ref={filesInputRef}
              type="file"
              multiple
              onChange={handleFilesUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => filesInputRef.current?.click()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Fișiere
            </Button>
            {project.additionalFiles && project.additionalFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {project.additionalFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-sm truncate">{file}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setProject({
                        ...project,
                        additionalFiles: project.additionalFiles?.filter((_, i) => i !== index) || []
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="gitUrl">
              <Github className="h-4 w-4 inline mr-2" />
              Repository Git
            </Label>
            <Input
              id="gitUrl"
              value={project.gitUrl || ''}
              onChange={(e) => setProject({ ...project, gitUrl: e.target.value })}
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div>
            <Label htmlFor="projectUrl">
              <Globe className="h-4 w-4 inline mr-2" />
              Link Proiect Live / Demo
            </Label>
            <Input
              id="projectUrl"
              value={project.projectUrl || ''}
              onChange={(e) => setProject({ ...project, projectUrl: e.target.value })}
              placeholder="https://project-demo.com"
            />
          </div>
        </TabsContent>
      </ScrollArea>

      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Anulează
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </Tabs>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <ProjectSearchFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterPrivacy={filterPrivacy}
        setFilterPrivacy={setFilterPrivacy}
        projectTypes={PROJECT_TYPES}
        isAdmin={isAdmin}
        onAddProject={() => setShowAddDialog(true)}
      />

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Code2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {searchQuery || filterType !== 'all' || filterPrivacy !== 'all' 
              ? 'Nu există proiecte care să corespundă filtrelor'
              : 'Nu există proiecte încă'}
          </p>
          {isAdmin && (
            <Button onClick={() => setShowAddDialog(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă Primul Proiect
            </Button>
          )}
        </div>
      ) : (
        <div className="responsive-card-grid">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover-lift cursor-pointer transition-all"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {project.icon && (
                      <div className="flex-shrink-0">
                        {project.icon.startsWith('http') ? (
                          <img src={project.icon} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <span className="text-2xl">{project.icon}</span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.title}</CardTitle>
                      {project.projectType && (
                        <Badge variant="outline" className="mt-1">
                          {PROJECT_TYPES.find(t => t.value === project.projectType)?.label || project.projectType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {project.isPrivate ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {project.image && (
                  <div className="mb-3 rounded-md overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
                <CardDescription className="line-clamp-2 mb-3">
                  {project.description}
                </CardDescription>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.frontendTech?.slice(0, 3).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.backendTech?.slice(0, 2).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {(project.frontendTech?.length || 0) + (project.backendTech?.length || 0) > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(project.frontendTech?.length || 0) + (project.backendTech?.length || 0) - 5}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {project.initialReleaseDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.initialReleaseDate).toLocaleDateString('ro-RO')}
                    </div>
                  )}
                  {project.hoursWorked && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {project.hoursWorked}h
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex justify-end space-x-2 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePrivacy(project);
                      }}
                    >
                      {project.isPrivate ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Adaugă Proiect Nou - {categoryTitle}</DialogTitle>
          </DialogHeader>
          {renderProjectForm(
            newProject,
            setNewProject,
            handleCreateProject,
            () => {
              setShowAddDialog(false);
              resetNewProject();
            },
            'Adaugă Proiect'
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Editează Proiect</DialogTitle>
            </DialogHeader>
            {renderProjectForm(
              editingProject as typeof newProject,
              setEditingProject as React.Dispatch<React.SetStateAction<typeof newProject>>,
              handleUpdateProject,
              () => setEditingProject(null),
              'Salvează Modificările'
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Project Details Dialog */}
      {selectedProject && (
        <ProjectDetailsDialog
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};
