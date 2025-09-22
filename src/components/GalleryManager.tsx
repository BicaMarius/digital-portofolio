import React, { useState } from 'react';
import { Plus, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useData } from '@/contexts/DataContext';
import { useAdmin } from '@/contexts/AdminContext';
import { GalleryItem } from '@/types';

interface GalleryManagerProps {
  category: string;
  categoryTitle: string;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ category, categoryTitle }) => {
  const { isAdmin } = useAdmin();
  const { getGalleryByCategory, createNewGalleryItem, updateExistingGalleryItem, deleteExistingGalleryItem } = useData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    image: '/placeholder.svg',
    isPrivate: false
  });

  const galleryItems = getGalleryByCategory(category);

  const handleCreateItem = () => {
    if (newItem.title) {
      createNewGalleryItem({
        title: newItem.title,
        image: newItem.image,
        category: category.includes('art') ? 'art' : 'tech',
        subcategory: category,
        isPrivate: newItem.isPrivate
      });
      setNewItem({
        title: '',
        image: '/placeholder.svg',
        isPrivate: false
      });
      setShowAddDialog(false);
    }
  };

  const handleUpdateItem = () => {
    if (editingItem && editingItem.title) {
      updateExistingGalleryItem(editingItem.id, editingItem);
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Sigur vrei să ștergi acest element din galerie?')) {
      deleteExistingGalleryItem(id);
    }
  };

  const togglePrivacy = (item: GalleryItem) => {
    updateExistingGalleryItem(item.id, { isPrivate: !item.isPrivate });
  };

  if (!isAdmin) {
    return (
      <div className="responsive-gallery">
        {galleryItems.map((item) => (
          <Card key={item.id} className="hover-lift overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.isPrivate && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Privat
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Gallery Item Button */}
      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă în Galerie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adaugă Element în Galerie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="gallery-title">Titlu</Label>
                <Input
                  id="gallery-title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Titlul elementului"
                />
              </div>
              <div>
                <Label htmlFor="gallery-image">URL Imagine</Label>
                <Input
                  id="gallery-image"
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                  placeholder="/placeholder.svg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="gallery-private"
                  checked={newItem.isPrivate}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, isPrivate: checked })}
                />
                <Label htmlFor="gallery-private">Element Privat</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Anulează
                </Button>
                <Button onClick={handleCreateItem}>
                  Adaugă
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gallery Grid */}
      <div className="responsive-gallery">
        {galleryItems.map((item) => (
          <Card key={item.id} className="hover-lift overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.isPrivate && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Privat
                  </Badge>
                </div>
              )}
              {/* Admin controls overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => togglePrivacy(item)}
                    title={item.isPrivate ? 'Face Public' : 'Face Privat'}
                  >
                    {item.isPrivate ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{item.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Edit Gallery Item Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editează Element Galerie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-gallery-title">Titlu</Label>
                <Input
                  id="edit-gallery-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-gallery-image">URL Imagine</Label>
                <Input
                  id="edit-gallery-image"
                  value={editingItem.image}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-gallery-private"
                  checked={editingItem.isPrivate}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, isPrivate: checked })}
                />
                <Label htmlFor="edit-gallery-private">Element Privat</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Anulează
                </Button>
                <Button onClick={handleUpdateItem}>
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
