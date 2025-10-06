import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, LogOut, Eye, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  getWritings, 
  createWriting, 
  updateWriting, 
  softDeleteWriting,
  getDeletedWritings,
  restoreWriting,
  permanentDeleteWriting
} from '@/lib/writingBackend';

interface WritingPiece {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sentiment: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const CreativeWriting = () => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAdmin();
  const [writings, setWritings] = useState<WritingPiece[]>([]);
  const [trashedWritings, setTrashedWritings] = useState<WritingPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WritingPiece | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [sentiment, setSentiment] = useState('contemplative');
  const [isPublished, setIsPublished] = useState(false);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/writing-auth');
      return;
    }
    loadData();
  };

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const [writingsData, trashedData] = await Promise.all([
        getWritings(),
        getDeletedWritings()
      ]);
      setWritings(writingsData);
      setTrashedWritings(trashedData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel('writings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'writings'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/writing-auth');
  };

  const openEditor = (writing?: WritingPiece) => {
    if (writing) {
      setEditing(writing);
      setTitle(writing.title);
      setContent(writing.content);
      setTags(writing.tags.join(', '));
      setSentiment(writing.sentiment);
      setIsPublished(writing.isPublished);
    } else {
      setEditing(null);
      setTitle('');
      setContent('');
      setTags('');
      setSentiment('contemplative');
      setIsPublished(false);
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditing(null);
    setTitle('');
    setContent('');
    setTags('');
    setSentiment('contemplative');
    setIsPublished(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titlul și conținutul sunt obligatorii');
      return;
    }

    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      if (editing) {
        await updateWriting(editing.id, {
          title: title.trim(),
          content: content.trim(),
          tags: tagsArray,
          sentiment,
          isPublished
        });
        toast.success('Scriere actualizată cu succes!');
      } else {
        await createWriting({
          title: title.trim(),
          content: content.trim(),
          tags: tagsArray,
          sentiment,
          isPublished
        });
        toast.success('Scriere creată cu succes!');
      }
      
      closeEditor();
      await loadData();
    } catch (error: any) {
      console.error('Error saving writing:', error);
      toast.error('Eroare la salvare: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți această scriere?')) return;
    
    try {
      await softDeleteWriting(id);
      toast.success('Scriere mutată în coșul de gunoi');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting writing:', error);
      toast.error('Eroare la ștergere');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreWriting(id);
      toast.success('Scriere restaurată cu succes!');
      await loadData();
    } catch (error: any) {
      console.error('Error restoring writing:', error);
      toast.error('Eroare la restaurare');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți permanent această scriere? Această acțiune este ireversibilă!')) return;
    
    try {
      await permanentDeleteWriting(id);
      toast.success('Scriere ștearsă permanent');
      await loadData();
    } catch (error: any) {
      console.error('Error permanently deleting writing:', error);
      toast.error('Eroare la ștergere permanentă');
    }
  };

  const filteredWritings = writings.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <PenTool className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Scriere Creativă</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button onClick={() => setShowTrash(!showTrash)} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Coș ({trashedWritings.length})
                </Button>
                <Button onClick={() => openEditor()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Scriere Nouă
                </Button>
              </>
            )}
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Deconectare
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Caută în scrieri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Writings Grid */}
        {!showTrash ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWritings.map((writing) => (
              <Card key={writing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{writing.title}</span>
                    {writing.isPublished && (
                      <Badge variant="default" className="ml-2">Publicat</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {writing.content}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {writing.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEditor(writing)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(writing.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => openEditor(writing)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vizualizare
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Trash view
          <div>
            <h2 className="text-2xl font-bold mb-4">Coș de Gunoi</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Scrierile șterse vor fi păstrate 7 zile înainte de a fi șterse permanent automat.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trashedWritings.map((writing) => (
                <Card key={writing.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{writing.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {writing.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleRestore(writing.id)}>
                        Restaurează
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete(writing.id)}>
                        Șterge Permanent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {trashedWritings.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  Coșul de gunoi este gol
                </p>
              )}
            </div>
          </div>
        )}

        {!showTrash && filteredWritings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'Nu s-au găsit rezultate' : 'Nicio scriere încă'}
            </p>
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={closeEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? (isAdmin ? 'Editează Scrierea' : 'Vizualizează Scrierea') : 'Scriere Nouă'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titlu</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introdu titlul..."
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label htmlFor="content">Conținut</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrie conținutul aici..."
                rows={15}
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tag-uri (separate prin virgulă)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="poezie, romantism, natură"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <Label htmlFor="sentiment">Sentiment</Label>
              <select
                id="sentiment"
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value)}
                className="w-full border rounded-md p-2"
                disabled={!isAdmin}
              >
                <option value="love">Iubire</option>
                <option value="happiness">Fericire</option>
                <option value="separation">Despărțire</option>
                <option value="contemplative">Contemplativ</option>
              </select>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <Label htmlFor="published">Publicat</Label>
              </div>
            )}
            <div className="flex items-center gap-2 pt-4">
              {isAdmin && (
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvează
                </Button>
              )}
              <Button variant="outline" onClick={closeEditor}>
                <X className="h-4 w-4 mr-2" />
                {isAdmin ? 'Anulează' : 'Închide'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreativeWriting;
