import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, Filter, Book, FileText, Heart, Calendar, Eye } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { toast } from '@/components/ui/use-toast';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { AlbumNameDialog } from '@/components/AlbumNameDialog';
import { AlbumCard } from '@/components/AlbumCard';
import { DragDropIndicator } from '@/components/DragDropIndicator';

interface WritingPiece {
  id: number;
  title: string;
  // allow dynamic types/moods managed by admin
  type: string;
  content: string;
  excerpt: string;
  wordCount: number;
  dateWritten: string;
  tags: string[];
  mood: string;
  isPrivate?: boolean;
  published?: boolean;
}

interface Album {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  itemIds: number[];
}

const mockWritings: WritingPiece[] = [
  {
    id: 1,
    title: 'Noapte de Vară',
    type: 'poetry',
    content: `Cerul își deapănă mantia înstelată,
Iar luna, ca o lampă de argint,
Luminează drumul spre inimă încântată,
Unde poezia își află cuvântul.

Șoapte de vânt prin frunzele tremurânde,
Parfumul nopții îmi umple ființa,
Gândurile se fac cântec în minte,
Iar sufletul dansează în tăcere.

O, noapte frumoasă de vară!
Tu îmi ești refugiul și inspirația,
În tine găsesc pacea cea rară,
Și nasc din întuneric lumina.`,
    excerpt: 'Cerul își deapănă mantia înstelată, Iar luna, ca o lampă de argint...',
    wordCount: 89,
    dateWritten: '2024-06-15',
    tags: ['natură', 'noapte', 'inspirație', 'vară'],
    mood: 'contemplative'
  },
  {
    id: 2,
    title: 'Fragmentul Pierdut',
    type: 'short-story',
    content: `Era o zi obișnuită de toamnă când am găsit cartea. Stătea acolo, pe raftul din colțul bibliotecii, ca și cum mă aștepta. Coperta era veche, uzată de timp, dar titlul era încă lizibil: "Amintiri Netrăite".

Am deschis-o cu grijă și am rămas uluit. Paginile conțineau povestea vieții mele, dar nu așa cum o trăisem eu. Era o versiune paralelă, în care fiecare decizie importantă fusese luată diferit...`,
    excerpt: 'Era o zi obișnuită de toamnă când am găsit cartea...',
    wordCount: 1250,
    dateWritten: '2024-03-20',
    tags: ['fantezie', 'mister', 'introspecție'],
    mood: 'contemplative',
    isPrivate: true
  },
  {
    id: 3,
    title: 'Culori de Toamnă',
    type: 'poetry',
    content: `Frunzele pictate în galben și roșu,
Cad încet pe aleile părăsite,
Fiecare pas stârnește un foșnet,
De amintiri în timp rătăcite.

Aerul rece îmi mângâie obrajii,
Iar gândurile se fac melancolice,
Toamna îmi șoptește vechile povești,
De dragoste și doruri nostalgice.`,
    excerpt: 'Frunzele pictate în galben și roșu, Cad încet pe aleile părăsite...',
    wordCount: 64,
    dateWritten: '2024-10-05',
    tags: ['toamnă', 'melancolie', 'natura', 'nostalgie'],
    mood: 'melancholic',
    published: true
  }
];

