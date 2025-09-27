import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, Filter, Book, FileText, Heart, Calendar, Eye, Edit, Trash2, Undo2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, RotateCcw, RotateCw, Settings2, Trash } from 'lucide-react';
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
  lastModified: string;
  tags: string[];
  mood: string;
  isPrivate?: boolean;
  published?: boolean;
  deletedAt?: string;
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
    lastModified: '2024-06-15',
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
    wordCount: 87,
    dateWritten: '2024-03-20',
    lastModified: '2024-03-22',
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
    wordCount: 47,
    dateWritten: '2024-10-05',
    lastModified: '2024-10-05',
    tags: ['toamnă', 'melancolie', 'natura', 'nostalgie'],
    mood: 'melancholic',
    published: true
  },
  {
    id: 4,
    title: 'Dragostea din Ianuarie',
    type: 'poetry',
    content: `În ianuarie rece și tăcut,
Inima mea a început să cânte,
Căci te-am întâlnit pe tine, iubitul,
Și totul s-a făcut mai frumos decât înainte.

Zăpada căzea încet pe ferestre,
Dar în sufletul meu era primăvară,
Ochii tăi albaștri ca cerul senin,
Îmi luminau calea spre fericire adevărată.`,
    excerpt: 'În ianuarie rece și tăcut, Inima mea a început să cânte...',
    wordCount: 52,
    dateWritten: '2024-01-14',
    lastModified: '2024-01-14',
    tags: ['dragoste', 'iarnă', 'romantism'],
    mood: 'joyful',
    published: true
  },
  {
    id: 5,
    title: 'Călătoria prin Timp',
    type: 'short-story',
    content: `Mașina timpului era mai simplă decât îmi imaginasem. Un cadru metalic cu niște fire și cristale stranii. Profesorul Smith mă privea cu un zâmbet enigmatic.

"Ești gata pentru călătoria ta prin istorie?" m-a întrebat.

Nu eram sigur, dar curiozitatea era mai puternică decât frica. Am pășit în interiorul mașinii și totul s-a schimbat...`,
    excerpt: 'Mașina timpului era mai simplă decât îmi imaginasem...',
    wordCount: 76,
    dateWritten: '2024-04-12',
    lastModified: '2024-04-13',
    tags: ['sci-fi', 'aventură', 'timp'],
    mood: 'contemplative',
    published: false
  },
  {
    id: 6,
    title: 'Șoapte de Vânt',
    type: 'poetry',
    content: `Vântul șoptește prin crengile goale,
Povestiri de demult uitate,
Sufletele care au trecut pe-aici,
Și-au lăsat urmele în eternitate.

Ascult cu inima deschisă,
Cuvintele purtate de briză,
Fiecare sunet e o amintire,
Fiecare ecou, o surpriză.`,
    excerpt: 'Vântul șoptește prin crengile goale, Povestiri de demult uitate...',
    wordCount: 44,
    dateWritten: '2024-07-23',
    lastModified: '2024-07-23',
    tags: ['natură', 'vânt', 'amintiri'],
    mood: 'nostalgic',
    published: true
  },
  {
    id: 7,
    title: 'Cafeneaua de pe Colț',
    type: 'short-story',
    content: `Cafeneaua de pe colț avea ceva special. Nu era doar mirosul de cafea proaspătă sau muzica jazz care se scurgea lin din boxe. Era atmosfera, oamenii, poveștile care se țeseau la fiecare masă.

Maria, proprietara, știa numele fiecărui client regulat și comanda lui preferată. Ea era sufletul locului, femeia care făcea din acel spațiu mic un univers întreg.`,
    excerpt: 'Cafeneaua de pe colț avea ceva special...',
    wordCount: 94,
    dateWritten: '2024-08-15',
    lastModified: '2024-08-16',
    tags: ['viață urbană', 'oameni', 'atmosferă'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 8,
    title: 'Ultimul Dans',
    type: 'poetry',
    content: `Muzica încet se stinge,
Lumina se face slabă,
E ultimul dans al serii,
Și inima mea suspină.

Te țin strâns în brațe,
Știind că va fi ultimul,
Timpul ne desparte încet,
Dar dragostea rămâne eternă.`,
    excerpt: 'Muzica încet se stinge, Lumina se face slabă...',
    wordCount: 38,
    dateWritten: '2024-09-03',
    lastModified: '2024-09-03',
    tags: ['dragoste', 'despărțire', 'dans'],
    mood: 'melancholic',
    published: false
  },
  {
    id: 9,
    title: 'Grădina Secretă',
    type: 'essay',
    content: `Fiecare dintre noi are o grădină secretă în suflet. Un loc unde plantăm visurile, unde udăm speranțele și unde recoltăm amintirile frumoase.

În grădina mea cresc flori de toate culorile. Sunt florile momentelor fericite, ale întâlnirilor importante, ale realizărilor de care sunt mândru. Dar sunt și buruieni - regretele și temerile care încearcă să sufoc frumusețea.`,
    excerpt: 'Fiecare dintre noi are o grădină secretă în suflet...',
    wordCount: 89,
    dateWritten: '2024-05-28',
    lastModified: '2024-05-30',
    tags: ['filosofie', 'introspecție', 'metaforă'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 10,
    title: 'Zborul Pescărușului',
    type: 'poetry',
    content: `Pescărușul zboară liber,
Deasupra valurilor albe,
Nu știe de griji sau dureri,
Doar simte briza care-l poartă.

Aș vrea să fiu ca el,
Să zbor fără destinație,
Să mă las dus de vânt,
Să găsesc în zbor eliberarea.`,
    excerpt: 'Pescărușul zboară liber, Deasupra valurilor albe...',
    wordCount: 42,
    dateWritten: '2024-06-30',
    lastModified: '2024-06-30',
    tags: ['libertate', 'natură', 'zbor'],
    mood: 'joyful',
    published: true
  },
  {
    id: 11,
    title: 'Scrisoarea Nescrisă',
    type: 'short-story',
    content: `De zece ani păstrez în sertar o scrisoare nescrisă. E adresată ție, celui care ai plecat fără să spui nimic. În fiecare zi mă gândesc să o scriu, dar cuvintele se împotmolesc în gât.

Ce să-ți spun? Că îmi lipsești? Că îmi pare rău pentru cearta noastră? Că aș da orice să te văd din nou zâmbind? Toate acestea și multe altele se învârt în mintea mea, dar hârtia rămâne albă.`,
    excerpt: 'De zece ani păstrez în sertar o scrisoare nescrisă...',
    wordCount: 112,
    dateWritten: '2024-02-14',
    lastModified: '2024-02-15',
    tags: ['regret', 'prietenie', 'comunicare'],
    mood: 'melancholic',
    published: false
  },
  {
    id: 12,
    title: 'Cafeaua de Dimineață',
    type: 'essay',
    content: `Există ceva magic în prima cană de cafea a zilei. E momentul când mintea se trezește încet, când gândurile încep să se așeze în ordine și când ziua îți dezvăluie posibilitățile.

Stau la fereastră și privesc orașul care se trezește. Oamenii grăbiți, mașinile în trafic, viața care își reia cursul. În această liniște a dimineții, cu cafeaua caldă în mâini, totul pare posibil.`,
    excerpt: 'Există ceva magic în prima cană de cafea a zilei...',
    wordCount: 95,
    dateWritten: '2024-11-02',
    lastModified: '2024-11-02',
    tags: ['dimineață', 'ritual', 'reflecție'],
    mood: 'contemplative',
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
  
  // albums state (must be declared early to avoid temporal dead zone)
  const [albums, setAlbums] = useState<Album[]>([]);
  
  // trash state for deleted items (24h retention)
  const [trashedWritings, setTrashedWritings] = useState<WritingPiece[]>([]);

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

  // Get writings that are not in albums and not deleted
  const writingsNotInAlbums = writings.filter(w => {
    if (w.deletedAt) return false;
    return !albums.some(album => album.itemIds.includes(w.id));
  });

  // search across title and content, diacritics-insensitive
  const visibleWritings = (isAdmin ? writingsNotInAlbums : writingsNotInAlbums.filter(w => !w.isPrivate)).filter(writing => {
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
    const now = new Date().toISOString().slice(0,10);
    const updated: WritingPiece = { 
      ...editing, 
      content: contentHtml, 
      wordCount: plainTextWordCount,
      lastModified: now,
      dateWritten: editing.dateWritten || now
    };
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
    const trash = localStorage.getItem('cw_trash');
    if (trash) setTrashedWritings(JSON.parse(trash));
    
    // Clean up old trash (older than 24h)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    setTrashedWritings(items => items.filter(item => {
      if (!item.deletedAt) return false;
      return new Date(item.deletedAt).getTime() > oneDayAgo;
    }));
  }, []);

  // save on changes
  useEffect(() => { localStorage.setItem('cw_writings', JSON.stringify(writings)); }, [writings]);
  useEffect(() => { localStorage.setItem('cw_types', JSON.stringify(types)); }, [types]);
  useEffect(() => { localStorage.setItem('cw_moods', JSON.stringify(moods)); }, [moods]);
  useEffect(() => { localStorage.setItem('cw_albums', JSON.stringify(albums)); }, [albums]);
  useEffect(() => { localStorage.setItem('cw_trash', JSON.stringify(trashedWritings)); }, [trashedWritings]);

  // (albums state moved up)

  // drag/drop state
  const dragItemId = useRef<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragOverType, setDragOverType] = useState<'merge' | 'move-left' | 'move-right' | null>(null);
  const [dragOverAlbumId, setDragOverAlbumId] = useState<string | null>(null);

  // trash dialog state
  const [isTrashOpen, setIsTrashOpen] = useState(false);
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
    lastModified: new Date().toISOString().slice(0,10),
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
      message: 'Ești sigur că vrei să muți această scriere în coșul de gunoi?',
      type: 'warning',
      confirmText: 'Mută în coș',
      cancelText: 'Anulează',
      onConfirm: () => {
        const writing = writings.find(w => w.id === writingId);
        if (writing) {
          // Move to trash
          setTrashedWritings(trash => [...trash, { ...writing, deletedAt: new Date().toISOString() }]);
          // Remove from writings
          setWritings(ws => ws.filter(w => w.id !== writingId));
          // Remove from albums as well
          setAlbums(albums => albums.map(album => ({
            ...album,
            itemIds: album.itemIds.filter(id => id !== writingId)
          })));
          toast({ 
            title: 'Mutat în coș', 
            description: 'Scrierea a fost mutată în coșul de gunoi.' 
          });
        }
      }
    });
  };

  const deleteAlbumAndWritings = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    setConfirmDialog({
      open: true,
      title: 'Confirmă ștergerea albumului',
      message: `Ești sigur că vrei să ștergi albumul "${album.name}" și toate scrierile din el? Acestea vor fi mutate în coșul de gunoi.`,
      type: 'warning', 
      confirmText: 'Șterge totul',
      cancelText: 'Anulează',
      onConfirm: () => {
        // Move all writings in album to trash
        const writingsToTrash = writings.filter(w => album.itemIds.includes(w.id));
        setTrashedWritings(trash => [
          ...trash, 
          ...writingsToTrash.map(w => ({ ...w, deletedAt: new Date().toISOString() }))
        ]);
        // Remove writings from main list
        setWritings(ws => ws.filter(w => !album.itemIds.includes(w.id)));
        // Remove album
        setAlbums(albums => albums.filter(a => a.id !== albumId));
        toast({
          title: 'Album șters',
          description: 'Albumul și scrierile au fost mutate în coșul de gunoi.'
        });
      }
    });
  };

  const discardAlbum = (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;

    setConfirmDialog({
      open: true,
      title: 'Desfă albumul',
      message: `Ești sigur că vrei să desfaci albumul "${album.name}"? Scrierile se vor întoarce în biblioteca principală.`,
      type: 'info',
      confirmText: 'Desfă albumul',
      cancelText: 'Anulează',
      onConfirm: () => {
        // Just remove the album, writings stay in the main list
        setAlbums(albums => albums.filter(a => a.id !== albumId));
        toast({
          title: 'Album desfăcut',
          description: 'Scrierile au fost returnate în biblioteca principală.'
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
            
            <Select value={filterType} onValueChange={(value) => {
              if (value === '__manage_types') {
                setIsManageTypesOpen(true);
              } else {
                setFilterType(value);
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tip text" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate tipurile</SelectItem>
                {types.map(t => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}
                {isAdmin && (
                  <SelectItem value="__manage_types">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-3 w-3" />
                      Gestionează tipuri
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={filterMood} onValueChange={(value) => {
              if (value === '__manage_moods') {
                setIsManageMoodsOpen(true);
              } else {
                setFilterMood(value);
              }
            }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                {moods.map(m => (<SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>))}
                {isAdmin && (
                  <SelectItem value="__manage_moods">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-3 w-3" />
                      Gestionează stări
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  className="bg-art-accent hover:bg-art-accent/80" 
                  onClick={startNewEditing}
                  title="Adaugă text nou"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                
                {trashedWritings.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTrashOpen(true)}
                    title="Coșul de gunoi"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                      {trashedWritings.length}
                    </span>
                  </Button>
                )}
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
                              title="Editează"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                deleteWriting(writing.id); 
                              }}
                              title="Mută în coș"
                            >
                              <Trash2 className="h-3 w-3" />
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

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Cuvinte</p>
                        <p className="font-semibold text-sm">{writing.wordCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Modificat
                        </p>
                        <p className="font-semibold text-sm">{writing.lastModified}</p>
                      </div>
                    </div>

                    {/* Type & Mood */}
                    <div className="flex gap-2 justify-center">
                      <Badge className="bg-blue-500/20 text-blue-400" variant="outline">
                        {getTypeLabel(writing.type)}
                      </Badge>
                      <Badge className={getMoodColor(writing.mood)} variant="outline">
                        {getMoodLabel(writing.mood)}
                      </Badge>
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
              <Button size="sm" variant="outline" onClick={() => exec('bold')} title="Bold">
                <Bold className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('italic')} title="Italic">
                <Italic className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('justifyLeft')} title="Aliniere stânga">
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('justifyCenter')} title="Aliniere centru">
                <AlignCenter className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('justifyRight')} title="Aliniere dreapta">
                <AlignRight className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('undo')} title="Undo">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => exec('redo')} title="Redo">
                <RotateCw className="h-3 w-3" />
              </Button>
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
                onDeleteAlbum={deleteAlbumAndWritings}
                onEditAlbum={editAlbum}
                onDiscardAlbum={discardAlbum}
              />
            ))}
          </div>
        </div>
      )}

      {/* Trash Dialog */}
      <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Trash className="h-5 w-5" />
                Coșul de gunoi ({trashedWritings.length} elemente)
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {trashedWritings.length === 0 ? (
              <div className="text-center py-8">
                <Trash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Coșul de gunoi este gol</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {trashedWritings.map(writing => (
                  <div key={writing.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{writing.title}</h4>
                      <p className="text-sm text-muted-foreground">{writing.excerpt}</p>
                      <p className="text-xs text-muted-foreground">
                        Șters: {writing.deletedAt ? new Date(writing.deletedAt).toLocaleString('ro-RO') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Restore writing
                          const restored = { ...writing };
                          delete restored.deletedAt;
                          setWritings(ws => [restored, ...ws]);
                          setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                          toast({ title: 'Restaurat', description: 'Scrierea a fost restaurată.' });
                        }}
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Restaurează
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: 'Șterge definitiv',
                            message: 'Ești sigur că vrei să ștergi definitiv această scriere? Această acțiune nu poate fi anulată.',
                            type: 'warning',
                            confirmText: 'Șterge definitiv',
                            cancelText: 'Anulează',
                            onConfirm: () => {
                              setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                              toast({ title: 'Șters definitiv', description: 'Scrierea a fost ștearsă definitiv.' });
                            }
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Șterge definitiv
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {trashedWritings.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Elementele se șterg automat după 24 de ore.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      title: 'Golește coșul',
                      message: 'Ești sigur că vrei să ștergi definitiv toate elementele din coșul de gunoi?',
                      type: 'warning',
                      confirmText: 'Golește coșul',
                      cancelText: 'Anulează',
                      onConfirm: () => {
                        setTrashedWritings([]);
                        toast({ title: 'Coș golit', description: 'Toate elementele au fost șterse definitiv.' });
                        setIsTrashOpen(false);
                      }
                    });
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Golește coșul
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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