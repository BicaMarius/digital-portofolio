import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useData } from '@/contexts/DataContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Project } from '@/types';

interface ProjectManagerProps {
  category: string;
  categoryTitle: string;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ category, categoryTitle }) => {
  const { isAdmin } = useAdmin();
  const { getProjectsByCategory, createNewProject, updateExistingProject, deleteExistingProject } = useData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    image: '/placeholder.svg',
    isPrivate: false,
    tags: [] as string[]
  });

  const projects = getProjectsByCategory(category);

  const handleCreateProject = () => {
    if (newProject.title && newProject.description) {
      createNewProject({
        title: newProject.title,
        description: newProject.description,
        image: newProject.image,
        category: category.includes('art') ? 'art' : 'tech',
        subcategory: category,
        isPrivate: newProject.isPrivate,
        tags: newProject.tags
      });
      setNewProject({
        title: '',
        description: '',
        image: '/placeholder.svg',
        isPrivate: false,
        tags: []
      });
      setShowAddDialog(false);
    }
  };

  const handleUpdateProject = () => {
    if (editingProject && editingProject.title && editingProject.description) {
      updateExistingProject(editingProject.id, editingProject);
      setEditingProject(null);
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Sigur vrei să ștergi acest proiect?')) {
      deleteExistingProject(id);
    }
  };

  const togglePrivacy = (project: Project) => {
    updateExistingProject(project.id, { isPrivate: !project.isPrivate });
  };

  if (!isAdmin) {
    return (
      <div className="responsive-card-grid">
        {projects.map((project) => (
          <Card key={project.id} className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                {project.isPrivate && (
                  <Badge variant="outline" className="text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1" />
                    Privat
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Project Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă Proiect
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adaugă Proiect Nou</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titlu</Label>
                <Input
                  id="title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Titlul proiectului"
                />
              </div>
              <div>
                <Label htmlFor="description">Descriere</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Descrierea proiectului"
                />
              </div>
              <div>
                <Label htmlFor="image">URL Imagine</Label>
                <Input
                  id="image"
                  value={newProject.image}
                  onChange={(e) => setNewProject({ ...newProject, image: e.target.value })}
                  placeholder="/placeholder.svg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={newProject.isPrivate}
                  onCheckedChange={(checked) => setNewProject({ ...newProject, isPrivate: checked })}
                />
                <Label htmlFor="private">Proiect Privat</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Anulează
                </Button>
                <Button onClick={handleCreateProject}>
                  Adaugă
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      <div className="responsive-card-grid">
        {projects.map((project) => (
          <Card key={project.id} className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {project.isPrivate && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Lock className="h-3 w-3 mr-1" />
                      Privat
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePrivacy(project)}
                    title={project.isPrivate ? 'Face Public' : 'Face Privat'}
                  >
                    {project.isPrivate ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProject(project)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editează Proiect</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titlu</Label>
                <Input
                  id="edit-title"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descriere</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-image">URL Imagine</Label>
                <Input
                  id="edit-image"
                  value={editingProject.image}
                  onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-private"
                  checked={editingProject.isPrivate}
                  onCheckedChange={(checked) => setEditingProject({ ...editingProject, isPrivate: checked })}
                />
                <Label htmlFor="edit-private">Proiect Privat</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingProject(null)}>
                  Anulează
                </Button>
                <Button onClick={handleUpdateProject}>
                  Salvează
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