const CreativeWriting: React.FC = () => {
  const { isAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [selectedWriting, setSelectedWriting] = useState<WritingPiece | null>(null);

  // make writings editable in local state (mock persists in-memory only)
  const [writings, setWritings] = useState<WritingPiece[]>(mockWritings);

  // admin-managed type and mood lists
  const [types, setTypes] = useState<Array<{ key: string; label: string }>>([
    { key: 'poetry', label: 'Poezie' },
    { key: 'short-story', label: 'Povestire' },
    { key: 'essay', label: 'Eseu' },
    { key: 'article', label: 'Articol' },
    { key: 'song-lyrics', label: 'Versuri' }
  ]);
  const [moods, setMoods] = useState<Array<{ key: string; label: string }>>([
    { key: 'melancholic', label: 'Melancolic' },
    { key: 'joyful', label: 'Vesel' },
    { key: 'contemplative', label: 'Contemplativ' },
    { key: 'passionate', label: 'Pasional' },
    { key: 'nostalgic', label: 'Nostalgic' }
  ]);

  // editor dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WritingPiece | null>(null);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [isManageMoodsOpen, setIsManageMoodsOpen] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newMoodKey, setNewMoodKey] = useState('');
  const [newMoodLabel, setNewMoodLabel] = useState('');

  // helper: normalize string removing diacritics and lowercase
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // search across title and content, diacritics-insensitive
  const visibleWritings = (isAdmin ? writings : writings.filter(w => !w.isPrivate)).filter(writing => {
    const term = normalize(searchTerm.trim());
    if (!term) return (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
    const hay = normalize(writing.title + ' ' + writing.content + ' ' + writing.tags.join(' '));
    return hay.includes(term) && (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
  });

  // word count helper: counts words in plain text (improved)
  const countWords = (htmlOrText: string) => {
    if (!htmlOrText) return 0;
    // Remove HTML tags and get plain text
    const text = htmlOrText.replace(/<[^>]*>/g, '').trim();
    if (!text) return 0;
    // Split by whitespace and filter out empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const openEditorFor = (w: WritingPiece | null) => {
    setEditing(w ? { ...w } : null);
    setIsEditorOpen(true);
    // set contenteditable content when dialog opens (handled in effect below)
  };

  // save from editor
  const saveEditing = () => {
    if (!editing) return;
    const contentHtml = editorRef.current?.innerHTML || editing.content;
    const plainTextWordCount = countWords(contentHtml);
    const updated: WritingPiece = { ...editing, content: contentHtml, wordCount: plainTextWordCount };
    setWritings(ws => {
      if (ws.some(w => w.id === updated.id)) {
        return ws.map(w => w.id === updated.id ? updated : w);
      }
      // new item: assign new id
      const nextId = Math.max(0, ...ws.map(w => w.id)) + 1;
      updated.id = nextId;
      return [updated, ...ws];
    });
    setIsEditorOpen(false);
    toast({ title: 'Salvat', description: 'Textul a fost salvat în bibliotecă.' });
  };

  // manage types/moods add/remove
  const addType = () => {
    if (!newTypeKey || !newTypeLabel) return;
    setTypes(t => [...t, { key: newTypeKey, label: newTypeLabel }]);
    setNewTypeKey(''); setNewTypeLabel('');
  };
  const removeType = (key: string) => setTypes(t => t.filter(i => i.key !== key));
  const addMood = () => {
    if (!newMoodKey || !newMoodLabel) return;
    setMoods(m => [...m, { key: newMoodKey, label: newMoodLabel }]);
    setNewMoodKey(''); setNewMoodLabel('');
  };
  const removeMood = (key: string) => setMoods(m => m.filter(i => i.key !== key));

  // when editor opens, populate contentEditable
  useEffect(() => {
    if (isEditorOpen) {
      requestAnimationFrame(() => {
        if (editorRef.current) {
          // load draft if exists
          const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
          const draft = localStorage.getItem(draftKey);
          editorRef.current.innerHTML = draft ?? editing?.content ?? '';
        }
      });
    }
  }, [isEditorOpen, editing]);

  // albums state (declared before persistence effects)
  const [albums, setAlbums] = useState<Album[]>([]);

  // persistence: load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cw_writings');
    if (saved) setWritings(JSON.parse(saved));
    const st = localStorage.getItem('cw_types');
    if (st) setTypes(JSON.parse(st));
    const sm = localStorage.getItem('cw_moods');
    if (sm) setMoods(JSON.parse(sm));
    const sa = localStorage.getItem('cw_albums');
    if (sa) setAlbums(JSON.parse(sa));
  }, []);

  // save on changes
  useEffect(() => { localStorage.setItem('cw_writings', JSON.stringify(writings)); }, [writings]);
  useEffect(() => { localStorage.setItem('cw_types', JSON.stringify(types)); }, [types]);
  useEffect(() => { localStorage.setItem('cw_moods', JSON.stringify(moods)); }, [moods]);
  useEffect(() => { localStorage.setItem('cw_albums', JSON.stringify(albums)); }, [albums]);

  // (albums state moved up)

  // drag/drop state
  const dragItemId = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverType, setDragOverType] = useState<'merge' | 'move-left' | 'move-right' | null>(null);
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);

  // dialog states for themed popups
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'success' | 'info';
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [albumNameDialog, setAlbumNameDialog] = useState<{
    open: boolean;
    sourceId: number | null;
    targetId: number | null;
  }>({
    open: false,
    sourceId: null,
    targetId: null
  });

  // helper to start editor with autosave drafts
  const startNewEditing = () => openEditorFor({
    id: 0,
    title: '',
    type: (types[0] && types[0].key) || 'poetry',
    content: '',
    excerpt: '',
    wordCount: 0,
    dateWritten: new Date().toISOString().slice(0,10),
    tags: [],
    mood: (moods[0] && moods[0].key) || 'contemplative',
    published: false
  });

  // autosave draft every 2s when editor open
  useEffect(() => {
    if (!isEditorOpen) return;
    const id = setInterval(() => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
      localStorage.setItem(draftKey, html);
    }, 2000);
    return () => clearInterval(id);
  }, [isEditorOpen, editing]);

  // save on unload
  useEffect(() => {
    const handler = () => {
      if (isEditorOpen && editorRef.current) {
        const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
        localStorage.setItem(draftKey, editorRef.current.innerHTML);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditorOpen, editing]);

  // editor undo/redo via execCommand
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  // drag-and-drop handlers (improved)
  const onDragStart = (e: React.DragEvent, id: number) => {
    dragItemId.current = id;
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedId = dragItemId.current;
    if (!draggedId || draggedId === targetId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Determine drop zone based on mouse position
    if (x < width * 0.2) {
      setDragOverType('move-left');
      setDragOverId(targetId);
    } else if (x > width * 0.8) {
      setDragOverType('move-right'); 
      setDragOverId(targetId);
    } else {
      setDragOverType('merge');
      setDragOverId(targetId);
    }
  };

  const onDropOnCard = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = dragItemId.current;
    dragItemId.current = null;
    setDragOverId(null);
    setDragOverType(null);

    if (!sourceId || sourceId === targetId) return;

    if (dragOverType === 'merge') {
      // Open album creation dialog
      setAlbumNameDialog({
        open: true,
        sourceId,
        targetId
      });
    } else {
      // Reorder writings
      const direction = dragOverType === 'move-left' ? 'before' : 'after';
      setWritings(ws => {
        const copy = [...ws];
        const sourceIndex = copy.findIndex(w => w.id === sourceId);
        const targetIndex = copy.findIndex(w => w.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) return ws;
        
        const [item] = copy.splice(sourceIndex, 1);
        const insertIndex = direction === 'before' ? targetIndex : targetIndex + 1;
        copy.splice(insertIndex > sourceIndex ? insertIndex - 1 : insertIndex, 0, item);
        
        return copy;
      });
    }
  };

  const onDragLeave = () => {
    setDragOverId(null);
    setDragOverType(null);
  };

  const onDropOnAlbum = (e: React.DragEvent, albumId: string) => {
    e.preventDefault();
    const sourceId = Number(e.dataTransfer.getData('text/plain'));
    if (!sourceId) return;

    setAlbums(albums => albums.map(album => 
      album.id === albumId 
        ? { ...album, itemIds: Array.from(new Set([...album.itemIds, sourceId])) }
        : album
    ));
    
    setDragOverAlbumId(null);
    toast({ 
      title: 'Succes', 
      description: 'Scrierea a fost adăugată în album.' 
    });
  };

  const createAlbumFromWritings = (name: string, color: string) => {
    const { sourceId, targetId } = albumNameDialog;
    if (!sourceId || !targetId) return;

    const newAlbum = {
      id: String(Date.now()),
      name,
      color,
      itemIds: [sourceId, targetId]
    };

    setAlbums(albums => [newAlbum, ...albums]);
    setAlbumNameDialog({ open: false, sourceId: null, targetId: null });
    
    toast({ 
      title: 'Album creat', 
      description: `Albumul "${name}" a fost creat cu succes.` 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'poetry': return <Heart className="h-4 w-4" />;
      case 'short-story': return <Book className="h-4 w-4" />;
      case 'essay': return <FileText className="h-4 w-4" />;
      case 'article': return <FileText className="h-4 w-4" />;
      case 'song-lyrics': return <Heart className="h-4 w-4" />;
      default: return <PenTool className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'poetry': return 'Poezie';
      case 'short-story': return 'Povestire';
      case 'essay': return 'Eseu';
      case 'article': return 'Articol';
      case 'song-lyrics': return 'Versuri';
      default: return type;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'melancholic': return 'bg-blue-500/20 text-blue-400';
      case 'joyful': return 'bg-yellow-500/20 text-yellow-400';
      case 'contemplative': return 'bg-purple-500/20 text-purple-400';
      case 'passionate': return 'bg-red-500/20 text-red-400';
      case 'nostalgic': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'melancholic': return 'Melancolic';
      case 'joyful': return 'Vesel';
      case 'contemplative': return 'Contemplativ';
      case 'passionate': return 'Pasional';
      case 'nostalgic': return 'Nostalgic';
      default: return mood;
    }
  };

  const deleteWriting = (writingId: number) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmă ștergerea',
      message: 'Ești sigur că vrei să ștergi această scriere? Această acțiune nu poate fi anulată.',
      type: 'warning',
      confirmText: 'Șterge',
      cancelText: 'Anulează',
      onConfirm: () => {
        setWritings(ws => ws.filter(w => w.id !== writingId));
        // Remove from albums as well
        setAlbums(albums => albums.map(album => ({
          ...album,
          itemIds: album.itemIds.filter(id => id !== writingId)
        })));
        toast({ 
          title: 'Șters', 
          description: 'Scrierea a fost ștearsă cu succes.' 
        });
      }
    });
  };

  const deleteAlbum = (albumId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmă ștergerea albumului',
      message: 'Ești sigur că vrei să ștergi acest album? Scrierile din album nu vor fi șterse.',
      type: 'warning', 
      confirmText: 'Șterge Album',
      cancelText: 'Anulează',
      onConfirm: () => {
        setAlbums(albums => albums.filter(a => a.id !== albumId));
        toast({
          title: 'Album șters',
          description: 'Albumul a fost șters cu succes.'
        });
      }
    });
  };

  const editAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    const newName = window.prompt('Nume nou pentru album:', album.name);
    if (!newName || newName === album.name) return;

    setAlbums(albums => albums.map(a => 
      a.id === albumId ? { ...a, name: newName } : a
    ));
    
    toast({
      title: 'Album actualizat',
      description: 'Numele albumului a fost schimbat cu succes.'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PenTool className="h-8 w-8 text-art-accent" />
              <h1 className="text-4xl font-bold gradient-text">
                Scriere Creativă
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Poezii, povestiri și texte creative din sufletul unui visător
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută scrieri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tip text" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                {types.map(t => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}
                {isAdmin && (
                  <SelectItem value="__manage_types">⚙️ Manage types</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={filterMood} onValueChange={setFilterMood}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {moods.map(m => (<SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>))}
                {isAdmin && (
                  <SelectItem value="__manage_moods">⚙️ Manage moods</SelectItem>
                )}
              </SelectContent>
            </Select>

            {isAdmin && (
              <div className="flex gap-2">
                <Button className="bg-art-accent hover:bg-art-accent/80" onClick={() => { setEditing(null); setIsEditorOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adaugă Text
                </Button>
                <Button variant="outline" onClick={() => { /* open manage types/moods UI - will be handled via select special value */ }}>
                  <Filter className="h-4 w-4 mr-2" />
                  Gestionează Etichete
                </Button>
              </div>
            )}
          </div>

          {/* Writings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWritings.map((writing, index) => (
              <div
                key={writing.id}
                className="relative"
                draggable={isAdmin}
                onDragStart={(e) => onDragStart(e, writing.id)}
                onDragOver={(e) => onDragOverCard(e, writing.id)}
                onDrop={(e) => onDropOnCard(e, writing.id)}
                onDragLeave={onDragLeave}
              >
                {/* Drag Drop Indicator */}
                {dragOverId === writing.id && (
                  <DragDropIndicator 
                    type={dragOverType!} 
                    isActive={true} 
                  />
                )}
                
                <Card 
                  className={`hover-scale cursor-pointer group border-art-accent/20 hover:border-art-accent/50 animate-scale-in ${
                    dragOverId === writing.id ? 'ring-2 ring-offset-2 ring-art-accent/40' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => setSelectedWriting(writing)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        {getTypeIcon(writing.type)}
                        <CardTitle className="text-lg line-clamp-2">{writing.title}</CardTitle>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {writing.isPrivate && !isAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                        {writing.published && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Publicat
                          </Badge>
                        )}
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditing(writing); 
                                setIsEditorOpen(true); 
                              }}
                            >
                              Editează
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                deleteWriting(writing.id); 
                              }}
                            >
                              Șterge
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {writing.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {writing.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-art-accent/20 text-art-accent rounded-md text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {writing.tags.length > 3 && (
                        <span className="px-2 py-1 bg-muted rounded-md text-xs">
                          +{writing.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Type & Mood */}
                    <div className="flex gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400" variant="outline">
                        {getTypeLabel(writing.type)}
                      </Badge>
                      <Badge className={getMoodColor(writing.mood)} variant="outline">
                        {getMoodLabel(writing.mood)}
                      </Badge>
                      {isAdmin && (
                        <div className="ml-2 text-xs text-muted-foreground">ID: {writing.id}</div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Cuvinte</p>
                        <p className="font-semibold text-sm">{writing.wordCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Data
                        </p>
                        <p className="font-semibold text-sm">{writing.dateWritten}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {visibleWritings.length === 0 && (
            <div className="text-center py-12">
              <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite scrieri</p>
            </div>
          )}
        </div>
      </div>

      {/* Reading Modal */}
      <Dialog open={!!selectedWriting} onOpenChange={() => setSelectedWriting(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWriting && (
            <div>
              <DialogHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl mb-2">{selectedWriting.title}</DialogTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(selectedWriting.type)}
                        {getTypeLabel(selectedWriting.type)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {selectedWriting.dateWritten}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {selectedWriting.wordCount} cuvinte
                      </div>
                    </div>
                  </div>
                  <Badge className={getMoodColor(selectedWriting.mood)}>
                    {getMoodLabel(selectedWriting.mood)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-line leading-relaxed">
                  {selectedWriting.content}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Etichete:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWriting.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-art-accent/10 border-art-accent/20">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) setIsEditorOpen(false); }}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editează text' : 'Adaugă text nou'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input placeholder="Titlu" value={editing?.title || ''} onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)} />
              <Select value={editing?.type || types[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, type: v } as WritingPiece : ed)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>{types.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing?.mood || moods[0]?.key} onValueChange={(v) => setEditing(ed => ed ? { ...ed, mood: v } as WritingPiece : ed)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>{moods.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => exec('bold')}><b>B</b></Button>
              <Button size="sm" onClick={() => exec('italic')}><i>I</i></Button>
              <Button size="sm" onClick={() => exec('justifyLeft')}>L</Button>
              <Button size="sm" onClick={() => exec('justifyCenter')}>C</Button>
              <Button size="sm" onClick={() => exec('justifyRight')}>R</Button>
              <Button size="sm" onClick={() => exec('undo')}>Undo</Button>
              <Button size="sm" onClick={() => exec('redo')}>Redo</Button>
            </div>

            <div ref={editorRef} contentEditable className="min-h-[220px] p-4 border border-border rounded prose max-w-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Publicat</Label>
                <input type="checkbox" checked={!!editing?.published} onChange={(e) => setEditing(ed => ed ? { ...ed, published: e.target.checked } : ed)} />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Cuvinte: {countWords(editorRef.current?.innerHTML || editing?.content || '')}</div>
                <Button variant="outline" onClick={() => { setIsEditorOpen(false); /* autosave handled */ }}>Back</Button>
                <Button onClick={saveEditing}>Save</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gestionează tipuri</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2">
            {types.map(t => (
              <div key={t.key} className="flex items-center justify-between">
                <div>{t.label} <span className="text-xs text-muted-foreground">({t.key})</span></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const k = window.prompt('Edit key', t.key) || t.key;
                    const l = window.prompt('Edit label', t.label) || t.label;
                    setTypes(ts => ts.map(x => x.key === t.key ? { key: k, label: l } : x));
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeType(t.key)}>Șterge</Button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Input placeholder="key" value={newTypeKey} onChange={(e) => setNewTypeKey(e.target.value)} />
              <Input placeholder="label" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} />
              <Button onClick={addType}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Moods Dialog */}
      <Dialog open={isManageMoodsOpen} onOpenChange={setIsManageMoodsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gestionează stări</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2">
            {moods.map(m => (
              <div key={m.key} className="flex items-center justify-between">
                <div>{m.label} <span className="text-xs text-muted-foreground">({m.key})</span></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const k = window.prompt('Edit key', m.key) || m.key;
                    const l = window.prompt('Edit label', m.label) || m.label;
                    setMoods(ms => ms.map(x => x.key === m.key ? { key: k, label: l } : x));
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeMood(m.key)}>Șterge</Button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Input placeholder="key" value={newMoodKey} onChange={(e) => setNewMoodKey(e.target.value)} />
              <Input placeholder="label" value={newMoodLabel} onChange={(e) => setNewMoodLabel(e.target.value)} />
              <Button onClick={addMood}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Albums Section */}
      {albums.length > 0 && (
        <div className="mt-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">Albume</h2>
            {isAdmin && (
              <Button 
                onClick={() => setAlbumNameDialog({ open: true, sourceId: null, targetId: null })}
                className="bg-art-accent hover:bg-art-accent/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Album Nou
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                writings={writings}
                onDrop={onDropOnAlbum}
                onWritingClick={(writing: WritingPiece) => setSelectedWriting(writing)}
                isAdmin={isAdmin}
                onDeleteAlbum={deleteAlbum}
                onEditAlbum={editAlbum}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />

      {/* Album Name Dialog */}
      <AlbumNameDialog
        open={albumNameDialog.open}
        onOpenChange={(open) => setAlbumNameDialog(prev => ({ ...prev, open }))}
        onConfirm={createAlbumFromWritings}
      />
    </div>
  );
};

export default CreativeWriting;