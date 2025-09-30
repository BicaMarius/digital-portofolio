import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, Plus, Search, Filter, Book, FileText, Heart, Calendar, Eye, Edit, Trash2, Undo2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, RotateCcw, RotateCw, Settings2, Trash, X, Save, Album, Grid3X3, List, ArrowUp, FolderPlus } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
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

// Extended writing used internally to maintain a manual order for drag & drop.
// Persisted shape can omit 'order' safely; when missing it's inferred by index.
interface OrderedWriting extends WritingPiece { order: number }

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
  },
  {
    id: 13,
    title: 'Marea și Visurile',
    type: 'poetry',
    content: `Marea cântă mereu aceeași melodie,
Valurile și-au găsit ritmul perfect,
Fiecare undă poartă o poveste,
Fiecare spumă, un vis neîmplinit.

Stau pe țărm și ascult,
Cum îmi șoptește secretele adâncului,
Cum îmi vorbește despre eternitate,
Cum mă îndeamnă să visez mai mult.`,
    excerpt: 'Marea cântă mereu aceeași melodie, Valurile și-au găsit ritmul perfect...',
    wordCount: 51,
    dateWritten: '2024-07-08',
    lastModified: '2024-07-08',
    tags: ['mare', 'visuri', 'natură', 'eternitate'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 14,
    title: 'Amintiri din Copilărie',
    type: 'short-story',
    content: `Casa bunicilor avea mirosul acela special pe care nu-l voi uita niciodată. Lemn vechi, flori uscate și prăjituri de sâmbătă. În fiecare vară mă întorceam acolo ca într-un refugiu magic.

Bunicul îmi povestea despre războiul din tinerețe, bunica mă învăța să fac cozonac. Erau zile lungi și calde, fără griji, când timpul părea că stă în loc și fericirea era ceva de la sine înțeles.`,
    excerpt: 'Casa bunicilor avea mirosul acela special pe care nu-l voi uita niciodată...',
    wordCount: 108,
    dateWritten: '2024-08-20',
    lastModified: '2024-08-21',
    tags: ['copilărie', 'bunici', 'amintiri', 'nostalgie'],
    mood: 'nostalgic',
    published: true
  },
  {
    id: 15,
    title: 'Dansul Frunzelor',
    type: 'poetry',
    content: `Frunzele dansează în vânt,
Ca niște balerini nebuni,
Învârtindu-se spre cer,
Apoi căzând ușor pe păpădii.

Privesc acest spectacol,
Și înțeleg frumusețea schimbării,
Cum totul se transformă,
Cum nimic nu rămâne neschimbat.`,
    excerpt: 'Frunzele dansează în vânt, Ca niște balerini nebuni...',
    wordCount: 39,
    dateWritten: '2024-10-12',
    lastModified: '2024-10-12',
    tags: ['frunze', 'dans', 'schimbare', 'natură'],
    mood: 'joyful',
    published: true
  },
  {
    id: 16,
    title: 'Prietenia Adevărată',
    type: 'essay',
    content: `Prietenia adevărată e ca un comori rar găsit. Nu e măsurată în numărul de mesaje trimise sau în frecvența întâlnirilor. E în acele momente când cineva te înțelege fără cuvinte.

Am învățat că prietenii adevărați sunt cei care rămân lângă tine când totul pare să meargă prost, care îți spun adevărul chiar când doare, care îți celebrează succesele fără gelozie.`,
    excerpt: 'Prietenia adevărată e ca un comori rar găsit...',
    wordCount: 87,
    dateWritten: '2024-09-15',
    lastModified: '2024-09-16',
    tags: ['prietenie', 'relații', 'adevăr', 'loialitate'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 17,
    title: 'Noaptea Înstelată',
    type: 'poetry',
    content: `Sub cerul înstelat stau și privesc,
Miliarde de lumini îndepărtate,
Fiecare stea o lume necunoscută,
Fiecare constelație, o poveste.

Mă simt atât de mic și totuși,
În același timp, parte din totul,
Legat de univers printr-un fir invizibil,
Care mă face să mă simt acasă.`,
    excerpt: 'Sub cerul înstelat stau și privesc, Miliarde de lumini îndepărtate...',
    wordCount: 48,
    dateWritten: '2024-06-25',
    lastModified: '2024-06-25',
    tags: ['noapte', 'stele', 'univers', 'conexiune'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 18,
    title: 'Călătorul Singur',
    type: 'short-story',
    content: `Trenul către necunoscut pleca în fiecare dimineață la ora șapte. Am stat luni întregi și m-am uitat la el, întrebându-mă unde duc șinele acelea și ce se întâmplă cu oamenii care urcă în el.

Într-o zi am luat decizia. Am cumpărat un bilet fără destinație și am urcat. Nu știam unde mă duc, dar pentru prima dată în viață simțeam că trăiesc cu adevărat.`,
    excerpt: 'Trenul către necunoscut pleca în fiecare dimineață la ora șapte...',
    wordCount: 95,
    dateWritten: '2024-04-03',
    lastModified: '2024-04-04',
    tags: ['călătorie', 'aventură', 'necunoscut', 'libertate'],
    mood: 'joyful',
    published: true
  },
  {
    id: 19,
    title: 'Răspunsuri în Ceai',
    type: 'essay',
    content: `Ceaiul are o magie aparte. Nu e doar băutura caldă care îți încălzește corpul într-o zi rece. E ritualul, e pauza, e momentul când îți permiți să te oprești din goană și să respiri.

În fiecare cană de ceai se ascund răspunsuri. La întrebări pe care nici măcar nu știai că le ai. E suficient să bei încet, să simți căldura, să lași mintea să se liniștească.`,
    excerpt: 'Ceaiul are o magie aparte. Nu e doar băutura caldă care îți încălzește corpul...',
    wordCount: 92,
    dateWritten: '2024-11-15',
    lastModified: '2024-11-15',
    tags: ['ceai', 'ritual', 'liniște', 'răspunsuri'],
    mood: 'contemplative',
    published: true
  },
  {
    id: 20,
    title: 'Ultimul Petec de Zăpadă',
    type: 'poetry',
    content: `Ultimul petec de zăpadă se topește,
Sub soarele timid de martie,
Iarna își ia rămas bun încet,
Lăsând loc primăverii să înflorească.

Privesc cum dispare,
Acest ultim martor al frigului,
Și simt cum în inimă se naște,
Un nou început, o nouă speranță.`,
    excerpt: 'Ultimul petec de zăpadă se topește, Sub soarele timid de martie...',
    wordCount: 43,
    dateWritten: '2024-03-15',
    lastModified: '2024-03-15',
    tags: ['primăvară', 'schimbare', 'speranță', 'nou început'],
    mood: 'joyful',
    published: true
  }
];

const CreativeWriting: React.FC = () => {
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dateModified' | 'dateCreated' | 'title' | 'wordCount'>('dateModified');
  const [searchInAlbums, setSearchInAlbums] = useState(false);
  const [selectedWriting, setSelectedWriting] = useState<WritingPiece | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Mobile view state - add view mode selector for mobile
  const [mobileViewMode, setMobileViewMode] = useState<'writings' | 'albums'>('writings');
  const [mobileCurrentPage, setMobileCurrentPage] = useState(0);
  const [mobileItemsPerPage] = useState(4); // fewer items per page on mobile
  
  // Mobile album pagination
  const [mobileAlbumCurrentPage, setMobileAlbumCurrentPage] = useState(0);
  const [mobileAlbumsPerPage] = useState(2); // 2 albums per page on mobile
  
  // Scroll position memory for mobile
  const [writingsScrollPosition, setWritingsScrollPosition] = useState(0);
  
  // Removed legacy touch/long-press/swipe state (moved to tap interaction model)
  
  const writingsGridRef = useRef<HTMLDivElement | null>(null);

  // make writings editable in local state (mock persists in-memory only)
  // Add a manual order field so drag & drop reordering isn't lost by sorting
  const [writings, setWritings] = useState<OrderedWriting[]>(
    mockWritings.map((w, idx) => ({ ...w, order: idx }))
  );
  const [useManualOrder, setUseManualOrder] = useState(false);
  
  // albums state (must be declared early to avoid temporal dead zone)
  const [albums, setAlbums] = useState<Album[]>([]);
  
  // trash state for deleted items (24h retention)
  const [trashedWritings, setTrashedWritings] = useState<WritingPiece[]>([]);

  // Pagination for main writings grid (2 rows; columns depend on viewport)
  const [currentPage, setCurrentPage] = useState(0);
  const [columns, setColumns] = useState(3);
  const [itemsPerPage, setItemsPerPage] = useState(6); // columns * 2

  // admin-managed type and mood lists
  const [types, setTypes] = useState<Array<{ name: string; color: string }>>([
    { name: 'Poezie', color: 'bg-pink-500/20 text-pink-400' },
    { name: 'Povestire', color: 'bg-green-500/20 text-green-400' },
    { name: 'Eseu', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Articol', color: 'bg-gray-500/20 text-gray-400' },
    { name: 'Versuri', color: 'bg-purple-500/20 text-purple-400' }
  ]);
  const [moods, setMoods] = useState<Array<{ name: string; color: string }>>([
    { name: 'Melancolic', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Vesel', color: 'bg-yellow-500/20 text-yellow-400' },
    { name: 'Contemplativ', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Pasional', color: 'bg-red-500/20 text-red-400' },
    { name: 'Nostalgic', color: 'bg-orange-500/20 text-orange-400' }
  ]);

  // editor dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WritingPiece | null>(null);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [isManageMoodsOpen, setIsManageMoodsOpen] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('bg-gray-500/20 text-gray-400');
  const [newMoodLabel, setNewMoodLabel] = useState('');
  const [newMoodColor, setNewMoodColor] = useState('bg-gray-500/20 text-gray-400');
  
  // Edit dialog states
  const [editingType, setEditingType] = useState<{ name: string; color: string } | null>(null);
  const [editingMood, setEditingMood] = useState<{ name: string; color: string } | null>(null);

  // Predefined color options for types
  const colorOptions = [
    { label: 'Roz', value: 'bg-pink-500/20 text-pink-400' },
    { label: 'Verde', value: 'bg-green-500/20 text-green-400' },
    { label: 'Albastru', value: 'bg-blue-500/20 text-blue-400' },
    { label: 'Portocaliu', value: 'bg-orange-500/20 text-orange-400' },
    { label: 'Violet', value: 'bg-purple-500/20 text-purple-400' },
    { label: 'Roșu', value: 'bg-red-500/20 text-red-400' },
    { label: 'Galben', value: 'bg-yellow-500/20 text-yellow-400' },
    { label: 'Cyan', value: 'bg-cyan-500/20 text-cyan-400' },
    { label: 'Indigo', value: 'bg-indigo-500/20 text-indigo-400' },
    { label: 'Gri', value: 'bg-gray-500/20 text-gray-400' }
  ];

  // helper: normalize string removing diacritics and lowercase
  const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Removed legacy gesture handlers

  // Get writings that are not in albums and not deleted
  const writingsNotInAlbums = writings.filter(w => {
    if (w.deletedAt) return false;
    return !albums.some(album => album.itemIds.includes(w.id));
  });

  // Get all writings in albums (for search in albums mode)
  const writingsInAlbums = searchInAlbums ? writings.filter(w => {
    if (w.deletedAt) return false;
    return albums.some(album => album.itemIds.includes(w.id));
  }).map(w => {
    const album = albums.find(a => a.itemIds.includes(w.id));
    return { ...w, _albumId: album?.id, _albumColor: album?.color };
  }) : [];

  // Combine base writings with album writings when searching in albums
  // Show identical set for admins and non-admins (read-only mode just gates actions)
  const baseWritings = writingsNotInAlbums;
  const searchPool = searchInAlbums ? [...baseWritings, ...writingsInAlbums] : baseWritings;

  // search across title and content, diacritics-insensitive
  const filteredWritings = searchPool.filter(writing => {
    const term = normalize(searchTerm.trim());
    if (!term) return (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
    const hay = normalize(writing.title + ' ' + writing.content + ' ' + writing.tags.join(' '));
    return hay.includes(term) && (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
  });

  // Apply sorting
  // Apply sorting unless a manual drag order is in effect
  const allVisibleWritings = [...filteredWritings].sort((a, b) => {
    if (useManualOrder) {
      const ao = (a as OrderedWriting).order ?? 0;
      const bo = (b as OrderedWriting).order ?? 0;
      return ao - bo;
    }
    switch (sortBy) {
      case 'dateCreated':
        return new Date(b.dateWritten).getTime() - new Date(a.dateWritten).getTime();
      case 'dateModified':
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      case 'title':
        return a.title.localeCompare(b.title, 'ro');
      case 'wordCount':
        return b.wordCount - a.wordCount;
      default:
        return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(allVisibleWritings.length / itemsPerPage || 1);
  const visibleWritings = allVisibleWritings.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterType, filterMood]);

  // Auto-adjust page when items are removed and current page becomes empty
  useEffect(() => {
    if (currentPage > 0 && visibleWritings.length === 0 && allVisibleWritings.length > 0) {
      const newTotalPages = Math.ceil(allVisibleWritings.length / itemsPerPage || 1);
      setCurrentPage(Math.max(0, newTotalPages - 1));
    }
  }, [allVisibleWritings.length, currentPage, visibleWritings.length, itemsPerPage]);
  
  // Add itemsPerPage as dependency for pagination effect
  useEffect(() => {}, [itemsPerPage]);
  

  // Search results from albums when enabled
  const albumSearchResults = searchInAlbums && searchTerm.trim() ? 
    albums.flatMap(album => {
      const albumWritings = writings.filter(w => album.itemIds.includes(w.id) && !w.deletedAt);
      const filteredWritings = (isAdmin ? albumWritings : albumWritings.filter(w => !w.isPrivate)).filter(writing => {
        const term = normalize(searchTerm.trim());
        const hay = normalize(writing.title + ' ' + writing.content + ' ' + writing.tags.join(' '));
        return hay.includes(term) && (filterType === 'all' || writing.type === filterType) && (filterMood === 'all' || writing.mood === filterMood);
      });
      
      return filteredWritings.map(writing => ({
        ...writing,
        _albumInfo: { id: album.id, name: album.name, color: album.color }
      }));
    }) : [];

  // Get first verse/line from content for preview
  const getFirstVerse = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const lines = plainText.split('\n').filter(line => line.trim());
    return lines.slice(0, 2).join(' ').substring(0, 120) + (lines.length > 2 ? '...' : '');
  };

  // Update excerpt for new writings
  const updateWritingExcerpt = (writing: WritingPiece): WritingPiece => {
    if (!writing.excerpt || writing.excerpt.length < 50) {
      return {
        ...writing,
        excerpt: getFirstVerse(writing.content)
      };
    }
    return writing;
  };

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
      excerpt: getFirstVerse(contentHtml), // Auto-generate excerpt
      wordCount: plainTextWordCount,
      lastModified: now,
      dateWritten: editing.dateWritten || now
    };
    setWritings(ws => {
      if (ws.some(w => w.id === updated.id)) {
        return ws.map(w => w.id === updated.id ? { ...(w as OrderedWriting), ...updated } : w);
      }
      // new item: assign new id & order to top (0) and shift others
      const nextId = Math.max(0, ...ws.map(w => w.id)) + 1;
      updated.id = nextId;
      const newItem: OrderedWriting = { ...(updated as WritingPiece), order: 0 };
      const shifted = ws.map(w => ({ ...w, order: w.order + 1 }));
      return [newItem, ...shifted];
    });
    setIsEditorOpen(false);
    toast({ title: 'Salvat', description: 'Textul a fost salvat în bibliotecă.' });
  };

  // manage types/moods add/remove
  const addType = () => {
    if (!newTypeLabel.trim()) return;
    setTypes(t => [...t, { name: newTypeLabel, color: newTypeColor }]);
    setNewTypeLabel(''); setNewTypeColor('bg-gray-500/20 text-gray-400');
  };
  const removeType = (name: string) => setTypes(t => t.filter(i => i.name !== name));
  const addMood = () => {
    if (!newMoodLabel.trim()) return;
    setMoods(m => [...m, { name: newMoodLabel, color: newMoodColor }]);
    setNewMoodLabel(''); setNewMoodColor('bg-gray-500/20 text-gray-400');
  };
  const removeMood = (name: string) => setMoods(m => m.filter(i => i.name !== name));

  // when editor opens, populate contentEditable
  useEffect(() => {
    if (isEditorOpen) {
      requestAnimationFrame(() => {
        if (editorRef.current) {
          // For new writing (id === 0), always start with empty content
          if (editing?.id === 0) {
            editorRef.current.innerHTML = '';
          } else {
            // For existing writings, load draft if exists
            const draftKey = editing ? `cw_draft_${editing.id}` : 'cw_draft_new';
            const draft = localStorage.getItem(draftKey);
            editorRef.current.innerHTML = draft ?? editing?.content ?? '';
          }
        }
      });
    }
  }, [isEditorOpen, editing]);

  // responsive columns based on actual grid width (ensures exactly 2 rows visible)
  useEffect(() => {
    const targetCardMin = 250; // base desired min card width
    const maxColumns = 12;
    const calc = () => {
      const el = writingsGridRef.current;
      if (!el) return;
      const style = window.getComputedStyle(el);
      const gap = parseFloat(style.columnGap || '20');
      const width = el.clientWidth;
      let cols = Math.floor((width + gap) / (targetCardMin + gap));
      cols = Math.max(1, Math.min(maxColumns, cols));
      const viewport = window.innerWidth;
      // Ensure at least 4 columns on desktop widths even if container narrower due to initial layout timing
      if (viewport >= 1024 && cols < 4) cols = 4;
      // Existing adaptive rules
      if (width >= 1000 && cols < 4) cols = 4;
      if (width >= 1180 && cols < 5) cols = 5;
      if (width < 2100 && cols > 5) cols = 5;
      if (width >= 2100 && cols < 6) cols = 6;
      if (width >= 2500 && cols < 7) cols = 7;
      setColumns(prev => prev !== cols ? cols : prev);
      setItemsPerPage(cols * 2); // keep 2 rows visible
    };
    // Run twice: immediately and after next paint (in case ref width changes once mounted)
    calc();
    requestAnimationFrame(calc);
    const obs = new ResizeObserver(() => calc());
    if (writingsGridRef.current) obs.observe(writingsGridRef.current);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('resize', calc);
      obs.disconnect();
    };
  }, []);

  // Keep itemsPerPage synced if columns changes externally
  useEffect(() => {
    setItemsPerPage(columns * 2);
  }, [columns]);


  // Helper functions for migrating old data
  const getDefaultTypeColor = (key: string): string => {
    switch (key) {
      case 'poetry':
      case 'Poezie': return 'bg-pink-500/20 text-pink-400';
      case 'short-story':
      case 'Povestire': return 'bg-green-500/20 text-green-400';
      case 'essay':
      case 'Eseu': return 'bg-blue-500/20 text-blue-400';
      case 'article':
      case 'Articol': return 'bg-gray-500/20 text-gray-400';
      case 'song-lyrics':
      case 'Versuri': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDefaultMoodColor = (key: string): string => {
    switch (key) {
      case 'melancholic':
      case 'Melancolic': return 'bg-blue-500/20 text-blue-400';
      case 'joyful':
      case 'Vesel': return 'bg-yellow-500/20 text-yellow-400';
      case 'contemplative':
      case 'Contemplativ': return 'bg-purple-500/20 text-purple-400';
      case 'passionate':
      case 'Pasional': return 'bg-red-500/20 text-red-400';
      case 'nostalgic':
      case 'Nostalgic': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Function to migrate old key-based writings to name-based
  const migrateWritingTypes = (writings: WritingPiece[]): WritingPiece[] => {
    return writings.map(w => ({
      ...w,
      type: w.type === 'poetry' ? 'Poezie' :
            w.type === 'short-story' ? 'Povestire' :
            w.type === 'essay' ? 'Eseu' :
            w.type === 'article' ? 'Articol' :
            w.type === 'song-lyrics' ? 'Versuri' : w.type,
      mood: w.mood === 'melancholic' ? 'Melancolic' :
            w.mood === 'joyful' ? 'Vesel' :
            w.mood === 'contemplative' ? 'Contemplativ' :
            w.mood === 'passionate' ? 'Pasional' :
            w.mood === 'nostalgic' ? 'Nostalgic' : w.mood
    }));
  };

  // persistence: load from localStorage on mount
  useEffect(() => {
    const st = localStorage.getItem('cw_types');
    if (st) {
      const loadedTypes = JSON.parse(st);
      // Migrate old types to include colors if they don't have them
      const migratedTypes = loadedTypes.map((t: { key?: string; label?: string; name?: string; color?: string }) => ({
        name: t.name || t.label || t.key || 'Unknown',
        color: t.color || getDefaultTypeColor(t.key || t.name || t.label || '')
      }));
      setTypes(migratedTypes);
    }
    
    const sm = localStorage.getItem('cw_moods');
    if (sm) {
      const loadedMoods = JSON.parse(sm);
      // Migrate old moods to include colors if they don't have them
      const migratedMoods = loadedMoods.map((m: { key?: string; label?: string; name?: string; color?: string }) => ({
        name: m.name || m.label || m.key || 'Unknown',
        color: m.color || getDefaultMoodColor(m.key || m.name || m.label || '')
      }));
      setMoods(migratedMoods);
    }

    // Migrate writings to use new name-based system
    const saved = localStorage.getItem('cw_writings');
    if (saved) {
      const loadedWritings = JSON.parse(saved);
  const migratedWritings = migrateWritingTypes(loadedWritings).map((w: WritingPiece, idx: number) => ({ ...w, order: idx }));
  setWritings(migratedWritings as OrderedWriting[]);
    }
    
    const sa = localStorage.getItem('cw_albums');
    if (sa) {
      setAlbums(JSON.parse(sa));
    } else {
      // Set default albums if none exist
      const defaultAlbums: Album[] = [
        {
          id: 'favorite-poems',
          name: 'Poezii Favorite',
          color: '#EC4899',
          icon: 'Heart',
          itemIds: []
        },
        {
          id: 'short-stories',
          name: 'Povestiri Scurte',
          color: '#10B981',
          icon: 'Book',
          itemIds: []
        },
        {
          id: 'personal-essays',
          name: 'Eseuri Personale',
          color: '#3B82F6',
          icon: 'FileText',
          itemIds: []
        }
      ];
      setAlbums(defaultAlbums);
    }
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

  // Sync function for cloud storage (placeholder for backend integration)
  const syncDataToCloud = useCallback(async (dataType: string, data: unknown) => {
    if (!isAdmin) return;
    
    try {
      // TODO: Replace with actual backend API call
      // await fetch('/api/creative-writing/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ dataType, data, timestamp: Date.now() })
      // });
      
      // For now, just store in a separate localStorage key for "cloud" simulation
      const cloudKey = `cw_cloud_${dataType}`;
      const cloudData = {
        data,
        timestamp: Date.now(),
        deviceId: navigator.userAgent // Simple device identification
      };
      localStorage.setItem(cloudKey, JSON.stringify(cloudData));
      
      console.log(`Synced ${dataType} to cloud simulation`);
    } catch (error) {
      console.error(`Failed to sync ${dataType}:`, error);
    }
  }, [isAdmin]);

  // save on changes and sync for admin
  useEffect(() => { 
    localStorage.setItem('cw_writings', JSON.stringify(writings)); 
    if (isAdmin) syncDataToCloud('writings', writings);
  }, [writings, isAdmin, syncDataToCloud]);
  useEffect(() => { 
    localStorage.setItem('cw_types', JSON.stringify(types)); 
    if (isAdmin) syncDataToCloud('types', types);
  }, [types, isAdmin, syncDataToCloud]);
  useEffect(() => { 
    localStorage.setItem('cw_moods', JSON.stringify(moods)); 
    if (isAdmin) syncDataToCloud('moods', moods);
  }, [moods, isAdmin, syncDataToCloud]);
  useEffect(() => { 
    localStorage.setItem('cw_albums', JSON.stringify(albums)); 
    if (isAdmin) syncDataToCloud('albums', albums);
  }, [albums, isAdmin, syncDataToCloud]);
  useEffect(() => { localStorage.setItem('cw_trash', JSON.stringify(trashedWritings)); }, [trashedWritings]);

  // Reset mobile page when search/filter changes
  useEffect(() => {
    setMobileCurrentPage(0);
    setMobileAlbumCurrentPage(0);
  }, [searchTerm, filterType, filterMood, mobileViewMode]);

  // Save and restore scroll position when switching views on mobile
  useEffect(() => {
    if (isMobile) {
      const saveCurrentScroll = () => {
        if (mobileViewMode === 'writings') {
          setWritingsScrollPosition(window.scrollY);
        }
      };

      // Save scroll position before view change
      if (mobileViewMode === 'albums') {
        // Restore writings scroll position when switching back to writings
        setTimeout(() => {
          window.scrollTo(0, writingsScrollPosition);
        }, 100);
      } else {
        // Save current scroll when on writings
        window.addEventListener('scroll', saveCurrentScroll);
      }

      return () => {
        window.removeEventListener('scroll', saveCurrentScroll);
      };
    }
  }, [mobileViewMode, isMobile, writingsScrollPosition]);

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
  // Context menu for right-click on a writing
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; writingId: number | null }>({ open: false, x: 0, y: 0, writingId: null });
  const [contextTargetWriting, setContextTargetWriting] = useState<WritingPiece | null>(null);
  const [hoveredAlbumSubmenu, setHoveredAlbumSubmenu] = useState(false);
  // Mobile action bar selection
  const [mobileSelectedWritingId, setMobileSelectedWritingId] = useState<number | null>(null);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.open) {
        // Don't close on right-click events that are opening a context menu
        if (e.type === 'contextmenu') {
          return;
        }
        setContextMenu({ open: false, x: 0, y: 0, writingId: null });
        setHoveredAlbumSubmenu(false);
      }
    };

    if (contextMenu.open) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [contextMenu.open]);

  // helper to start editor with autosave drafts
  const startNewEditing = () => {
    // Clear any existing draft for new writing
    localStorage.removeItem('cw_draft_new');
    
    openEditorFor({
      id: 0,
      title: '',
      type: types[0]?.name || 'Poezie',
      content: '',
      excerpt: '',
      wordCount: 0,
      dateWritten: new Date().toISOString().slice(0,10),
      lastModified: new Date().toISOString().slice(0,10),
      tags: [],
      mood: moods[0]?.name || 'Contemplativ',
      published: false
    });
  };

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
      // Reorder writings manually
      const direction = dragOverType === 'move-left' ? 'before' : 'after';
      setWritings(ws => {
        const copy = [...ws];
        const sourceIndex = copy.findIndex(w => w.id === sourceId);
        const targetIndex = copy.findIndex(w => w.id === targetId);
        if (sourceIndex === -1 || targetIndex === -1) return ws;
        const [item] = copy.splice(sourceIndex, 1);
        const insertIndex = direction === 'before' ? targetIndex : targetIndex + 1;
        copy.splice(insertIndex > sourceIndex ? insertIndex - 1 : insertIndex, 0, item);
        // Reassign order values sequentially
  (copy as OrderedWriting[]).forEach((w, i) => { w.order = i; });
        return copy;
      });
      setUseManualOrder(true);
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

    // Check if writing is already in the target album
    const targetAlbum = albums.find(album => album.id === albumId);
    if (targetAlbum?.itemIds.includes(sourceId)) {
      // Writing is already in this album, don't show success message
      return;
    }

    // Remove writing from all other albums (move, don't copy)
    setAlbums(albums => albums.map(album => {
      if (album.id === albumId) {
        // Add to target album
        return { ...album, itemIds: Array.from(new Set([...album.itemIds, sourceId])) };
      } else {
        // Remove from any other albums
        return { ...album, itemIds: album.itemIds.filter(id => id !== sourceId) };
      }
    }));
    
    setDragOverAlbumId(null);
    toast({ 
      title: 'Succes', 
      description: 'Scrierea a fost mutată în album.' 
    });
  };

  const createAlbumFromWritings = (name: string, color: string) => {
    const { sourceId, targetId } = albumNameDialog;
    
    // Create album with available IDs (can be empty, single item, or pair)
    const itemIds = [sourceId, targetId].filter(id => id !== null) as number[];
    
    const newAlbum: Album = {
      id: String(Date.now()),
      name,
      color,
      itemIds
    };

    setAlbums(albs => [newAlbum, ...albs]);
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
    const typeConfig = types.find(t => t.name === type);
    return typeConfig?.name || type;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = types.find(t => t.name === type);
    return typeConfig?.color || 'bg-muted text-muted-foreground';
  };

  const getMoodColor = (mood: string) => {
    const moodConfig = moods.find(m => m.name === mood);
    return moodConfig?.color || 'bg-muted text-muted-foreground';
  };

  const getMoodLabel = (mood: string) => {
    const moodConfig = moods.find(m => m.name === mood);
    return moodConfig?.name || mood;
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

  const moveWritingToTop = (writingId: number) => {
    setWritings(prev => {
      const target = prev.find(w => w.id === writingId);
      if (!target) return prev;
      const others = prev.filter(w => w.id !== writingId);
      const reordered = [target, ...others] as OrderedWriting[];
      // Reassign order values
      reordered.forEach((w, i) => { w.order = i; });
      return reordered;
    });
    setUseManualOrder(true);
    toast({ title: 'Mutat sus', description: 'Scrierea a fost mutată pe prima poziție.' });
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

  const addWritingsToAlbum = (albumId: string, writingIds: number[]) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: [...a.itemIds, ...writingIds] }
        : a
    ));
    
    toast({
      title: 'Scrieri adăugate',
      description: `${writingIds.length} scrieri au fost adăugate în album.`
    });
  };

  const removeWritingFromAlbum = (albumId: string, writingId: number) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: a.itemIds.filter(id => id !== writingId) }
        : a
    ));
    
    toast({
      title: 'Scriere scoasă din album',
      description: 'Scrierea a fost returnată în biblioteca principală.'
    });
  };

  const deleteWritingFromAlbum = (albumId: string, writingId: number) => {
    // First remove from album
    setAlbums(albums => albums.map(a => 
      a.id === albumId 
        ? { ...a, itemIds: a.itemIds.filter(id => id !== writingId) }
        : a
    ));
    
    // Then delete the writing (move to trash)
    deleteWriting(writingId);
  };

  const updateAlbum = (albumId: string, updates: { name?: string; color?: string; itemIds?: number[] }) => {
    setAlbums(albums => albums.map(a => 
      a.id === albumId ? { ...a, ...updates } : a
    ));
    
    if (updates.name || updates.color) {
      toast({
        title: 'Album actualizat',
        description: 'Modificările au fost salvate cu succes.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
  <div className="mx-auto w-full max-w-[1600px]">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-in">
            {isMobile ? (
              /* Mobile: Simplified header */
              <h1 className="text-xl font-bold gradient-text">
                Scriere Creativă
              </h1>
            ) : (
              /* Desktop: Full header */
              <>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <PenTool className="h-6 w-6 text-art-accent" />
                  <h1 className="text-2xl font-bold gradient-text">
                    Scriere Creativă
                  </h1>
                </div>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  Poezii, povestiri și texte creative din sufletul unui visător
                </p>
              </>
            )}
          </div>

          {/* Controls - responsive: expandable on mobile, normal on desktop */}
          <div className="mb-2">
            {isMobile ? (
              /* Mobile: Clean search controls */
              <div className="p-3">
                <div className="flex items-center gap-2">
                  {/* Search Input - More space */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={searchInAlbums ? "Caută în toate..." : "Caută scrieri..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 h-9 border-art-accent/30 focus:border-art-accent/50 ${
                        searchInAlbums 
                          ? 'bg-art-accent/10 border-art-accent/50' 
                          : 'bg-background/50'
                      }`}
                    />
                  </div>
                  
                  {/* Compact Controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Filter Button */}
                    <button
                      onClick={() => setIsFilterModalOpen(true)}
                      className={`h-8 w-8 rounded-md border transition-colors flex items-center justify-center ${
                        (filterType !== 'all' || filterMood !== 'all')
                          ? 'bg-art-accent text-white border-art-accent shadow-sm'
                          : 'bg-background/40 text-muted-foreground border-border hover:text-foreground'
                      }`}
                      title="Filtrează și sortează"
                    >
                      <Filter className="h-4 w-4" />
                    </button>
                    
                    {/* Search In Albums Toggle (compact icon) */}
                    <button
                      onClick={() => setSearchInAlbums(v => !v)}
                      className={`h-8 w-8 rounded-md border transition-colors flex items-center justify-center ${
                        searchInAlbums
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-background/40 text-muted-foreground border-border hover:text-foreground'
                      }`}
                      title={searchInAlbums ? "Caută în toate albumele" : "Caută doar în biblioteca principală"}
                    >
                      <Album className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop: Original single-row layout */
              <div className="animate-slide-up">
                <div className="bg-surface/30 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Search bar with integrated toggle */}
                    <div className="flex items-center gap-4 flex-1 lg:max-w-lg">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={searchInAlbums ? "Caută în toate scrierile..." : "Caută scrieri..."}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-28 w-full"
                        />
                        
                        {/* Album toggle - integrated inside search bar */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-xs cursor-pointer whitespace-nowrap">
                          <span className="text-muted-foreground select-none hidden sm:inline">În albume</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              id="searchInAlbums"
                              checked={searchInAlbums}
                              onChange={(e) => setSearchInAlbums(e.target.checked)}
                              className="sr-only"
                            />
                            <label 
                              htmlFor="searchInAlbums"
                              className={`relative inline-block w-8 h-4 rounded-full transition-colors cursor-pointer ${
                                searchInAlbums 
                                  ? 'bg-gradient-to-r from-primary to-primary/80' 
                                  : 'bg-muted border border-muted-foreground/20'
                              }`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${
                                searchInAlbums ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filters and actions */}
                    <div className="flex items-center gap-2 lg:gap-3">
                      {/* Filters */}
                      <Select value={filterType} onValueChange={(value) => {
                        if (value === '__manage_types') {
                          setIsManageTypesOpen(true);
                        } else {
                          setFilterType(value);
                        }
                      }}>
                        <SelectTrigger className="w-[140px] sm:w-[160px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Toate tipurile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toate tipurile</SelectItem>
                          {types.map(t => (<SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>))}
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
                        <SelectTrigger className="w-[120px] sm:w-[140px]">
                          <SelectValue placeholder="Toate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toate</SelectItem>
                          {moods.map(m => (<SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>))}
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

                      {/* Actions */}
                      {isAdmin && (
                        <>
                          <Button 
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-md flex-shrink-0"
                            onClick={startNewEditing}
                            title="Adaugă text nou"
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Adaugă text</span>
                            <span className="sm:hidden">Nou</span>
                          </Button>
                          {trashedWritings.length > 0 && (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsTrashOpen(true)}
                              title="Coșul de gunoi"
                              className="flex-shrink-0"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                                {trashedWritings.length}
                              </span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile View Selector - only on mobile */}
          {isMobile && (
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <div className="flex bg-muted/50 rounded-lg p-1">
                  <button
                    onClick={() => setMobileViewMode('writings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mobileViewMode === 'writings'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Scrieri ({writingsNotInAlbums.length})
                  </button>
                  <button
                    onClick={() => setMobileViewMode('albums')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mobileViewMode === 'albums'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Book className="h-4 w-4" />
                    Albume ({albums.length})
                  </button>
                  {/* Trash tab - only show if has items */}
                  {trashedWritings.length > 0 && (
                    <button
                      onClick={() => setIsTrashOpen(true)}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground relative"
                      title="Coșul de gunoi"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="text-[10px] bg-red-500 text-white rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center leading-none">
                        {trashedWritings.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Writings Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text">
              {isMobile 
                ? (mobileViewMode === 'writings' ? 'Scrieri' : 'Albume')
                : 'Scrieri'
              }
            </h2>
            {/* Add total count */}
            <span className="text-xs text-muted-foreground">
              Total: {isMobile 
                ? (mobileViewMode === 'writings' ? allVisibleWritings.length : albums.length)
                : allVisibleWritings.length
              }
            </span>
          </div>

          {/* Main Content Area */}
          {isMobile ? (
            // Mobile Layout
            <div className="space-y-4 mb-6">
              {mobileViewMode === 'writings' ? (
                // Mobile Writings - narrow rectangular cards
                <>
                  {(isMobile ? allVisibleWritings : visibleWritings).map((writing, index) => (
                    <div
                      key={writing.id}
                      className="relative"
                      draggable={isAdmin && !isMobile}
                      onDragStart={!isMobile ? (e) => onDragStart(e, writing.id) : undefined}
                      onDragOver={!isMobile ? (e) => onDragOverCard(e, writing.id) : undefined}
                      onDrop={!isMobile ? (e) => onDropOnCard(e, writing.id) : undefined}
                      onDragLeave={!isMobile ? onDragLeave : undefined}
                      {...(!isMobile && {
                        onContextMenu: (e) => {
                          if (!isAdmin) {
                            // Blochează meniul custom și pe cel implicit
                            e.preventDefault();
                            return;
                          }
                          e.preventDefault();
                          setContextMenu({ open: true, x: e.clientX, y: e.clientY, writingId: writing.id });
                          setContextTargetWriting(writing);
                        }
                      })}
                      /* Removed touch gesture handlers and swipe transform */
                    >
                      {/* Drag Drop Indicator */}
                      {dragOverId === writing.id && !isMobile && (
                        <DragDropIndicator 
                          type={dragOverType!} 
                          isActive={true} 
                          context="list"
                        />
                      )}
                      <Card 
                        className={`cursor-pointer group animate-scale-in relative ${
                          dragOverId === writing.id ? 'ring-2 ring-offset-2 ring-art-accent/40' : ''
                        } ${mobileSelectedWritingId === writing.id ? 'ring-2 ring-primary/60' : ''} ${
                          '_albumColor' in writing && writing._albumColor 
                            ? 'border-2' 
                            : 'border-art-accent/20 hover:border-art-accent/50'
                        }`}
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          ...('_albumColor' in writing && writing._albumColor && {
                            borderColor: `${writing._albumColor}99`, // 60% opacity
                            '--tw-ring-color': `${writing._albumColor}66` // 40% opacity for ring
                          })
                        }}
                        onClick={() => {
                          // Click simplu = preview direct
                          setSelectedWriting(writing);
                        }}
                        onTouchStart={(e) => {
                          if (!isMobile || !isAdmin) return;
                          const touch = e.touches[0];
                          const touchStartTime = Date.now();
                          const touchStartX = touch.clientX;
                          const touchStartY = touch.clientY;
                          
                          const longPressTimer = setTimeout(() => {
                            // Long press = opțiuni
                            setMobileSelectedWritingId(writing.id);
                          }, 500);
                          
                          const handleTouchEnd = () => {
                            clearTimeout(longPressTimer);
                            document.removeEventListener('touchend', handleTouchEnd);
                            document.removeEventListener('touchmove', handleTouchMove);
                          };
                          
                          const handleTouchMove = (moveEvent: TouchEvent) => {
                            const touch = moveEvent.touches[0];
                            const deltaX = Math.abs(touch.clientX - touchStartX);
                            const deltaY = Math.abs(touch.clientY - touchStartY);
                            if (deltaX > 10 || deltaY > 10) {
                              clearTimeout(longPressTimer);
                            }
                          };
                          
                          document.addEventListener('touchend', handleTouchEnd);
                          document.addEventListener('touchmove', handleTouchMove);
                        }}
                      >
                        <CardContent className="p-3 relative">
                          {/* Mobile action bar */}
                          {mobileSelectedWritingId === writing.id && isMobile && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-background/95 backdrop-blur px-2 py-1 rounded-full shadow border border-border animate-fade-in">
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Mută prima" onClick={(e) => { e.stopPropagation(); moveWritingToTop(writing.id); }}>
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              {albums.length > 0 && (
                                <Button size="icon" variant="ghost" className="h-7 w-7" title="Adaugă în album" onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setContextTargetWriting(writing);
                                  setContextMenu({ open: true, x: e.currentTarget.getBoundingClientRect().left, y: e.currentTarget.getBoundingClientRect().bottom + 5, writingId: writing.id });
                                  setHoveredAlbumSubmenu(true);
                                }}>
                                  <FolderPlus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Șterge" onClick={(e) => { e.stopPropagation(); deleteWriting(writing.id); setMobileSelectedWritingId(null); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Închide" onClick={(e) => { e.stopPropagation(); setMobileSelectedWritingId(null); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {/* Tag in top-right corner */}
                          <div className="absolute top-2 right-2">
                            <Badge 
                              className={`text-xs ${getTypeColor(writing.type)}`}
                            >
                              {getTypeLabel(writing.type)}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-base line-clamp-2 leading-tight mb-2 pr-16">
                            {writing.title}
                          </h3>
                          
                          {/* Preview text */}
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                            {writing.excerpt}
                          </p>
                          
                          {/* Bottom meta: date | wordcount */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {writing.lastModified} | {writing.wordCount} cuvinte
                            </div>
                            {isAdmin && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditing(writing); 
                                  setIsEditorOpen(true); 
                                }}
                                title="Editează"
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </>
              ) : (
                // Mobile Albums view - properly mobile-friendly
                <div className="space-y-4 mb-6 px-2">
                  {/* Mobile Add Album button */}
                  {isAdmin && (
                    <div className="mb-6">
                      <Button 
                        onClick={() => setAlbumNameDialog({ open: true, sourceId: null, targetId: null })}
                        className="bg-art-accent hover:bg-art-accent/80 w-full"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Creează Album Nou
                      </Button>
                    </div>
                  )}

                  {/* Mobile Albums Grid */}
                  {albums.length > 0 ? (
                    albums.slice(mobileAlbumCurrentPage * mobileAlbumsPerPage, (mobileAlbumCurrentPage + 1) * mobileAlbumsPerPage).map((album) => (
                      <div key={album.id} className="mx-2">
                        <AlbumCard
                          album={album}
                          writings={writings.filter(w => album.itemIds.includes(w.id) && !w.deletedAt)}
                          allWritings={writings.filter(w => !w.deletedAt)}
                          onDrop={onDropOnAlbum}
                          onWritingClick={setSelectedWriting}
                          onEditWriting={(writing) => {
                            setEditing(writing);
                            setIsEditorOpen(true);
                          }}
                          onUpdateAlbum={(albumId, updates) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId ? { ...a, ...updates } : a
                            ));
                          }}
                          onDeleteAlbum={deleteAlbumAndWritings}
                          onAddWritingsToAlbum={(albumId, writingIds) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId 
                                ? { ...a, itemIds: Array.from(new Set([...(a.itemIds || []), ...writingIds])) }
                                : a
                            ));
                          }}
                          onRemoveWritingFromAlbum={(albumId, writingId) => {
                            setAlbums(prev => prev.map(a => 
                              a.id === albumId 
                                ? { ...a, itemIds: (a.itemIds || []).filter(id => id !== writingId) }
                                : a
                            ));
                          }}
                          onDeleteWritingFromAlbum={(_albumId, writingId) => {
                            // Move writing to trash
                            const writing = writings.find(w => w.id === writingId);
                            if (writing) {
                              setTrashedWritings(prev => [...prev, { ...writing, deletedAt: new Date().toISOString() }]);
                              setWritings(prev => prev.filter(w => w.id !== writingId));
                            }
                          }}
                          isAdmin={isAdmin}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nu există albume create încă</p>
                      {isAdmin && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Folosește butonul de mai sus pentru a crea primul album
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mobile Album pagination dots */}
                  {albums.length > mobileAlbumsPerPage && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      {Array.from({ length: Math.ceil(albums.length / mobileAlbumsPerPage) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setMobileAlbumCurrentPage(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === mobileAlbumCurrentPage 
                              ? 'bg-art-accent w-6' 
                              : 'bg-art-accent/30'
                          }`}
                          aria-label={`Go to album page ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Desktop Layout - existing grid
            <>
              <div
                ref={writingsGridRef}
                className="writings-grid grid gap-5 md:gap-6 mb-6"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {visibleWritings.map((writing, index) => (
                  <div
                    key={writing.id}
                    className="relative w-full h-full"
                    draggable={isAdmin && !isMobile}
                    onDragStart={!isMobile ? (e) => onDragStart(e, writing.id) : undefined}
                    onDragOver={!isMobile ? (e) => onDragOverCard(e, writing.id) : undefined}
                    onDrop={!isMobile ? (e) => onDropOnCard(e, writing.id) : undefined}
                    onDragLeave={!isMobile ? onDragLeave : undefined}
                    onContextMenu={(e) => {
                      if (!isAdmin) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      setContextMenu({ open: true, x: e.clientX, y: e.clientY, writingId: writing.id });
                      setContextTargetWriting(writing);
                    }}
                  >
                    {/* Drag Drop Indicator */}
                    {dragOverId === writing.id && !isMobile && (
                      <DragDropIndicator 
                        type={dragOverType!} 
                        isActive={true} 
                      />
                    )}
                    <Card 
                      className={`hover-scale cursor-pointer group border-art-accent/20 hover:border-art-accent/50 animate-scale-in h-full flex flex-col min-h-[240px] ${
                        dragOverId === writing.id ? 'ring-2 ring-offset-2 ring-art-accent/40' : ''
                      }`
                      }
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={() => setSelectedWriting(writing)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getTypeIcon(writing.type)}
                            <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">{writing.title}</CardTitle>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditing(writing); 
                                  setIsEditorOpen(true); 
                                }}
                                title="Editează"
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col p-4">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-1">
                          {writing.excerpt}
                        </p>
                        <div className="space-y-2 mt-auto">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Book className="h-3 w-3" />
                                {writing.wordCount} cuvinte
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {writing.lastModified}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline"  
                              className={`${getMoodColor(writing.mood)} text-xs`}
                            >
                              {getMoodLabel(writing.mood)}
                            </Badge>
                            <Badge 
                              className={`text-xs ${getTypeColor(writing.type)}`}
                            >
                              {getTypeLabel(writing.type)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Album search results */}
                {searchInAlbums && albumSearchResults.map((writing: WritingPiece & { _albumInfo?: { id: string; name?: string; color?: string } }, index) => (
                  <div
                    key={`album-${writing.id}`}
                    className="relative w-full h-full"
                  >
                    <Card 
                      className="hover-scale cursor-pointer group animate-scale-in border-2 h-full flex flex-col"
                      style={{ 
                        animationDelay: `${(visibleWritings.length + index) * 100}ms`,
                        borderColor: writing._albumInfo?.color || '#7c3aed'
                      }}
                      onClick={() => setSelectedWriting(writing)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            {getTypeIcon(writing.type)}
                            <CardTitle className="text-lg line-clamp-2">{writing.title}</CardTitle>
                          </div>
                          <div className="flex flex-col gap-1 ml-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: writing._albumInfo?.color || '#7c3aed',
                                color: writing._albumInfo?.color || '#7c3aed'
                              }}
                            >
                              {writing._albumInfo?.name}
                            </Badge>
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {writing.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Book className="h-3 w-3" />
                              {writing.wordCount} cuvinte
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {writing.lastModified}
                            </span>
                          </div>
                          <Badge 
                            variant="outline"  
                            className={getMoodColor(writing.mood)}
                          >
                            {getMoodLabel(writing.mood)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Desktop Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-3"
                  >
                    ←
                  </Button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-8 h-8 rounded-full text-sm transition-all duration-200 ${
                          index === currentPage 
                            ? 'bg-primary text-primary-foreground shadow-lg' 
                            : 'bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3"
                  >
                    →
                  </Button>
                </div>
              )}
            </>
          )}

          {allVisibleWritings.length === 0 && (
            <div className="text-center py-12 mb-8">
              <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nu au fost găsite scrieri</p>
            </div>
          )}
        </div>
      </div>

      {/* Reading Modal */}
      <Dialog open={!!selectedWriting} onOpenChange={() => setSelectedWriting(null)}>
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedWriting.content }} />
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={(open) => { if (!open) setIsEditorOpen(false); }}>
        <DialogContent className={`${isMobile ? 'max-w-full h-full w-full m-0 p-0 border-0 rounded-none' : 'max-w-3xl w-full'}`}>
          {isMobile ? (
            // Mobile fullscreen editor - redesigned like note app
            <div className="flex flex-col h-full bg-background">
              {/* Mobile header - clean and minimal */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="text-sm font-medium text-center">
                  {editing?.title || 'Text nou'}
                </div>
                <Button 
                  onClick={saveEditing} 
                  size="sm" 
                  className="rounded-full p-2 h-8 w-8"
                  title="Salvează"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Mobile content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Filters bar - horizontal scroll */}
                <div className="p-3 border-b bg-muted/20">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Select value={editing?.type || types[0]?.name} onValueChange={(v) => setEditing(ed => ed ? { ...ed, type: v } as WritingPiece : ed)}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{types.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={editing?.mood || moods[0]?.name} onValueChange={(v) => setEditing(ed => ed ? { ...ed, mood: v } as WritingPiece : ed)}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{moods.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 px-2 rounded border bg-background">
                      <Switch 
                        checked={!!editing?.published} 
                        onCheckedChange={(checked) => setEditing(ed => ed ? { ...ed, published: checked } : ed)}
                        className="scale-75"
                      />
                      <span className="text-xs">Public</span>
                    </div>
                  </div>
                </div>

                {/* Title input */}
                <div className="p-3">
                  <Input 
                    placeholder="Titlu" 
                    value={editing?.title || ''} 
                    onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)}
                    className="border-0 text-xl font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  />
                </div>
                
                {/* Text editor */}
                <div className="flex-1 px-3 pb-3">
                  <div 
                    ref={editorRef} 
                    contentEditable 
                    className="w-full h-full p-3 border-0 outline-none resize-none text-base leading-relaxed bg-transparent focus:outline-none [&:empty::before]:content-[attr(data-placeholder)] [&:empty::before]:text-muted-foreground" 
                    data-placeholder="Începe să scrii..."
                    style={{ 
                      minHeight: 'calc(100vh - 200px)',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                {/* Bottom toolbar */}
                <div className="p-3 border-t bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => exec('bold')} className="p-2 rounded-full">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exec('italic')} className="p-2 rounded-full">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => exec('undo')} className="p-2 rounded-full">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {countWords(editorRef.current?.innerHTML || editing?.content || '')} cuvinte
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop modal
            <>
              <DialogHeader>
                <DialogTitle>{editing?.id ? 'Editează text' : 'Adaugă text nou'}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input placeholder="Titlu" value={editing?.title || ''} onChange={(e) => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)} />
                  <Select value={editing?.type || types[0]?.name} onValueChange={(v) => setEditing(ed => ed ? { ...ed, type: v } as WritingPiece : ed)}>
                    <SelectTrigger className="w-[120px] sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{types.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={editing?.mood || moods[0]?.name} onValueChange={(v) => setEditing(ed => ed ? { ...ed, mood: v } as WritingPiece : ed)}>
                    <SelectTrigger className="w-[100px] sm:w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{moods.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
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
                  <div className="flex items-center gap-3">
                    <Label htmlFor="published-toggle" className="text-sm font-medium">
                      Publicat
                    </Label>
                    <Switch 
                      id="published-toggle"
                      checked={!!editing?.published} 
                      onCheckedChange={(checked) => setEditing(ed => ed ? { ...ed, published: checked } : ed)} 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">Cuvinte: {countWords(editorRef.current?.innerHTML || editing?.content || '')}</div>
                    <Button variant="outline" onClick={() => { setIsEditorOpen(false); /* autosave handled */ }}>Back</Button>
                    <Button onClick={saveEditing}>Save</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Types Dialog */}
      <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Gestionează tipuri</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            {types.map(t => (
              <Card key={t.name} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{t.name}</div>
                      <Badge className={`text-xs`} style={{ backgroundColor: t.color, color: '#fff' }}>
                        {t.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingType({ name: t.name, color: t.color })}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => removeType(t.name)}
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Tip nou</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume categorie" 
                  value={newTypeLabel} 
                  onChange={(e) => setNewTypeLabel(e.target.value)} 
                />
                <div>
                  <Label className="text-sm font-medium">Culoare</Label>
                  <Select value={newTypeColor} onValueChange={setNewTypeColor}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selectează culoarea..." />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    if (newTypeLabel.trim()) {
                      const key = newTypeLabel.toLowerCase().replace(/\s+/g, '-');
                      setNewTypeLabel(key);
                      addType();
                      setNewTypeLabel('');
                      setNewTypeLabel('');
                    }
                  }}
                  className="w-full"
                >
                  Adaugă tip
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Type Dialog */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm">
          <DialogHeader><DialogTitle>Editează tip</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type-name">Nume categorie</Label>
              <Input 
                id="edit-type-name"
                value={editingType?.name || ''} 
                onChange={(e) => setEditingType(prev => prev ? { ...prev, name: e.target.value } : null)} 
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Culoare</Label>
              <Select 
                value={editingType?.color || 'bg-gray-500/20 text-gray-400'} 
                onValueChange={(value) => setEditingType(prev => prev ? { ...prev, color: value } : null)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Selectează culoarea..." />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (editingType) {
                    setTypes(ts => ts.map(x => x.name === editingType.name ? { 
                      name: editingType.name, 
                      color: editingType.color 
                    } : x));
                    setEditingType(null);
                  }
                }}
                className="flex-1"
              >
                Salvează
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingType(null)}
                className="flex-1"
              >
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Moods Dialog */}
      <Dialog open={isManageMoodsOpen} onOpenChange={setIsManageMoodsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader><DialogTitle>Gestionează stări</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            {moods.map(m => (
              <Card key={m.name} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{m.name}</div>
                      <Badge className={`text-xs`} style={{ backgroundColor: m.color, color: '#fff' }}>
                        {m.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingMood({ name: m.name, color: m.color })}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => removeMood(m.name)}
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="p-4 border-dashed">
              <div className="text-sm font-medium mb-3">Stare nouă</div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nume stare" 
                  value={newMoodLabel} 
                  onChange={(e) => setNewMoodLabel(e.target.value)} 
                />
                <div>
                  <Label className="text-sm font-medium">Culoare</Label>
                  <Select value={newMoodColor} onValueChange={setNewMoodColor}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selectează culoarea..." />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    if (newMoodLabel.trim()) {
                      const key = newMoodLabel.toLowerCase().replace(/\s+/g, '-');
                      setNewMoodLabel(key);
                      addMood();
                      setNewMoodLabel('');
                      setNewMoodLabel('');
                    }
                  }}
                  className="w-full"
                >
                  Adaugă stare
                </Button>
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Mood Dialog */}
      <Dialog open={!!editingMood} onOpenChange={(open) => !open && setEditingMood(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editează stare</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-mood-name">Nume stare</Label>
              <Input 
                id="edit-mood-name"
                value={editingMood?.name || ''} 
                onChange={(e) => setEditingMood(prev => prev ? { ...prev, name: e.target.value } : null)} 
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Culoare</Label>
              <Select 
                value={editingMood?.color || 'bg-gray-500/20 text-gray-400'} 
                onValueChange={(value) => setEditingMood(prev => prev ? { ...prev, color: value } : null)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Selectează culoarea..." />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.value}`}></div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  if (editingMood) {
                    setMoods(ms => ms.map(x => x.name === editingMood.name ? { 
                      name: editingMood.name, 
                      color: editingMood.color 
                    } : x));
                    setEditingMood(null);
                  }
                }}
                className="flex-1"
              >
                Salvează
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingMood(null)}
                className="flex-1"
              >
                Anulează
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Filtrare și Sortare</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Type Filter */}
            <div>
              <Label className="text-sm font-medium">Tip scriere</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full mt-1 bg-background border-art-accent/30 focus:border-art-accent/50">
                  <SelectValue placeholder="Selectează tipul..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate tipurile</SelectItem>
                  {types.map(t => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setIsManageTypesOpen(true); setIsFilterModalOpen(false); }}
                  className="w-full mt-1 text-xs"
                >
                  <Settings2 className="h-3 w-3 mr-1" /> Gestionează tipuri
                </Button>
              )}
            </div>

            {/* Mood Filter */}
            <div>
              <Label className="text-sm font-medium">Stare/Sentiment</Label>
              <Select value={filterMood} onValueChange={setFilterMood}>
                <SelectTrigger className="w-full mt-1 bg-background border-art-accent/30 focus:border-art-accent/50">
                  <SelectValue placeholder="Selectează starea..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate stările</SelectItem>
                  {moods.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setIsManageMoodsOpen(true); setIsFilterModalOpen(false); }}
                  className="w-full mt-1 text-xs"
                >
                  <Settings2 className="h-3 w-3 mr-1" /> Gestionează stări
                </Button>
              )}
            </div>

            {/* Sort Options */}
            <div>
              <Label className="text-sm font-medium">Sortare după</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'dateModified' | 'dateCreated' | 'title' | 'wordCount')}>
                <SelectTrigger className="w-full mt-1 bg-background border-art-accent/30 focus:border-art-accent/50">
                  <SelectValue placeholder="Selectează sortarea..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dateModified">Data modificării</SelectItem>
                  <SelectItem value="dateCreated">Data creării</SelectItem>
                  <SelectItem value="title">Titlu</SelectItem>
                  <SelectItem value="wordCount">Numărul de cuvinte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterType('all');
                  setFilterMood('all');
                  setSortBy('dateModified');
                }}
                className="flex-1"
              >
                Resetează filtre
              </Button>
              <Button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 bg-art-accent hover:bg-art-accent/80"
              >
                OK
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Albums Section - desktop only */}
      {albums.length > 0 && !isMobile && (
        <div className="mt-1 mx-auto w-full max-w-[1600px] pb-12">
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
          
          {isMobile ? (
            <div className="mobile-albums-container">
              <div 
                className="albums-grid grid grid-cols-1 gap-5 mb-6 px-4"
              >
                {albums
                  .slice(mobileAlbumCurrentPage * mobileAlbumsPerPage, (mobileAlbumCurrentPage + 1) * mobileAlbumsPerPage)
                  .map(album => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      writings={writings}
                      allWritings={writings}
                      onDrop={onDropOnAlbum}
                      onWritingClick={(writing: WritingPiece) => setSelectedWriting(writing)}
                      onEditWriting={(writing: WritingPiece) => { setEditing(writing); setIsEditorOpen(true); }}
                      isAdmin={isAdmin}
                      onDeleteAlbum={deleteAlbumAndWritings}
                      onEditAlbum={editAlbum}
                      onDiscardAlbum={discardAlbum}
                      onAddWritingsToAlbum={addWritingsToAlbum}
                      onRemoveWritingFromAlbum={removeWritingFromAlbum}
                      onDeleteWritingFromAlbum={deleteWritingFromAlbum}
                      onUpdateAlbum={updateAlbum}
                    />
                  ))}
              </div>
              
              {/* Album pagination dots for mobile */}
              {albums.length > mobileAlbumsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(albums.length / mobileAlbumsPerPage) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setMobileAlbumCurrentPage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === mobileAlbumCurrentPage 
                          ? 'bg-art-accent w-6' 
                          : 'bg-art-accent/30'
                      }`}
                      aria-label={`Go to album page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="albums-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-5 md:gap-6 mb-6">
              {albums.map(album => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  writings={writings}
                  allWritings={writings}
                  onDrop={onDropOnAlbum}
                  onWritingClick={(writing: WritingPiece) => setSelectedWriting(writing)}
                  onEditWriting={(writing: WritingPiece) => { setEditing(writing); setIsEditorOpen(true); }}
                  isAdmin={isAdmin}
                  onDeleteAlbum={deleteAlbumAndWritings}
                  onEditAlbum={editAlbum}
                  onDiscardAlbum={discardAlbum}
                  onAddWritingsToAlbum={addWritingsToAlbum}
                  onRemoveWritingFromAlbum={removeWritingFromAlbum}
                  onDeleteWritingFromAlbum={deleteWritingFromAlbum}
                  onUpdateAlbum={updateAlbum}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Add Writing Button (Mobile) */}
      {isMobile && isAdmin && mobileViewMode === 'writings' && !isEditorOpen && (
        <button
          onClick={startNewEditing}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center active:scale-95 transition-transform"
          title="Adaugă scriere"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Trash Dialog */}
      <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">
              <div className="flex items-center gap-2">
                <Trash className="h-5 w-5" />
                Coș de gunoi ({trashedWritings.length})
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {trashedWritings.length === 0 ? (
              <div className="text-center py-8">
                <Trash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Coșul este gol</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedWritings.map(writing => {
                  const deletedDate = writing.deletedAt ? new Date(writing.deletedAt) : new Date();
                  const formatDate = (date: Date) => {
                    const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];
                    return `${date.getDate()}${months[date.getMonth()]} | ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                  };
                  
                  return (
                    <div key={writing.id} className="p-3 border rounded-lg bg-muted/20">
                      <h4 className="font-medium text-sm mb-1">{writing.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {writing.excerpt || writing.content.substring(0, 80)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(deletedDate)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Restore writing
                              const restored: OrderedWriting = { ...(writing as WritingPiece), order: 0 };
                              delete restored.deletedAt;
                              setWritings(ws => {
                                // shift existing orders
                                const shifted = ws.map(w => ({ ...w, order: w.order + 1 }));
                                return [restored, ...shifted];
                              });
                              setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                              toast({ title: 'Restaurat', description: 'Scrierea a fost restaurată.' });
                            }}
                            className="p-1 hover:bg-background rounded"
                            title="Restaurează"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                title: 'Șterge definitiv',
                                message: 'Ești sigur că vrei să ștergi definitiv această scriere?',
                                type: 'warning',
                                confirmText: 'Șterge definitiv',
                                cancelText: 'Anulează',
                                onConfirm: () => {
                                  setTrashedWritings(trash => trash.filter(t => t.id !== writing.id));
                                  toast({ title: 'Șters definitiv', description: 'Scrierea a fost ștearsă definitiv.' });
                                }
                              });
                            }}
                            className="p-1 hover:bg-background rounded text-destructive"
                            title="Șterge definitiv"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {trashedWritings.length > 0 && (
            <div className="border-t pt-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setConfirmDialog({
                    open: true,
                    title: 'Golește coșul',
                    message: 'Ștergi definitiv toate elementele?',
                    type: 'warning',
                    confirmText: 'Golește',
                    cancelText: 'Anulează',
                    onConfirm: () => {
                      setTrashedWritings([]);
                      toast({ title: 'Coș golit' });
                      setIsTrashOpen(false);
                    }
                  });
                }}
                className="w-full"
              >
                <Trash className="h-4 w-4 mr-2" />
                Golește coșul
              </Button>
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

      {/* Context menu floating */}
      {contextMenu.open && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setContextMenu({ open: false, x: 0, y: 0, writingId: null })}
          />
          <div 
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 60 }}
          >
          <div className="bg-popover border rounded shadow-md p-1 w-44 backdrop-blur-sm">
            {/* Add to... with hover submenu */}
            <div 
              className="relative"
              onMouseEnter={() => !isMobile && setHoveredAlbumSubmenu(true)}
              onMouseLeave={() => !isMobile && setHoveredAlbumSubmenu(false)}
            >
              <button 
                className="w-full text-left p-2 hover:bg-muted/50 flex items-center justify-between transition-colors"
                onClick={() => isMobile ? setHoveredAlbumSubmenu(!hoveredAlbumSubmenu) : undefined}
              >
                Adaugă în...
                <Plus className="h-3 w-3" />
              </button>
              
              {/* Submenu */}
              {hoveredAlbumSubmenu && (
                <div className="absolute left-full top-0 ml-1 w-48 bg-popover border rounded shadow-lg p-1 backdrop-blur-sm z-70">
                  {albums.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Nu există albume</div>
                  ) : (
                    albums.map(album => (
                      <button
                        key={album.id}
                        onClick={() => {
                          if (!contextTargetWriting) return;
                          setAlbums(albs => albs.map(al => 
                            al.id === album.id 
                              ? { ...al, itemIds: Array.from(new Set([...(al.itemIds||[]), contextTargetWriting.id])) } 
                              : al
                          ));
                          setContextMenu({ open: false, x: 0, y: 0, writingId: null });
                          toast({ title: 'Adăugat', description: `Scrierea a fost adăugată în "${album.name}".` });
                        }}
                        className="w-full text-left p-2 hover:bg-muted/50 text-sm transition-colors flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: album.color || '#7c3aed' }}
                        />
                        {album.name}
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({album.itemIds.length})
                        </span>
                      </button>
                    ))
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      if (!contextTargetWriting) return;
                      const albumName = window.prompt('Nume album nou:');
                      if (!albumName) return;
                      const newAlbum = {
                        id: String(Date.now()),
                        name: albumName,
                        color: '#7c3aed',
                        itemIds: [contextTargetWriting.id]
                      };
                      setAlbums(albs => [newAlbum, ...albs]);
                      setContextMenu({ open: false, x: 0, y: 0, writingId: null });
                      toast({ title: 'Album creat', description: `Albumul "${albumName}" a fost creat cu scrierea.` });
                    }}
                    className="w-full text-left p-2 hover:bg-muted/50 text-sm transition-colors flex items-center gap-2 text-green-600"
                  >
                    <Plus className="h-3 w-3" />
                    Creează album
                  </button>
                </div>
              )}
            </div>
            
            <button 
              className="w-full text-left p-2 hover:bg-muted/50 transition-colors" 
              onClick={() => {
                const id = contextMenu.writingId;
                if (id == null) return;
                // move to first
                setWritings(ws => {
                  const idx = ws.findIndex(w => w.id === id);
                  if (idx === -1) return ws;
                  const copy = [...ws] as OrderedWriting[];
                  const [item] = copy.splice(idx,1);
                  copy.unshift(item);
                  // Reassign order values
                  copy.forEach((w, i) => { w.order = i; });
                  return copy;
                });
                setUseManualOrder(true);
                setContextMenu({ open: false, x:0, y:0, writingId: null });
                toast({ title: 'Mutat', description: 'Scrierea a fost mutată prima.' });
              }}
            >
              Mută prima
            </button>
            
            <button 
              className="w-full text-left p-2 hover:bg-muted/50 text-destructive transition-colors" 
              onClick={() => {
                const id = contextMenu.writingId;
                if (id == null) return;
                setContextMenu({ open: false, x:0, y:0, writingId: null });
                deleteWriting(id);
              }}
            >
              Șterge
            </button>
          </div>
          </div>
        </>
      )}

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